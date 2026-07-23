import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const LOCAL_USER_COOKIE = "vf_local_user_id";
export const WORKSPACE_COOKIE = "vf_workspace_id";

export async function getLocalSession(): Promise<{
  userId: string | null;
  workspaceId: string | null;
}> {
  const jar = await cookies();
  return {
    userId: jar.get(LOCAL_USER_COOKIE)?.value ?? null,
    workspaceId: jar.get(WORKSPACE_COOKIE)?.value ?? null,
  };
}

export async function requireLocalSession(): Promise<{ userId: string; workspaceId: string }> {
  const session = await getLocalSession();
  if (!session.userId || !session.workspaceId) {
    redirect("/settings?needAuth=1");
  }
  return { userId: session.userId, workspaceId: session.workspaceId };
}
