export const NAV_ITEMS = [
  { href: "/today", label: "Today", description: "Next action and jobs" },
  { href: "/create", label: "Create", description: "Projects and foundation jobs" },
  { href: "/insights", label: "Insights", description: "What worked and what to try" },
  { href: "/library", label: "Library", description: "Assets and templates" },
  { href: "/settings", label: "Settings", description: "Identity and workspace" },
] as const;

export type NavHref = (typeof NAV_ITEMS)[number]["href"];

export type JobStateTone = "neutral" | "progress" | "success" | "warning" | "danger";

export function toneForJobState(state: string): JobStateTone {
  switch (state) {
    case "succeeded":
      return "success";
    case "failed":
      return "danger";
    case "cancelled":
    case "canceled":
      return "warning";
    case "running":
    case "queued":
    case "retrying":
      return "progress";
    default:
      return "neutral";
  }
}
