import { sanitizeLogFields } from "./sanitize.js";

export type LogLevel = "debug" | "info" | "warn" | "error";

export type Logger = {
  info(message: string, fields?: Record<string, unknown>): void;
  warn(message: string, fields?: Record<string, unknown>): void;
  error(message: string, fields?: Record<string, unknown>): void;
  child(fields: Record<string, unknown>): Logger;
};

type WriteFn = (
  level: LogLevel,
  serviceName: string,
  message: string,
  fields: Record<string, unknown>,
) => void;

const defaultWrite: WriteFn = (level, serviceName, message, fields) => {
  console.log(JSON.stringify({ level, serviceName, message, ...fields }));
};

export function createLogger(
  serviceName: string,
  baseFields: Record<string, unknown> = {},
  write: WriteFn = defaultWrite,
): Logger {
  return {
    info(message, fields = {}) {
      write("info", serviceName, message, sanitizeLogFields({ ...baseFields, ...fields }));
    },
    warn(message, fields = {}) {
      write("warn", serviceName, message, sanitizeLogFields({ ...baseFields, ...fields }));
    },
    error(message, fields = {}) {
      write("error", serviceName, message, sanitizeLogFields({ ...baseFields, ...fields }));
    },
    child(fields) {
      return createLogger(serviceName, { ...baseFields, ...fields }, write);
    },
  };
}
