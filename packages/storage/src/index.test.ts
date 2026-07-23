import { describe, expect, it } from "vitest";
import {
  assertWorkspaceScopedKey,
  buildObjectKey,
  createObjectStorage,
  InMemoryObjectStorage,
  redactSignedUrl,
  StorageError,
} from "./index.js";

const workspaceA = "019f8f2d-8f49-7065-a1df-1372d62d28c8";
const workspaceB = "019f8f2d-8f4c-72f9-9072-ed3503c1c0ae";
const objectId = "019f8f51-f0f1-7415-8a84-16a5379d3467";

describe("object key strategy", () => {
  it("builds workspace-scoped keys", () => {
    const key = buildObjectKey({
      workspaceId: workspaceA,
      purpose: "source",
      objectId,
      fileName: "clip one.mp4",
    });
    expect(key).toBe(`${workspaceA}/source/${objectId}/clip_one.mp4`);
    expect(() => assertWorkspaceScopedKey(workspaceA, key)).not.toThrow();
  });

  it("rejects cross-tenant keys", () => {
    const foreign = `${workspaceB}/source/${objectId}/x.mp4`;
    expect(() => assertWorkspaceScopedKey(workspaceA, foreign)).toThrow(StorageError);
    expect(() => assertWorkspaceScopedKey(workspaceA, foreign)).toThrow(/workspace-scoped/);
  });
});

describe("InMemoryObjectStorage", () => {
  it("puts, heads, signs, and deletes without local disk", async () => {
    const storage = createObjectStorage({ mode: "memory" });
    const key = buildObjectKey({
      workspaceId: workspaceA,
      purpose: "preview",
      objectId,
      fileName: "out.mp4",
    });
    const body = new TextEncoder().encode("fake-bytes");
    await storage.putObject(
      { workspaceId: workspaceA, key, contentType: "video/mp4", byteSize: body.byteLength },
      body,
    );
    const head = await storage.headObject(workspaceA, key);
    expect(head).toEqual({ contentType: "video/mp4", byteSize: body.byteLength });

    const signed = await storage.createSignedGetUrl(workspaceA, key, 120);
    expect(signed.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(redactSignedUrl(signed.url)).not.toContain("sig=");
    expect(redactSignedUrl(signed.url)).toContain("?[redacted]");

    await expect(storage.headObject(workspaceB, key)).rejects.toThrow(StorageError);

    await storage.deleteObject(workspaceA, key);
    expect(await storage.headObject(workspaceA, key)).toBeNull();
    await storage.deleteObject(workspaceA, key);
  });

  it("rejects put with unscoped key", async () => {
    const storage = new InMemoryObjectStorage();
    await expect(
      storage.putObject(
        {
          workspaceId: workspaceA,
          key: "not-scoped/file.bin",
          contentType: "application/octet-stream",
          byteSize: 1,
        },
        new Uint8Array([1]),
      ),
    ).rejects.toThrow(StorageError);
  });
});

describe.skipIf(!process.env.OBJECT_STORAGE_ACCESS_KEY_ID)("S3CompatibleObjectStorage (MinIO)", () => {
  it("round-trips against configured endpoint", async () => {
    const storage = createObjectStorage({
      mode: "s3",
      endpoint: process.env.OBJECT_STORAGE_ENDPOINT ?? "http://127.0.0.1:9000",
      region: process.env.OBJECT_STORAGE_REGION ?? "us-east-1",
      bucket: process.env.OBJECT_STORAGE_BUCKET ?? "viralforge-local",
      accessKeyId: process.env.OBJECT_STORAGE_ACCESS_KEY_ID!,
      secretAccessKey: process.env.OBJECT_STORAGE_SECRET_ACCESS_KEY!,
      forcePathStyle: true,
    });
    const key = buildObjectKey({
      workspaceId: workspaceA,
      purpose: "source",
      objectId,
      fileName: `it-${Date.now()}.bin`,
    });
    const body = new TextEncoder().encode("minio-proof");
    await storage.putObject(
      { workspaceId: workspaceA, key, contentType: "application/octet-stream", byteSize: body.byteLength },
      body,
    );
    expect(await storage.headObject(workspaceA, key)).toMatchObject({ byteSize: body.byteLength });
    const signed = await storage.createSignedGetUrl(workspaceA, key, 60);
    expect(signed.url).toContain("X-Amz-");
    expect(redactSignedUrl(signed.url)).not.toMatch(/X-Amz-/);
    await storage.deleteObject(workspaceA, key);
    expect(await storage.headObject(workspaceA, key)).toBeNull();
  });
});
