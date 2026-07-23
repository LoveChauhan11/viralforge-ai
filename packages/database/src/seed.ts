import { eq } from "drizzle-orm";
import { createDb, newId, users, workspaceMembers, workspaces } from "./index.js";

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://viralforge:viralforge@localhost:5432/viralforge";

const db = createDb(connectionString);

const email = "local.dev@example.invalid";
const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);

if (existing[0]) {
  const membership = await db
    .select({
      userId: workspaceMembers.userId,
      workspaceId: workspaceMembers.workspaceId,
    })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, existing[0].id))
    .limit(1);
  console.log("[@viralforge/database] seed already applied", {
    userId: existing[0].id,
    workspaceId: membership[0]?.workspaceId ?? null,
  });
  process.exit(0);
}

const userId = newId();
const workspaceId = newId();
const memberId = newId();

await db.transaction(async (tx) => {
  await tx.insert(users).values({
    id: userId,
    email,
    displayName: "Local Dev",
    status: "active",
  });
  await tx.insert(workspaces).values({
    id: workspaceId,
    name: "Local Workspace",
    slug: "local-workspace",
    ownerUserId: userId,
    plan: "free",
    region: "us",
    status: "active",
    retentionPolicy: { rawDays: 30 },
  });
  await tx.insert(workspaceMembers).values({
    id: memberId,
    workspaceId,
    userId,
    role: "owner",
    status: "active",
  });
});

console.log("[@viralforge/database] seed complete", { userId, workspaceId });
process.exit(0);
