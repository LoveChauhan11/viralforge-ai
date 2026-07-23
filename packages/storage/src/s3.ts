import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListPartsCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { assertWorkspaceScopedKey, StorageError } from "./keys.js";
import type {
  MultipartPartSummary,
  ObjectRef,
  ObjectStorage,
  SignedUrlResult,
} from "./types.js";

export type S3CompatibleOptions = {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle?: boolean;
};

export class S3CompatibleObjectStorage implements ObjectStorage {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(options: S3CompatibleOptions) {
    this.bucket = options.bucket;
    this.client = new S3Client({
      region: options.region,
      endpoint: options.endpoint,
      forcePathStyle: options.forcePathStyle ?? true,
      credentials: {
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.secretAccessKey,
      },
    });
  }

  async putObject(ref: ObjectRef, body: Uint8Array): Promise<void> {
    assertWorkspaceScopedKey(ref.workspaceId, ref.key);
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: ref.key,
        Body: body,
        ContentType: ref.contentType,
        ContentLength: ref.byteSize,
      }),
    );
  }

  async headObject(
    workspaceId: string,
    key: string,
  ): Promise<{ contentType: string; byteSize: number } | null> {
    assertWorkspaceScopedKey(workspaceId, key);
    try {
      const result = await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return {
        contentType: result.ContentType ?? "application/octet-stream",
        byteSize: result.ContentLength ?? 0,
      };
    } catch (error) {
      const name = error instanceof Error ? error.name : "";
      const message = error instanceof Error ? error.message : String(error);
      if (name === "NotFound" || /NotFound|404|UnknownError/i.test(`${name} ${message}`)) {
        return null;
      }
      throw new StorageError("backend", "object head failed");
    }
  }

  async deleteObject(workspaceId: string, key: string): Promise<void> {
    assertWorkspaceScopedKey(workspaceId, key);
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async createSignedGetUrl(
    workspaceId: string,
    key: string,
    ttlSeconds: number,
  ): Promise<SignedUrlResult> {
    assertWorkspaceScopedKey(workspaceId, key);
    const expiresIn = clampTtl(ttlSeconds);
    const url = await getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn },
    );
    return { kind: "get", url, expiresAt: new Date(Date.now() + expiresIn * 1000) };
  }

  async createSignedPutUrl(
    workspaceId: string,
    key: string,
    contentType: string,
    ttlSeconds: number,
  ): Promise<SignedUrlResult> {
    assertWorkspaceScopedKey(workspaceId, key);
    const expiresIn = clampTtl(ttlSeconds);
    const url = await getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
      }),
      { expiresIn },
    );
    return { kind: "put", url, expiresAt: new Date(Date.now() + expiresIn * 1000) };
  }

  async createMultipartUpload(
    workspaceId: string,
    key: string,
    contentType: string,
  ): Promise<{ multipartUploadId: string }> {
    assertWorkspaceScopedKey(workspaceId, key);
    const result = await this.client.send(
      new CreateMultipartUploadCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
      }),
    );
    if (!result.UploadId) {
      throw new StorageError("backend", "multipart create missing upload id");
    }
    return { multipartUploadId: result.UploadId };
  }

  async createSignedUploadPartUrl(
    workspaceId: string,
    key: string,
    multipartUploadId: string,
    partNumber: number,
    ttlSeconds: number,
  ): Promise<SignedUrlResult & { partNumber: number }> {
    assertWorkspaceScopedKey(workspaceId, key);
    const expiresIn = clampTtl(ttlSeconds);
    const url = await getSignedUrl(
      this.client,
      new UploadPartCommand({
        Bucket: this.bucket,
        Key: key,
        UploadId: multipartUploadId,
        PartNumber: partNumber,
      }),
      { expiresIn },
    );
    return {
      kind: "upload_part",
      partNumber,
      url,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
      headers: {},
    };
  }

  async uploadPart(
    workspaceId: string,
    key: string,
    multipartUploadId: string,
    partNumber: number,
    body: Uint8Array,
  ): Promise<{ etag: string; size: number }> {
    assertWorkspaceScopedKey(workspaceId, key);
    const result = await this.client.send(
      new UploadPartCommand({
        Bucket: this.bucket,
        Key: key,
        UploadId: multipartUploadId,
        PartNumber: partNumber,
        Body: body,
        ContentLength: body.byteLength,
      }),
    );
    if (!result.ETag) {
      throw new StorageError("backend", "upload part missing etag");
    }
    return { etag: result.ETag, size: body.byteLength };
  }

  async listMultipartParts(
    workspaceId: string,
    key: string,
    multipartUploadId: string,
  ): Promise<MultipartPartSummary[]> {
    assertWorkspaceScopedKey(workspaceId, key);
    const result = await this.client.send(
      new ListPartsCommand({
        Bucket: this.bucket,
        Key: key,
        UploadId: multipartUploadId,
      }),
    );
    return (result.Parts ?? [])
      .filter((part): part is { PartNumber: number; ETag: string; Size: number } =>
        Boolean(part.PartNumber && part.ETag),
      )
      .map((part) => ({
        partNumber: part.PartNumber,
        etag: part.ETag,
        size: part.Size ?? 0,
      }))
      .sort((a, b) => a.partNumber - b.partNumber);
  }

  async completeMultipartUpload(
    workspaceId: string,
    key: string,
    multipartUploadId: string,
    parts: Array<{ partNumber: number; etag: string }>,
  ): Promise<{ etag: string; byteSize: number }> {
    assertWorkspaceScopedKey(workspaceId, key);
    const result = await this.client.send(
      new CompleteMultipartUploadCommand({
        Bucket: this.bucket,
        Key: key,
        UploadId: multipartUploadId,
        MultipartUpload: {
          Parts: [...parts]
            .sort((a, b) => a.partNumber - b.partNumber)
            .map((part) => ({ ETag: part.etag, PartNumber: part.partNumber })),
        },
      }),
    );
    const head = await this.headObject(workspaceId, key);
    return {
      etag: result.ETag ?? `"complete"`,
      byteSize: head?.byteSize ?? 0,
    };
  }

  async abortMultipartUpload(
    workspaceId: string,
    key: string,
    multipartUploadId: string,
  ): Promise<void> {
    assertWorkspaceScopedKey(workspaceId, key);
    try {
      await this.client.send(
        new AbortMultipartUploadCommand({
          Bucket: this.bucket,
          Key: key,
          UploadId: multipartUploadId,
        }),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/NoSuchUpload|NotFound|404/i.test(message)) return;
      throw new StorageError("backend", "multipart abort failed");
    }
  }
}

function clampTtl(ttlSeconds: number): number {
  if (!Number.isFinite(ttlSeconds) || ttlSeconds < 1) return 60;
  return Math.min(Math.floor(ttlSeconds), 3600);
}
