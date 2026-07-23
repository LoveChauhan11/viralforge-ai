import { InMemoryObjectStorage, buildObjectKey } from "@viralforge/storage";
import {
  createDb,
  deleteObjectReferenceIdempotent,
  getObjectReference,
  newId,
  registerObjectReference,
  users,
  workspaceMembers,
  workspaces,
} from "./index.js";
import { beforeAll, describe, expect, it } from "vitest";

const databaseUrl =
  process.env.DATABASE_URL ?? "postgresql://viralforge:viralforge@localhost:5432/viralforge";

describe("object reference metadata", () => {
  const db = createDb(databaseUrl);
  const storage = new InMemoryObjectStorage();
  let workspaceId: string;
  let userId: string;

  beforeAll(async () => {
    userId = newId();
    workspaceId = newId();
    await db.insert(users).values({
      id: userId,
      email: `obj-${userId}@example.invalid`,
      displayName: "Obj",
    });
    await db.insert(workspaces).values({
      id: workspaceId,
      name: "Obj WS",
      slug: `obj-${workspaceId}`,
      ownerUserId: userId,
    });
    await db.insert(workspaceMembers).values({
      id: newId(),
      workspaceId,
      userId,
      role: "owner",
    });
  });

  it("registers metadata and deletes idempotently", async () => {
    const objectId = newId();
    const key = buildObjectKey({
      workspaceId,
      purpose: "source",
      objectId,
      fileName: "a.bin",
    });
    const bytes = new Uint8Array([1, 2, 3]);
    await storage.putObject(
      { workspaceId, key, contentType: "application/octet-stream", byteSize: bytes.byteLength },
      bytes,
    );

    const refId = await registerObjectReference(db, {
      workspaceId,
      ownerType: "user",
      ownerId: userId,
      objectKey: key,
      purpose: "source",
    });
    expect(refId).toBeTruthy();
    expect((await getObjectReference(db, workspaceId, key))?.state).toBe("active");

    const first = await deleteObjectReferenceIdempotent(db, storage, workspaceId, key);
    expect(first).toEqual({ deleted: true, state: "deleted" });
    expect(await storage.headObject(workspaceId, key)).toBeNull();
    expect((await getObjectReference(db, workspaceId, key))?.state).toBe("deleted");

    const second = await deleteObjectReferenceIdempotent(db, storage, workspaceId, key);
    expect(second).toEqual({ deleted: true, state: "deleted" });
  });
});
