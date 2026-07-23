/** Structured logging and OTel wiring land in S0-13. */
export type LogLevel = "debug" | "info" | "warn" | "error";

export function createLogger(serviceName: string) {
  return {
    info(message: string, fields: Record<string, unknown> = {}): void {
      console.log(JSON.stringify({ level: "info", serviceName, message, ...fields }));
    },
  };
}
