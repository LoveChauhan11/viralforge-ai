import { and, eq } from "drizzle-orm";
import type { Database } from "./index.js";
import { newId, objectReferences } from "./index.js";

export type RegisterObjectInput = {
  workspaceId: string;
  ownerType: string;
  ownerId: string;
  objectKey: string;
  purpose: string;
  deleteAfter?: Date;
};

type ObjectDeleter = {
  deleteObject(workspaceId: string, key: string): Promise<void>;
};

/**
 * Persists object metadata. Does not upload bytes — caller uses ObjectStorage.
 */
export async function registerObjectReference(db: Database, input: RegisterObjectInput) {
  const id = newId();
  await db.insert(objectReferences).values({
    id,
    workspaceId: input.workspaceId,
    ownerType: input.ownerType,
    ownerId: input.ownerId,
    objectKey: input.objectKey,
    purpose: input.purpose,
    state: "active",
    deleteAfter: input.deleteAfter,
  });
  return id;
}

export async function getObjectReference(
  db: Database,
  workspaceId: string,
  objectKey: string,
) {
  const rows = await db
    .select()
    .from(objectReferences)
    .where(
      and(eq(objectReferences.workspaceId, workspaceId), eq(objectReferences.objectKey, objectKey)),
    )
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Soft-deletes metadata and removes the binary. Safe to call repeatedly.
 */
export async function deleteObjectReferenceIdempotent(
  db: Database,
  storage: ObjectDeleter,
  workspaceId: string,
  objectKey: string,
): Promise<{ deleted: boolean; state: string }> {
  const row = await getObjectReference(db, workspaceId, objectKey);
  if (!row) {
    await storage.deleteObject(workspaceId, objectKey);
    return { deleted: false, state: "missing" };
  }

  if (row.state !== "deleted") {
    await db
      .update(objectReferences)
      .set({
        state: "deleted",
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(objectReferences.id, row.id), eq(objectReferences.workspaceId, workspaceId)));
  }

  await storage.deleteObject(workspaceId, objectKey);
  return { deleted: true, state: "deleted" };
}
