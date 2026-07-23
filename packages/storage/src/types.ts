import { assertWorkspaceScopedKey } from "./keys.js";

export type ObjectRef = {
  workspaceId: string;
  key: string;
  contentType: string;
  byteSize: number;
};

export type SignedUrlKind = "get" | "put";

export type SignedUrlResult = {
  url: string;
  expiresAt: Date;
  kind: SignedUrlKind;
};

export interface ObjectStorage {
  putObject(ref: ObjectRef, body: Uint8Array): Promise<void>;
  headObject(
    workspaceId: string,
    key: string,
  ): Promise<{ contentType: string; byteSize: number } | null>;
  deleteObject(workspaceId: string, key: string): Promise<void>;
  createSignedGetUrl(workspaceId: string, key: string, ttlSeconds: number): Promise<SignedUrlResult>;
  createSignedPutUrl(
    workspaceId: string,
    key: string,
    contentType: string,
    ttlSeconds: number,
  ): Promise<SignedUrlResult>;
}

type MemoryObject = {
  body: Uint8Array;
  contentType: string;
};

export class InMemoryObjectStorage implements ObjectStorage {
  private readonly objects = new Map<string, MemoryObject>();

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
}
