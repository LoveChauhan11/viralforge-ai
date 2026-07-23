const SENSITIVE_KEY =
  /(secret|password|token|authorization|api[_-]?key|access[_-]?key|private[_-]?key|credential|signed[_-]?url|email)/i;

/**
 * Strip secrets and signed-URL material before logs or trace attributes.
 */
export function sanitizeLogFields(fields: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (SENSITIVE_KEY.test(key)) {
      out[key] = "[redacted]";
      continue;
    }
    if (typeof value === "string" && looksLikeSignedUrl(value)) {
      out[key] = redactUrl(value);
      continue;
    }
    if (value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
      out[key] = sanitizeLogFields(value as Record<string, unknown>);
      continue;
    }
    out[key] = value;
  }
  return out;
}

function looksLikeSignedUrl(value: string): boolean {
  if (!/^https?:\/\//i.test(value) && !value.startsWith("memory://")) return false;
  return /[?&](X-Amz-|Signature|sig=|Expires=)/i.test(value) || value.includes("?");
}

function redactUrl(url: string): string {
  const q = url.indexOf("?");
  if (q === -1) return url;
  return `${url.slice(0, q)}?[redacted]`;
}
