import { AuthError, authorize } from "@viralforge/auth";
import {
  abortUploadSession,
  completeUploadSession,
  countActiveAssets,
  getUploadSession,
  insertUploadSession,
  listPersistedUploadParts,
  newId,
  upsertUploadPartRecord,
} from "@viralforge/database";
import { buildObjectKey, redactSignedUrl } from "@viralforge/storage";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ApiDeps } from "../deps.js";
import { partCountFor, UploadError, validateUploadDeclaration } from "../uploads/rules.js";

const workspaceParams = z.object({
  workspaceId: z.string().uuid(),
});

const uploadParams = z.object({
  workspaceId: z.string().uuid(),
  uploadId: z.string().uuid(),
});

const createBody = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(3).max(120),
  bytes: z.number().int().positive(),
  sha256: z.string().length(64),
});

const partsBody = z.object({
  partNumbers: z.array(z.number().int().min(1).max(10_000)).min(1).max(50),
});

const completeBody = z.object({
  parts: z
    .array(
      z.object({
        partNumber: z.number().int().min(1),
        etag: z.string().min(1).max(255),
        checksum: z.string().max(128).optional(),
        bytes: z.number().int().nonnegative().optional(),
      }),
    )
    .min(1)
    .max(10_000),
});

function headerStore(headers: Record<string, string | string[] | undefined>) {
  return {
    get(name: string): string | undefined {
      const value = headers[name.toLowerCase()];
      return Array.isArray(value) ? value[0] : value;
    },
  };
}

function requireStorage(deps: ApiDeps) {
  if (!deps.storage || !deps.uploadLimits) {
    throw new Error("upload routes require storage and uploadLimits deps");
  }
  return { storage: deps.storage, limits: deps.uploadLimits };
}

function assertActiveSession(session: NonNullable<Awaited<ReturnType<typeof getUploadSession>>>) {
  if (session.state === "completed") {
    throw new UploadError("upload_completed", "Upload session already completed");
  }
  if (session.state === "aborted") {
    throw new UploadError("upload_aborted", "Upload session was aborted");
  }
  if (session.state === "expired" || session.expiresAt.getTime() <= Date.now()) {
    throw new UploadError("upload_expired", "Upload session expired");
  }
}

function toSessionView(
  session: NonNullable<Awaited<ReturnType<typeof getUploadSession>>>,
  parts: Array<{ partNumber: number; etag: string | null; bytes: number | null }>,
) {
  return {
    uploadId: session.id,
    workspaceId: session.workspaceId,
    state: session.state,
    filename: session.filename,
    mimeType: session.declaredMime,
    bytes: session.declaredBytes,
    sha256: session.expectedSha256,
    partSize: session.partSize,
    partCount: session.partCount,
    expiresAt: session.expiresAt,
    completedAt: session.completedAt,
    abortedAt: session.abortedAt,
    parts: parts
      .filter((p) => p.etag)
      .map((p) => ({
        partNumber: p.partNumber,
        etag: p.etag,
        bytes: p.bytes,
      })),
  };
}

export async function registerUploadRoutes(app: FastifyInstance, deps: ApiDeps): Promise<void> {
  app.post("/v1/workspaces/:workspaceId/uploads", async (request, reply) => {
    const { storage, limits } = requireStorage(deps);
    const params = workspaceParams.parse(request.params);
    const body = createBody.parse(request.body ?? {});
    const principal = await deps.auth.authenticate(headerStore(request.headers));
    const { membership } = await authorize({
      principal,
      workspaceId: params.workspaceId,
      permission: "upload:create",
      memberships: deps.memberships,
      audit: deps.audit,
      requestId: request.requestId,
      targetType: "upload",
    });

    const declared = validateUploadDeclaration({
      filename: body.filename,
      mimeType: body.mimeType,
      bytes: body.bytes,
      sha256: body.sha256,
      maxUploadBytes: limits.maxUploadBytes,
    });

    const assetCount = await countActiveAssets(deps.db, membership.workspaceId);
    if (assetCount >= limits.maxWorkspaceAssets) {
      throw new UploadError("quota_exceeded", "Workspace asset quota exceeded");
    }

    const uploadId = newId();
    const objectKey = buildObjectKey({
      workspaceId: membership.workspaceId,
      purpose: "source",
      objectId: uploadId,
      fileName: declared.safeName,
    });
    const partCount = partCountFor(body.bytes, limits.uploadPartBytes);
    const { multipartUploadId } = await storage.createMultipartUpload(
      membership.workspaceId,
      objectKey,
      body.mimeType.toLowerCase(),
    );
    const expiresAt = new Date(Date.now() + limits.uploadSessionTtlHours * 60 * 60 * 1000);

    const session = await insertUploadSession(deps.db, {
      id: uploadId,
      workspaceId: membership.workspaceId,
      createdBy: membership.userId,
      objectKey,
      filename: body.filename,
      declaredMime: body.mimeType.toLowerCase(),
      declaredBytes: body.bytes,
      expectedSha256: body.sha256.toLowerCase(),
      multipartUploadId,
      partSize: limits.uploadPartBytes,
      partCount,
      expiresAt,
    });

    void reply.status(201);
    return {
      upload: toSessionView(session, []),
      mediaType: declared.mediaType,
      requestId: request.requestId,
    };
  });

  app.get("/v1/workspaces/:workspaceId/uploads/:uploadId", async (request) => {
    const { storage } = requireStorage(deps);
    const params = uploadParams.parse(request.params);
    const principal = await deps.auth.authenticate(headerStore(request.headers));
    await authorize({
      principal,
      workspaceId: params.workspaceId,
      permission: "upload:read",
      memberships: deps.memberships,
      audit: deps.audit,
      requestId: request.requestId,
      targetType: "upload",
      targetId: params.uploadId,
    });

    const session = await getUploadSession(deps.db, params.workspaceId, params.uploadId);
    if (!session) {
      throw new AuthError("not_found", "Upload not found");
    }

    const persisted = await listPersistedUploadParts(deps.db, params.workspaceId, session.id);
    let parts = persisted.map((p) => ({
      partNumber: p.partNumber,
      etag: p.etag,
      bytes: p.bytes,
    }));

    if (session.state === "uploading") {
      try {
        const listed = await storage.listMultipartParts(
          session.workspaceId,
          session.objectKey,
          session.multipartUploadId,
        );
        for (const part of listed) {
          await upsertUploadPartRecord(deps.db, {
            workspaceId: session.workspaceId,
            uploadSessionId: session.id,
            partNumber: part.partNumber,
            etag: part.etag,
            bytes: part.size,
          });
        }
        parts = listed.map((p) => ({
          partNumber: p.partNumber,
          etag: p.etag,
          bytes: p.size,
        }));
      } catch {
        // Resume still returns DB truth if backend list fails.
      }
    }

    return { upload: toSessionView(session, parts), requestId: request.requestId };
  });

  app.post("/v1/workspaces/:workspaceId/uploads/:uploadId/parts", async (request) => {
    const { storage, limits } = requireStorage(deps);
    const params = uploadParams.parse(request.params);
    const body = partsBody.parse(request.body ?? {});
    const principal = await deps.auth.authenticate(headerStore(request.headers));
    await authorize({
      principal,
      workspaceId: params.workspaceId,
      permission: "upload:create",
      memberships: deps.memberships,
      audit: deps.audit,
      requestId: request.requestId,
      targetType: "upload",
      targetId: params.uploadId,
    });

    const session = await getUploadSession(deps.db, params.workspaceId, params.uploadId);
    if (!session) {
      throw new AuthError("not_found", "Upload not found");
    }
    assertActiveSession(session);

    for (const partNumber of body.partNumbers) {
      if (partNumber > session.partCount) {
        throw new UploadError(
          "upload_incomplete",
          `partNumber ${partNumber} exceeds partCount ${session.partCount}`,
        );
      }
    }

    const parts = [];
    for (const partNumber of body.partNumbers) {
      const signed = await storage.createSignedUploadPartUrl(
        session.workspaceId,
        session.objectKey,
        session.multipartUploadId,
        partNumber,
        limits.signedUrlTtlSeconds,
      );
      parts.push({
        partNumber,
        url: signed.url,
        headers: signed.headers ?? {},
        expiresAt: signed.expiresAt,
      });
      deps.logger.info("signed upload part", {
        requestId: request.requestId,
        uploadId: session.id,
        partNumber,
        url: redactSignedUrl(signed.url),
      });
    }

    return { parts, requestId: request.requestId };
  });

  app.post("/v1/workspaces/:workspaceId/uploads/:uploadId/complete", async (request, reply) => {
    const { storage } = requireStorage(deps);
    const params = uploadParams.parse(request.params);
    const body = completeBody.parse(request.body ?? {});
    const principal = await deps.auth.authenticate(headerStore(request.headers));
    await authorize({
      principal,
      workspaceId: params.workspaceId,
      permission: "upload:create",
      memberships: deps.memberships,
      audit: deps.audit,
      requestId: request.requestId,
      targetType: "upload",
      targetId: params.uploadId,
    });

    const session = await getUploadSession(deps.db, params.workspaceId, params.uploadId);
    if (!session) {
      throw new AuthError("not_found", "Upload not found");
    }
    if (session.state === "aborted") {
      throw new UploadError("upload_aborted", "Upload session was aborted");
    }
    if (session.state === "expired" || session.expiresAt.getTime() <= Date.now()) {
      if (session.state !== "completed") {
        throw new UploadError("upload_expired", "Upload session expired");
      }
    }

    const uniqueParts = new Map(body.parts.map((p) => [p.partNumber, p]));
    if (uniqueParts.size !== session.partCount) {
      throw new UploadError(
        "upload_incomplete",
        `Expected ${session.partCount} parts, received ${uniqueParts.size}`,
      );
    }
    for (let n = 1; n <= session.partCount; n += 1) {
      if (!uniqueParts.has(n)) {
        throw new UploadError("upload_incomplete", `Missing part ${n}`);
      }
    }

    const mediaType = validateUploadDeclaration({
      filename: session.filename,
      mimeType: session.declaredMime,
      bytes: session.declaredBytes,
      sha256: session.expectedSha256,
      maxUploadBytes: Number.MAX_SAFE_INTEGER,
    }).mediaType;

    try {
      const normalizedParts = [...uniqueParts.values()].map((part) => {
        const out: {
          partNumber: number;
          etag: string;
          checksum?: string;
          bytes?: number;
        } = { partNumber: part.partNumber, etag: part.etag };
        if (part.checksum) out.checksum = part.checksum;
        if (part.bytes !== undefined) out.bytes = part.bytes;
        return out;
      });
      const result = await completeUploadSession(deps.db, storage, {
        session,
        parts: normalizedParts,
        mediaType,
      });
      void reply.status(result.created ? 202 : 200);
      return {
        asset: {
          id: result.asset.id,
          workspaceId: result.asset.workspaceId,
          state: result.asset.state,
          objectKey: result.asset.objectKey,
          mimeType: result.asset.mimeType,
          bytes: result.asset.bytes,
          sha256: result.asset.sha256,
          mediaType: result.asset.mediaType,
          originalFilename: result.asset.originalFilename,
        },
        created: result.created,
        requestId: request.requestId,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message === "UPLOAD_SIZE_MISMATCH") {
        throw new UploadError("checksum_mismatch", "Uploaded byte size does not match declaration");
      }
      if (message === "UPLOAD_COMPLETED") {
        throw new UploadError("upload_completed", "Upload session already completed");
      }
      if (message === "UPLOAD_NOT_ACTIVE") {
        throw new UploadError("state_conflict", "Upload session is not active");
      }
      throw error;
    }
  });

  app.delete("/v1/workspaces/:workspaceId/uploads/:uploadId", async (request, reply) => {
    const { storage } = requireStorage(deps);
    const params = uploadParams.parse(request.params);
    const principal = await deps.auth.authenticate(headerStore(request.headers));
    await authorize({
      principal,
      workspaceId: params.workspaceId,
      permission: "upload:abort",
      memberships: deps.memberships,
      audit: deps.audit,
      requestId: request.requestId,
      targetType: "upload",
      targetId: params.uploadId,
    });

    const session = await getUploadSession(deps.db, params.workspaceId, params.uploadId);
    if (!session) {
      throw new AuthError("not_found", "Upload not found");
    }

    try {
      const result = await abortUploadSession(deps.db, storage, session);
      void reply.status(result.aborted ? 204 : 204);
      return reply.send();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message === "UPLOAD_COMPLETED") {
        throw new UploadError("upload_completed", "Cannot abort a completed upload");
      }
      throw error;
    }
  });
}
