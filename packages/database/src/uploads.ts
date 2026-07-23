import { and, count, eq, ne } from "drizzle-orm";
import type { ObjectStorage } from "@viralforge/storage";
import { newId } from "./ids.js";
import type { Database } from "./index.js";
import { assets, objectReferences, uploadParts, uploadSessions } from "./schema.js";

export type UploadSessionRow = typeof uploadSessions.$inferSelect;
export type AssetRow = typeof assets.$inferSelect;

export async function insertUploadSession(
  db: Database,
  input: {
    id?: string;
    workspaceId: string;
    createdBy: string;
    objectKey: string;
    filename: string;
    declaredMime: string;
    declaredBytes: number;
    expectedSha256: string;
    multipartUploadId: string;
    partSize: number;
    partCount: number;
    expiresAt: Date;
  },
): Promise<UploadSessionRow> {
  const id = input.id ?? newId();
  const [row] = await db
    .insert(uploadSessions)
    .values({
      id,
      workspaceId: input.workspaceId,
      createdBy: input.createdBy,
      objectKey: input.objectKey,
      filename: input.filename,
      declaredMime: input.declaredMime,
      declaredBytes: input.declaredBytes,
      expectedSha256: input.expectedSha256.toLowerCase(),
      multipartUploadId: input.multipartUploadId,
      partSize: input.partSize,
      partCount: input.partCount,
      state: "uploading",
      expiresAt: input.expiresAt,
    })
    .returning();
  if (!row) throw new Error("upload session insert failed");
  return row;
}

export async function getUploadSession(
  db: Database,
  workspaceId: string,
  uploadId: string,
): Promise<UploadSessionRow | null> {
  const [row] = await db
    .select()
    .from(uploadSessions)
    .where(and(eq(uploadSessions.id, uploadId), eq(uploadSessions.workspaceId, workspaceId)))
    .limit(1);
  return row ?? null;
}

export async function listPersistedUploadParts(
  db: Database,
  workspaceId: string,
  uploadSessionId: string,
) {
  return db
    .select()
    .from(uploadParts)
    .where(
      and(
        eq(uploadParts.workspaceId, workspaceId),
        eq(uploadParts.uploadSessionId, uploadSessionId),
      ),
    );
}

export async function upsertUploadPartRecord(
  db: Database,
  input: {
    workspaceId: string;
    uploadSessionId: string;
    partNumber: number;
    etag: string;
    bytes: number;
    checksum?: string;
  },
): Promise<void> {
  const existing = await db
    .select()
    .from(uploadParts)
    .where(
      and(
        eq(uploadParts.uploadSessionId, input.uploadSessionId),
        eq(uploadParts.partNumber, input.partNumber),
      ),
    )
    .limit(1);

  if (existing[0]) {
    await db
      .update(uploadParts)
      .set({
        etag: input.etag,
        bytes: input.bytes,
        checksum: input.checksum ?? existing[0].checksum,
        completedAt: new Date(),
      })
      .where(eq(uploadParts.id, existing[0].id));
    return;
  }

  await db.insert(uploadParts).values({
    id: newId(),
    workspaceId: input.workspaceId,
    uploadSessionId: input.uploadSessionId,
    partNumber: input.partNumber,
    etag: input.etag,
    bytes: input.bytes,
    checksum: input.checksum,
    completedAt: new Date(),
  });
}

export async function countActiveAssets(db: Database, workspaceId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(assets)
    .where(and(eq(assets.workspaceId, workspaceId), ne(assets.state, "deleted")));
  return Number(row?.value ?? 0);
}

export async function getAssetByUploadSession(
  db: Database,
  workspaceId: string,
  uploadSessionId: string,
): Promise<AssetRow | null> {
  const [row] = await db
    .select()
    .from(assets)
    .where(
      and(eq(assets.workspaceId, workspaceId), eq(assets.uploadSessionId, uploadSessionId)),
    )
    .limit(1);
  return row ?? null;
}

export async function completeUploadSession(
  db: Database,
  storage: ObjectStorage,
  input: {
    session: UploadSessionRow;
    parts: Array<{ partNumber: number; etag: string; checksum?: string; bytes?: number }>;
    mediaType: "video" | "image" | "audio";
  },
): Promise<{ asset: AssetRow; created: boolean }> {
  const fresh = await getUploadSession(db, input.session.workspaceId, input.session.id);
  if (!fresh) throw new Error("UPLOAD_NOT_FOUND");
  if (fresh.state === "aborted" || fresh.state === "expired") {
    throw new Error("UPLOAD_NOT_ACTIVE");
  }
  if (fresh.state === "completed") {
    const existing = await getAssetByUploadSession(db, fresh.workspaceId, fresh.id);
    if (!existing) throw new Error("asset missing for completed upload");
    return { asset: existing, created: false };
  }

  const completed = await storage.completeMultipartUpload(
    fresh.workspaceId,
    fresh.objectKey,
    fresh.multipartUploadId,
    input.parts.map((p) => ({ partNumber: p.partNumber, etag: p.etag })),
  );

  if (completed.byteSize !== fresh.declaredBytes) {
    await storage
      .deleteObject(fresh.workspaceId, fresh.objectKey)
      .catch(() => undefined);
    throw new Error("UPLOAD_SIZE_MISMATCH");
  }

  for (const part of input.parts) {
    const record: {
      workspaceId: string;
      uploadSessionId: string;
      partNumber: number;
      etag: string;
      bytes: number;
      checksum?: string;
    } = {
      workspaceId: fresh.workspaceId,
      uploadSessionId: fresh.id,
      partNumber: part.partNumber,
      etag: part.etag,
      bytes: part.bytes ?? 0,
    };
    if (part.checksum) record.checksum = part.checksum;
    await upsertUploadPartRecord(db, record);
  }

  const assetId = newId();
  const now = new Date();

  const asset = await db.transaction(async (tx) => {
    await tx
      .update(uploadSessions)
      .set({
        state: "completed",
        completedAt: now,
        updatedAt: now,
        version: fresh.version + 1,
      })
      .where(eq(uploadSessions.id, fresh.id));

    const [createdAsset] = await tx
      .insert(assets)
      .values({
        id: assetId,
        workspaceId: fresh.workspaceId,
        uploadSessionId: fresh.id,
        originalFilename: fresh.filename,
        mediaType: input.mediaType,
        objectKey: fresh.objectKey,
        sha256: fresh.expectedSha256,
        bytes: fresh.declaredBytes,
        mimeType: fresh.declaredMime,
        state: "validating",
      })
      .returning();

    if (!createdAsset) throw new Error("asset insert failed");

    await tx.insert(objectReferences).values({
      id: newId(),
      workspaceId: fresh.workspaceId,
      ownerType: "asset",
      ownerId: assetId,
      objectKey: fresh.objectKey,
      purpose: "source",
      state: "active",
    });

    return createdAsset;
  });

  return { asset, created: true };
}

export async function abortUploadSession(
  db: Database,
  storage: ObjectStorage,
  session: UploadSessionRow,
): Promise<{ aborted: boolean }> {
  if (session.state === "aborted") {
    return { aborted: false };
  }
  if (session.state === "completed") {
    throw new Error("UPLOAD_COMPLETED");
  }

  await storage.abortMultipartUpload(
    session.workspaceId,
    session.objectKey,
    session.multipartUploadId,
  );

  const now = new Date();
  await db
    .update(uploadSessions)
    .set({
      state: "aborted",
      abortedAt: now,
      updatedAt: now,
      version: session.version + 1,
    })
    .where(eq(uploadSessions.id, session.id));

  return { aborted: true };
}
