import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@viralforge/ui/tokens.css";
import "./shell.css";

export const metadata: Metadata = {
  title: "ViralForge",
  description: "ForgeOS — short-form creation workspace",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=Syne:wght@600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      {/* Extensions (e.g. Grammarly) inject body attributes before hydrate. */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
