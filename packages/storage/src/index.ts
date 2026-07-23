/** Object-storage interfaces. S3/MinIO adapters land in S0-11. */
export type ObjectRef = {
  workspaceId: string;
  key: string;
  contentType: string;
  byteSize: number;
};

export interface ObjectStorage {
  putObject(ref: ObjectRef, body: Uint8Array): Promise<void>;
  deleteObject(workspaceId: string, key: string): Promise<void>;
  createSignedGetUrl(workspaceId: string, key: string, ttlSeconds: number): Promise<string>;
}

export class InMemoryObjectStorage implements ObjectStorage {
  private readonly objects = new Map<string, Uint8Array>();

  private scopedKey(workspaceId: string, key: string): string {
    if (!key.startsWith(`${workspaceId}/`)) {
      throw new Error("object key must be workspace-scoped");
    }
    return key;
  }

  async putObject(ref: ObjectRef, body: Uint8Array): Promise<void> {
    this.objects.set(this.scopedKey(ref.workspaceId, ref.key), body);
  }

  async deleteObject(workspaceId: string, key: string): Promise<void> {
    this.objects.delete(this.scopedKey(workspaceId, key));
  }

  async createSignedGetUrl(workspaceId: string, key: string, ttlSeconds: number): Promise<string> {
    this.scopedKey(workspaceId, key);
    return `memory://object/${key}?ttl=${ttlSeconds}`;
  }
}
