import { EmptyState } from "@viralforge/ui";
import { Shell } from "@/components/Shell";
import { getLocalSession } from "@/lib/session";

export default async function TodayPage() {
  const session = await getLocalSession();
  return (
    <Shell>
      <h1 className="vf-page-title">Today</h1>
      <p className="vf-page-lead">Your next Short, jobs that need attention, and recent results.</p>
      {!session.userId ? (
        <EmptyState
          title="Sign in for local development"
          description="Open Settings and paste the seeded user and workspace IDs from pnpm seed."
          action={
            <a className="vf-button" href="/settings">
              Open Settings
            </a>
          }
        />
      ) : (
        <EmptyState
          title="No active projects yet"
          description="Create a foundation job from Create to prove the async path, then Sprint 1 will add upload-to-publish."
          action={
            <a className="vf-button" href="/create">
              Go to Create
            </a>
          }
        />
      )}
    </Shell>
  );
}
