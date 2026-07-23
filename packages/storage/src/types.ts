import { createHash, randomUUID } from "node:crypto";
import { assertWorkspaceScopedKey } from "./keys.js";

export type ObjectRef = {
  workspaceId: string;
  key: string;
  contentType: string;
  byteSize: number;
};

export type SignedUrlKind = "get" | "put" | "upload_part";

export type SignedUrlResult = {
  url: string;
  expiresAt: Date;
  kind: SignedUrlKind;
  headers?: Record<string, string>;
};

export type MultipartPartSummary = {
  partNumber: number;
  etag: string;
  size: number;
};

export interface ObjectStorage {
  putObject(ref: ObjectRef, body: Uint8Array): Promise<void>;
  headObject(
    workspaceId: string,
    key: string,
  ): Promise<{ contentType: string; byteSize: number } | null>;
  deleteObject(workspaceId: string, key: string): Promise<void>;
  createSignedGetUrl(
    workspaceId: string,
    key: string,
    ttlSeconds: number,
  ): Promise<SignedUrlResult>;
  createSignedPutUrl(
    workspaceId: string,
    key: string,
    contentType: string,
    ttlSeconds: number,
  ): Promise<SignedUrlResult>;
  createMultipartUpload(
    workspaceId: string,
    key: string,
    contentType: string,
  ): Promise<{ multipartUploadId: string }>;
  createSignedUploadPartUrl(
    workspaceId: string,
    key: string,
    multipartUploadId: string,
    partNumber: number,
    ttlSeconds: number,
  ): Promise<SignedUrlResult & { partNumber: number }>;
  uploadPart(
    workspaceId: string,
    key: string,
    multipartUploadId: string,
    partNumber: number,
    body: Uint8Array,
  ): Promise<{ etag: string; size: number }>;
  listMultipartParts(
    workspaceId: string,
    key: string,
    multipartUploadId: string,
  ): Promise<MultipartPartSummary[]>;
  completeMultipartUpload(
    workspaceId: string,
    key: string,
    multipartUploadId: string,
    parts: Array<{ partNumber: number; etag: string }>,
  ): Promise<{ etag: string; byteSize: number }>;
  abortMultipartUpload(
    workspaceId: string,
    key: string,
    multipartUploadId: string,
  ): Promise<void>;
}

type MemoryObject = {
  body: Uint8Array;
  contentType: string;
};

type MemoryMultipart = {
  workspaceId: string;
  key: string;
  contentType: string;
  parts: Map<number, { body: Uint8Array; etag: string }>;
};

export class InMemoryObjectStorage implements ObjectStorage {
  private readonly objects = new Map<string, MemoryObject>();
  private readonly multiparts = new Map<string, MemoryMultipart>();

  async putObject(ref: ObjectRef, body: Uint8Array): Promise<void> {
    assertWorkspaceScopedKey(ref.workspaceId, ref.key);
    this.objects.set(ref.key, { body, contentType: ref.contentType });
  }

  async headObject(
    workspaceId: string,
    key: string,
  ): Promise<{ contentType: string; byteSize: number } | null> {
    assertWorkspaceScopedKey(workspaceId, key);
    const hit = this.objects.get(key);
    if (!hit) return null;
    return { contentType: hit.contentType, byteSize: hit.body.byteLength };
  }

  async deleteObject(workspaceId: string, key: string): Promise<void> {
    assertWorkspaceScopedKey(workspaceId, key);
    this.objects.delete(key);
  }

  async createSignedGetUrl(
    workspaceId: string,
    key: string,
    ttlSeconds: number,
  ): Promise<SignedUrlResult> {
    assertWorkspaceScopedKey(workspaceId, key);
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    return {
      kind: "get",
      expiresAt,
      url: `memory://object/${key}?expires=${expiresAt.toISOString()}&sig=fake`,
    };
  }

  async createSignedPutUrl(
    workspaceId: string,
    key: string,
    contentType: string,
    ttlSeconds: number,
  ): Promise<SignedUrlResult> {
    assertWorkspaceScopedKey(workspaceId, key);
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    return {
      kind: "put",
      expiresAt,
      url: `memory://object/${key}?expires=${expiresAt.toISOString()}&contentType=${encodeURIComponent(contentType)}&sig=fake`,
    };
  }

  async createMultipartUpload(
    workspaceId: string,
    key: string,
    contentType: string,
  ): Promise<{ multipartUploadId: string }> {
    assertWorkspaceScopedKey(workspaceId, key);
    const multipartUploadId = `mpu_${randomUUID()}`;
    this.multiparts.set(multipartUploadId, {
      workspaceId,
      key,
      contentType,
      parts: new Map(),
    });
    return { multipartUploadId };
  }

  async createSignedUploadPartUrl(
    workspaceId: string,
    key: string,
    multipartUploadId: string,
    partNumber: number,
    ttlSeconds: number,
  ): Promise<SignedUrlResult & { partNumber: number }> {
    this.requireMultipart(workspaceId, key, multipartUploadId);
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    return {
      kind: "upload_part",
      partNumber,
      expiresAt,
      headers: {},
      url: `memory://multipart/${multipartUploadId}/part/${partNumber}?key=${encodeURIComponent(key)}&expires=${expiresAt.toISOString()}&sig=fake`,
    };
  }

  async uploadPart(
    workspaceId: string,
    key: string,
    multipartUploadId: string,
    partNumber: number,
    body: Uint8Array,
  ): Promise<{ etag: string; size: number }> {
    const session = this.requireMultipart(workspaceId, key, multipartUploadId);
    const etag = `"${createHash("md5").update(body).digest("hex")}"`;
    session.parts.set(partNumber, { body, etag });
    return { etag, size: body.byteLength };
  }

  async listMultipartParts(
    workspaceId: string,
    key: string,
    multipartUploadId: string,
  ): Promise<MultipartPartSummary[]> {
    const session = this.requireMultipart(workspaceId, key, multipartUploadId);
    return [...session.parts.entries()]
      .map(([partNumber, part]) => ({
        partNumber,
        etag: part.etag,
        size: part.body.byteLength,
      }))
      .sort((a, b) => a.partNumber - b.partNumber);
  }

  async completeMultipartUpload(
    workspaceId: string,
    key: string,
    multipartUploadId: string,
    parts: Array<{ partNumber: number; etag: string }>,
  ): Promise<{ etag: string; byteSize: number }> {
    const session = this.requireMultipart(workspaceId, key, multipartUploadId);
    const ordered = [...parts].sort((a, b) => a.partNumber - b.partNumber);
    const chunks: Uint8Array[] = [];
    let byteSize = 0;
    for (const part of ordered) {
      const stored = session.parts.get(part.partNumber);
      if (!stored || stored.etag !== part.etag) {
        throw new Error(`multipart part ${part.partNumber} missing or etag mismatch`);
      }
      chunks.push(stored.body);
      byteSize += stored.body.byteLength;
    }
    const body = concatBytes(chunks);
    this.objects.set(key, { body, contentType: session.contentType });
    this.multiparts.delete(multipartUploadId);
    const etag = `"${createHash("md5").update(body).digest("hex")}"`;
    return { etag, byteSize };
  }

  async abortMultipartUpload(
    workspaceId: string,
    key: string,
    multipartUploadId: string,
  ): Promise<void> {
    assertWorkspaceScopedKey(workspaceId, key);
    const session = this.multiparts.get(multipartUploadId);
    if (!session) return;
    if (session.workspaceId !== workspaceId || session.key !== key) {
      throw new Error("multipart upload tenant/key mismatch");
    }
    this.multiparts.delete(multipartUploadId);
  }

  private requireMultipart(
    workspaceId: string,
    key: string,
    multipartUploadId: string,
  ): MemoryMultipart {
    assertWorkspaceScopedKey(workspaceId, key);
    const session = this.multiparts.get(multipartUploadId);
    if (!session || session.workspaceId !== workspaceId || session.key !== key) {
      throw new Error("multipart upload not found");
    }
    return session;
  }
}

function concatBytes(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}
