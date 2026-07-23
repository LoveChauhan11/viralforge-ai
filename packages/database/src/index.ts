import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

export type Database = ReturnType<typeof createDb>;

export function createDb(connectionString: string) {
  const client = postgres(connectionString, { max: 10 });
  return drizzle(client, { schema });
}

export * from "./schema.js";
export { newId } from "./ids.js";
export { findActiveMembership, recordAuthzAudit, userExists } from "./authz.js";
export { pingDatabase } from "./ping.js";
export {
  acquireJobLease,
  cancelJob,
  claimOutboxBatch,
  completeJob,
  createJobWithOutbox,
  failJob,
  getJob,
  isTerminalJobState,
  markOutboxDispatchError,
  markOutboxPublished,
  updateJobProgress,
} from "./jobs.js";
export {
  deleteObjectReferenceIdempotent,
  getObjectReference,
  registerObjectReference,
} from "./objects.js";
