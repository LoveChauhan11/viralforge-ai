/** Structured logging (OTel expands in S0-13). */
export type LogLevel = "debug" | "info" | "warn" | "error";

export type Logger = {
  info(message: string, fields?: Record<string, unknown>): void;
  warn(message: string, fields?: Record<string, unknown>): void;
  error(message: string, fields?: Record<string, unknown>): void;
  child(fields: Record<string, unknown>): Logger;
};

function write(level: LogLevel, serviceName: string, message: string, fields: Record<string, unknown>) {
  console.log(JSON.stringify({ level, serviceName, message, ...fields }));
}

export function createLogger(serviceName: string, baseFields: Record<string, unknown> = {}): Logger {
  return {
    info(message, fields = {}) {
      write("info", serviceName, message, { ...baseFields, ...fields });
    },
    warn(message, fields = {}) {
      write("warn", serviceName, message, { ...baseFields, ...fields });
    },
    error(message, fields = {}) {
      write("error", serviceName, message, { ...baseFields, ...fields });
    },
    child(fields) {
      return createLogger(serviceName, { ...baseFields, ...fields });
    },
  };
}
