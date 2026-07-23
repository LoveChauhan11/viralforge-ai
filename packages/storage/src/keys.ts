export class StorageError extends Error {
  readonly code: "cross_tenant_key" | "invalid_key" | "not_found" | "backend";

  constructor(code: StorageError["code"], message: string) {
    super(message);
    this.name = "StorageError";
    this.code = code;
  }
}

const PURPOSE_RE = /^[a-z][a-z0-9_-]{0,63}$/;
const SAFE_FILE_RE = /^[A-Za-z0-9._-]{1,180}$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Keys always start with workspaceId so tenants cannot address each other's objects.
 */
export function assertWorkspaceScopedKey(workspaceId: string, key: string): void {
  if (!workspaceId || !UUID_RE.test(workspaceId)) {
    throw new StorageError("invalid_key", "workspaceId must be a UUID");
  }
  if (!key || key.includes("..") || key.startsWith("/") || key.includes("//")) {
    throw new StorageError("invalid_key", "object key is invalid");
  }
  if (!key.startsWith(`${workspaceId}/`)) {
    throw new StorageError("cross_tenant_key", "object key must be workspace-scoped");
  }
}

export function buildObjectKey(input: {
  workspaceId: string;
  purpose: string;
  objectId: string;
  fileName: string;
}): string {
  if (!PURPOSE_RE.test(input.purpose)) {
    throw new StorageError("invalid_key", "purpose must be lowercase slug");
  }
  if (!UUID_RE.test(input.objectId)) {
    throw new StorageError("invalid_key", "objectId must be a UUID");
  }
  const safeName = input.fileName.replace(/[^A-Za-z0-9._-]+/g, "_").slice(0, 180);
  if (!SAFE_FILE_RE.test(safeName)) {
    throw new StorageError("invalid_key", "fileName produced an empty/unsafe name");
  }
  const key = `${input.workspaceId}/${input.purpose}/${input.objectId}/${safeName}`;
  assertWorkspaceScopedKey(input.workspaceId, key);
  return key;
}

/** Strip query/signature material before logging. */
export function redactSignedUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}?[redacted]`;
  } catch {
    return "[redacted-url]";
  }
}
