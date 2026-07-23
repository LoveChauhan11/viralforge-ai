import { createHash } from "node:crypto";
import { createLocalAuthProvider, LOCAL_USER_HEADER } from "@viralforge/auth";
import {
  createDb,
  findActiveMembership,
  getAssetByUploadSession,
  getObjectReference,
  newId,
  recordAuthzAudit,
  userExists,
  users,
  workspaceMembers,
  workspaces,
  type Database,
} from "@viralforge/database";
import { createLogger } from "@viralforge/observability";
import { createObjectStorage, type InMemoryObjectStorage } from "@viralforge/storage";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApiApp } from "./app.js";

const databaseUrl =
  process.env.DATABASE_URL ?? "postgresql://viralforge:viralforge@localhost:5432/viralforge";

describe("resumable multipart uploads", () => {
  let db: Database;
  let app: FastifyInstance;
  let storage: InMemoryObjectStorage;
  let userId: string;
  let viewerId: string;
  let workspaceId: string;
  let otherWorkspaceId: string;

  beforeAll(async () => {
    db = createDb(databaseUrl);
    userId = newId();
    viewerId = newId();
    workspaceId = newId();
    otherWorkspaceId = newId();
    storage = createObjectStorage({ mode: "memory" }) as InMemoryObjectStorage;

    await db.insert(users).values([
      { id: userId, email: `up-${userId}@example.invalid`, displayName: "Uploader" },
      { id: viewerId, email: `view-${viewerId}@example.invalid`, displayName: "Viewer" },
    ]);
    await db.insert(workspaces).values([
      {
        id: workspaceId,
        name: "Upload WS",
        slug: `upload-${workspaceId}`,
        ownerUserId: userId,
      },
      {
        id: otherWorkspaceId,
        name: "Other WS",
        slug: `other-${otherWorkspaceId}`,
        ownerUserId: userId,
      },
    ]);
    await db.insert(workspaceMembers).values([
      { id: newId(), workspaceId, userId, role: "owner" },
      { id: newId(), workspaceId, userId: viewerId, role: "viewer" },
      { id: newId(), workspaceId: otherWorkspaceId, userId, role: "owner" },
    ]);

    const auth = createLocalAuthProvider({
      appEnv: "test",
      userExists: (id) => userExists(db, id),
    });

    app = await buildApiApp({
      serviceName: "api",
      appEnv: "test",
      databaseUrl,
      db,
      auth,
      memberships: {
        findActiveMembership: (ws, uid) => findActiveMembership(db, ws, uid),
      },
      audit: { record: (event) => recordAuthzAudit(db, event) },
      logger: createLogger("api-upload-test"),
      storage,
      uploadLimits: {
        maxUploadBytes: 2_147_483_648,
        uploadPartBytes: 8,
        uploadSessionTtlHours: 24,
        signedUrlTtlSeconds: 600,
        maxWorkspaceAssets: 100,
      },
    });
    await app.ready();
  });

  afterAll(async () => {
    await app?.close();
  });

  function authHeaders(uid: string) {
    return { [LOCAL_USER_HEADER]: uid };
  }

  it("creates, resumes after partial upload, completes idempotently, and reconciles storage", async () => {
    const payload = new TextEncoder().encode("0123456789ab"); // 12 bytes → 2 parts of 8
    const sha256 = createHash("sha256").update(payload).digest("hex");

    const create = await app.inject({
      method: "POST",
      url: `/v1/workspaces/${workspaceId}/uploads`,
      headers: authHeaders(userId),
      payload: {
        filename: "clip.mp4",
        mimeType: "video/mp4",
        bytes: payload.byteLength,
        sha256,
      },
    });
    expect(create.statusCode).toBe(201);
    const created = create.json() as {
      upload: { uploadId: string; partCount: number; partSize: number };
    };
    expect(created.upload.partCount).toBe(2);
    expect(created.upload.partSize).toBe(8);
    const uploadId = created.upload.uploadId;

    const partsRes = await app.inject({
      method: "POST",
      url: `/v1/workspaces/${workspaceId}/uploads/${uploadId}/parts`,
      headers: authHeaders(userId),
      payload: { partNumbers: [1, 2] },
    });
    expect(partsRes.statusCode).toBe(200);
    const partsJson = partsRes.json() as {
      parts: Array<{ partNumber: number; url: string }>;
    };
    expect(partsJson.parts).toHaveLength(2);
    expect(partsJson.parts[0]?.url).toContain("memory://");

    // Simulate browser refresh mid-upload: only part 1 lands, then GET resume.
    const sessionRow = (
      await app.inject({
        method: "GET",
        url: `/v1/workspaces/${workspaceId}/uploads/${uploadId}`,
        headers: authHeaders(userId),
      })
    ).json() as { upload: { state: string; multipartUploadId?: string; objectKey?: string } };

    // Fetch session from DB-backed GET; upload parts via storage helper (signed URL is opaque).
    const getBefore = await app.inject({
      method: "GET",
      url: `/v1/workspaces/${workspaceId}/uploads/${uploadId}`,
      headers: authHeaders(userId),
    });
    expect(getBefore.statusCode).toBe(200);
    expect((getBefore.json() as { upload: { state: string } }).upload.state).toBe("uploading");

    // Need multipart id + key from create flow — re-read via complete path using storage list after uploadPart
    const { getUploadSession } = await import("@viralforge/database");
    const session = await getUploadSession(db, workspaceId, uploadId);
    expect(session).not.toBeNull();
    if (!session) throw new Error("missing session");

    const part1 = payload.slice(0, 8);
    const part2 = payload.slice(8);
    const up1 = await storage.uploadPart(
      workspaceId,
      session.objectKey,
      session.multipartUploadId,
      1,
      part1,
    );

    const resume = await app.inject({
      method: "GET",
      url: `/v1/workspaces/${workspaceId}/uploads/${uploadId}`,
      headers: authHeaders(userId),
    });
    expect(resume.statusCode).toBe(200);
    const resumed = resume.json() as {
      upload: { parts: Array<{ partNumber: number; etag: string }> };
    };
    expect(resumed.upload.parts.map((p) => p.partNumber)).toEqual([1]);
    expect(resumed.upload.parts[0]?.etag).toBe(up1.etag);

    const up2 = await storage.uploadPart(
      workspaceId,
      session.objectKey,
      session.multipartUploadId,
      2,
      part2,
    );

    const complete1 = await app.inject({
      method: "POST",
      url: `/v1/workspaces/${workspaceId}/uploads/${uploadId}/complete`,
      headers: authHeaders(userId),
      payload: {
        parts: [
          { partNumber: 1, etag: up1.etag, bytes: part1.byteLength },
          { partNumber: 2, etag: up2.etag, bytes: part2.byteLength },
        ],
      },
    });
    expect(complete1.statusCode).toBe(202);
    const asset1 = (complete1.json() as { asset: { id: string; state: string; bytes: number } })
      .asset;
    expect(asset1.state).toBe("validating");
    expect(asset1.bytes).toBe(payload.byteLength);

    const complete2 = await app.inject({
      method: "POST",
      url: `/v1/workspaces/${workspaceId}/uploads/${uploadId}/complete`,
      headers: authHeaders(userId),
      payload: {
        parts: [
          { partNumber: 1, etag: up1.etag },
          { partNumber: 2, etag: up2.etag },
        ],
      },
    });
    expect(complete2.statusCode).toBe(200);
    expect((complete2.json() as { asset: { id: string } }).asset.id).toBe(asset1.id);

    const head = await storage.headObject(workspaceId, session.objectKey);
    expect(head?.byteSize).toBe(payload.byteLength);
    const ref = await getObjectReference(db, workspaceId, session.objectKey);
    expect(ref?.ownerType).toBe("asset");
    const linked = await getAssetByUploadSession(db, workspaceId, uploadId);
    expect(linked?.id).toBe(asset1.id);
    void sessionRow;
  });

  it("rejects invalid media, oversize, viewer create, and cross-tenant read", async () => {
    const sha = "a".repeat(64);
    const badMime = await app.inject({
      method: "POST",
      url: `/v1/workspaces/${workspaceId}/uploads`,
      headers: authHeaders(userId),
      payload: { filename: "x.exe", mimeType: "application/octet-stream", bytes: 10, sha256: sha },
    });
    expect(badMime.statusCode).toBe(415);

    const tooBig = await app.inject({
      method: "POST",
      url: `/v1/workspaces/${workspaceId}/uploads`,
      headers: authHeaders(userId),
      payload: {
        filename: "big.mp4",
        mimeType: "video/mp4",
        bytes: 3_000_000_000,
        sha256: sha,
      },
    });
    expect(tooBig.statusCode).toBe(413);

    const viewerDenied = await app.inject({
      method: "POST",
      url: `/v1/workspaces/${workspaceId}/uploads`,
      headers: authHeaders(viewerId),
      payload: { filename: "a.mp4", mimeType: "video/mp4", bytes: 10, sha256: sha },
    });
    expect(viewerDenied.statusCode).toBe(403);

    const create = await app.inject({
      method: "POST",
      url: `/v1/workspaces/${workspaceId}/uploads`,
      headers: authHeaders(userId),
      payload: { filename: "a.mp4", mimeType: "video/mp4", bytes: 10, sha256: sha },
    });
    const uploadId = (create.json() as { upload: { uploadId: string } }).upload.uploadId;

    const cross = await app.inject({
      method: "GET",
      url: `/v1/workspaces/${otherWorkspaceId}/uploads/${uploadId}`,
      headers: authHeaders(userId),
    });
    expect(cross.statusCode).toBe(404);
  });

  it("aborts idempotently", async () => {
    const sha = "b".repeat(64);
    const create = await app.inject({
      method: "POST",
      url: `/v1/workspaces/${workspaceId}/uploads`,
      headers: authHeaders(userId),
      payload: { filename: "abort.mp4", mimeType: "video/mp4", bytes: 10, sha256: sha },
    });
    const uploadId = (create.json() as { upload: { uploadId: string } }).upload.uploadId;

    const abort1 = await app.inject({
      method: "DELETE",
      url: `/v1/workspaces/${workspaceId}/uploads/${uploadId}`,
      headers: authHeaders(userId),
    });
    expect(abort1.statusCode).toBe(204);

    const abort2 = await app.inject({
      method: "DELETE",
      url: `/v1/workspaces/${workspaceId}/uploads/${uploadId}`,
      headers: authHeaders(userId),
    });
    expect(abort2.statusCode).toBe(204);
  });
});
