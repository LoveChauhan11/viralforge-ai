import { S3CompatibleObjectStorage, type S3CompatibleOptions } from "./s3.js";
import { InMemoryObjectStorage, type ObjectStorage } from "./types.js";

export type CreateObjectStorageInput = { mode: "memory" } | ({ mode: "s3" } & S3CompatibleOptions);

export function createObjectStorage(input: CreateObjectStorageInput): ObjectStorage {
  if (input.mode === "memory") {
    return new InMemoryObjectStorage();
  }
  return new S3CompatibleObjectStorage(input);
}
