"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LOCAL_USER_COOKIE, WORKSPACE_COOKIE } from "./session";

export async function saveLocalSession(formData: FormData): Promise<void> {
  const userId = String(formData.get("userId") ?? "").trim();
  const workspaceId = String(formData.get("workspaceId") ?? "").trim();
  if (!userId || !workspaceId) {
    redirect("/settings?error=missing");
  }

  const jar = await cookies();
  const common = {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
  };
  jar.set(LOCAL_USER_COOKIE, userId, common);
  jar.set(WORKSPACE_COOKIE, workspaceId, common);
  redirect("/today");
}
