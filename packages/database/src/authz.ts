import { and, eq } from "drizzle-orm";
import type { Database } from "./index.js";
import { auditEvents, newId, users, workspaceMembers } from "./index.js";

export async function userExists(db: Database, userId: string): Promise<boolean> {
  const rows = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
  return rows.length > 0;
}

export async function findActiveMembership(
  db: Database,
  workspaceId: string,
  userId: string,
): Promise<{
  workspaceId: string;
  userId: string;
  role: "owner" | "admin" | "creator" | "editor" | "viewer";
  status: "active" | "invited" | "disabled";
} | null> {
  const rows = await db
    .select({
      workspaceId: workspaceMembers.workspaceId,
      userId: workspaceMembers.userId,
      role: workspaceMembers.role,
      status: workspaceMembers.status,
    })
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, userId),
        eq(workspaceMembers.status, "active"),
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  return {
    workspaceId: row.workspaceId,
    userId: row.userId,
    role: row.role as "owner" | "admin" | "creator" | "editor" | "viewer",
    status: row.status as "active" | "invited" | "disabled",
  };
}

export async function recordAuthzAudit(
  db: Database,
  event: {
    workspaceId?: string;
    actorId?: string;
    action: string;
    decision: string;
    targetType: string;
    targetId?: string;
    requestId?: string;
  },
): Promise<void> {
  await db.insert(auditEvents).values({
    id: newId(),
    workspaceId: event.workspaceId,
    actorType: "user",
    actorId: event.actorId,
    action: event.action,
    targetType: event.targetType,
    targetId: event.targetId,
    requestId: event.requestId,
    metadata: { decision: event.decision },
  });
}
