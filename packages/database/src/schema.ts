import {
  bigint,
  integer,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  index,
  boolean,
  char,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  version: integer("version").notNull().default(1),
};

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey(),
    email: text("email").notNull(),
    displayName: varchar("display_name", { length: 120 }).notNull(),
    avatarUrl: text("avatar_url"),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex("users_email_uidx").on(t.email)],
);

export const workspaces = pgTable(
  "workspaces",
  {
    id: uuid("id").primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    slug: text("slug").notNull(),
    ownerUserId: uuid("owner_user_id")
      .notNull()
      .references(() => users.id),
    plan: varchar("plan", { length: 30 }).notNull().default("free"),
    region: varchar("region", { length: 30 }).notNull().default("us"),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    retentionPolicy: jsonb("retention_policy").notNull().default({}),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("workspaces_slug_uidx").on(t.slug),
    index("workspaces_owner_idx").on(t.ownerUserId),
    index("workspaces_status_idx").on(t.status),
  ],
);

export const workspaceMembers = pgTable(
  "workspace_members",
  {
    id: uuid("id").primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    role: varchar("role", { length: 20 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    invitedBy: uuid("invited_by"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("workspace_members_workspace_user_uidx").on(t.workspaceId, t.userId),
    index("workspace_members_user_status_idx").on(t.userId, t.status),
    index("workspace_members_workspace_role_status_idx").on(t.workspaceId, t.role, t.status),
  ],
);

export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    type: varchar("type", { length: 80 }).notNull(),
    entityType: varchar("entity_type", { length: 80 }),
    entityId: uuid("entity_id"),
    entityVersion: integer("entity_version"),
    idempotencyKey: varchar("idempotency_key", { length: 160 }).notNull(),
    queue: varchar("queue", { length: 80 }).notNull(),
    state: varchar("state", { length: 40 }).notNull(),
    stage: varchar("stage", { length: 80 }),
    progress: smallint("progress").notNull().default(0),
    attemptCount: integer("attempt_count").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(3),
    retryable: boolean("retryable").notNull().default(true),
    safeErrorCode: varchar("safe_error_code", { length: 80 }),
    safeErrorDetail: jsonb("safe_error_detail"),
    result: jsonb("result"),
    leaseOwner: varchar("lease_owner", { length: 120 }),
    leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true }),
    heartbeatAt: timestamp("heartbeat_at", { withTimezone: true }),
    requestedBy: uuid("requested_by"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("jobs_workspace_type_idempotency_uidx").on(t.workspaceId, t.type, t.idempotencyKey),
    index("jobs_queue_state_created_idx").on(t.queue, t.state, t.createdAt),
    index("jobs_workspace_entity_idx").on(t.workspaceId, t.entityType, t.entityId),
    index("jobs_lease_expires_idx").on(t.leaseExpiresAt),
  ],
);

export const jobAttempts = pgTable(
  "job_attempts",
  {
    id: uuid("id").primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    attemptNo: integer("attempt_no").notNull(),
    workerId: varchar("worker_id", { length: 120 }),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    outcome: varchar("outcome", { length: 40 }),
    safeErrorCode: varchar("safe_error_code", { length: 80 }),
    metrics: jsonb("metrics"),
  },
  (t) => [
    uniqueIndex("job_attempts_job_attempt_uidx").on(t.jobId, t.attemptNo),
    index("job_attempts_workspace_idx").on(t.workspaceId),
  ],
);

export const outboxEvents = pgTable(
  "outbox_events",
  {
    id: uuid("id").primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    aggregateType: varchar("aggregate_type", { length: 80 }).notNull(),
    aggregateId: uuid("aggregate_id").notNull(),
    aggregateVersion: integer("aggregate_version").notNull().default(1),
    eventType: varchar("event_type", { length: 120 }).notNull(),
    schemaVersion: integer("schema_version").notNull().default(1),
    payload: jsonb("payload").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    claimOwner: varchar("claim_owner", { length: 120 }),
    claimExpiresAt: timestamp("claim_expires_at", { withTimezone: true }),
    attempts: integer("attempts").notNull().default(0),
    lastErrorCode: varchar("last_error_code", { length: 80 }),
  },
  (t) => [
    index("outbox_events_unpublished_idx").on(t.publishedAt, t.claimExpiresAt),
    index("outbox_events_workspace_idx").on(t.workspaceId),
  ],
);

export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").primaryKey(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id),
    actorType: varchar("actor_type", { length: 40 }).notNull(),
    actorId: uuid("actor_id"),
    action: varchar("action", { length: 80 }).notNull(),
    targetType: varchar("target_type", { length: 80 }).notNull(),
    targetId: uuid("target_id"),
    requestId: varchar("request_id", { length: 80 }),
    ipHash: varchar("ip_hash", { length: 128 }),
    metadata: jsonb("metadata").notNull().default({}),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("audit_events_workspace_occurred_idx").on(t.workspaceId, t.occurredAt),
    index("audit_events_target_idx").on(t.targetType, t.targetId),
  ],
);

export const objectReferences = pgTable(
  "object_references",
  {
    id: uuid("id").primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    ownerType: varchar("owner_type", { length: 80 }).notNull(),
    ownerId: uuid("owner_id").notNull(),
    objectKey: text("object_key").notNull(),
    purpose: varchar("purpose", { length: 80 }).notNull(),
    state: varchar("state", { length: 40 }).notNull().default("active"),
    deleteAfter: timestamp("delete_after", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("object_references_object_key_uidx").on(t.objectKey),
    index("object_references_workspace_idx").on(t.workspaceId, t.state),
  ],
);

export const uploadSessions = pgTable(
  "upload_sessions",
  {
    id: uuid("id").primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    createdBy: uuid("created_by").references(() => users.id),
    objectKey: text("object_key").notNull(),
    filename: varchar("filename", { length: 255 }).notNull(),
    declaredMime: varchar("declared_mime", { length: 120 }).notNull(),
    declaredBytes: bigint("declared_bytes", { mode: "number" }).notNull(),
    expectedSha256: char("expected_sha256", { length: 64 }).notNull(),
    multipartUploadId: text("multipart_upload_id").notNull(),
    partSize: integer("part_size").notNull(),
    partCount: integer("part_count").notNull(),
    state: varchar("state", { length: 20 }).notNull().default("uploading"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    abortedAt: timestamp("aborted_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("upload_sessions_object_key_uidx").on(t.objectKey),
    index("upload_sessions_workspace_state_idx").on(t.workspaceId, t.state),
    index("upload_sessions_expires_idx").on(t.expiresAt),
  ],
);

export const uploadParts = pgTable(
  "upload_parts",
  {
    id: uuid("id").primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    uploadSessionId: uuid("upload_session_id")
      .notNull()
      .references(() => uploadSessions.id, { onDelete: "cascade" }),
    partNumber: integer("part_number").notNull(),
    etag: varchar("etag", { length: 255 }),
    bytes: integer("bytes"),
    checksum: varchar("checksum", { length: 128 }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("upload_parts_session_part_uidx").on(t.uploadSessionId, t.partNumber),
    index("upload_parts_workspace_idx").on(t.workspaceId),
  ],
);

export const assets = pgTable(
  "assets",
  {
    id: uuid("id").primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    uploadSessionId: uuid("upload_session_id").references(() => uploadSessions.id),
    originalFilename: varchar("original_filename", { length: 255 }).notNull(),
    mediaType: varchar("media_type", { length: 20 }).notNull(),
    objectKey: text("object_key").notNull(),
    sha256: char("sha256", { length: 64 }).notNull(),
    bytes: bigint("bytes", { mode: "number" }).notNull(),
    mimeType: varchar("mime_type", { length: 120 }).notNull(),
    durationMs: integer("duration_ms"),
    width: integer("width"),
    height: integer("height"),
    rotation: smallint("rotation"),
    frameRate: varchar("frame_rate", { length: 20 }),
    capturedAt: timestamp("captured_at", { withTimezone: true }),
    state: varchar("state", { length: 40 }).notNull().default("validating"),
    safeErrorCode: varchar("safe_error_code", { length: 80 }),
    analysisVersion: varchar("analysis_version", { length: 40 }),
    deleteAfter: timestamp("delete_after", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("assets_object_key_uidx").on(t.objectKey),
    uniqueIndex("assets_upload_session_uidx").on(t.uploadSessionId),
    index("assets_workspace_state_idx").on(t.workspaceId, t.state),
  ],
);
