import type { ReactNode } from "react";
import { AppShell } from "@viralforge/ui";
import { headers } from "next/headers";

export async function Shell({ children }: { children: ReactNode }) {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "/today";
  return (
    <AppShell brand="ViralForge" pathname={pathname}>
      {children}
    </AppShell>
  );
}
