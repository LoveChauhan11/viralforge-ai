import { Shell } from "@/components/Shell";
import { getLocalSession } from "@/lib/session";
import { FoundationJobPanel } from "@/components/FoundationJobPanel";
import { EmptyState } from "@viralforge/ui";

export default async function CreatePage() {
  const session = await getLocalSession();

  return (
    <Shell>
      <h1 className="vf-page-title">Create</h1>
      <p className="vf-page-lead">
        Sprint 0 foundation job: submit once, watch progress, and confirm terminal state. Full upload
        wizard arrives in Sprint 1.
      </p>
      {!session.userId || !session.workspaceId ? (
        <EmptyState
          title="Local session required"
          description="Save seeded IDs in Settings before creating a job."
          action={
            <a className="vf-button" href="/settings">
              Open Settings
            </a>
          }
        />
      ) : (
        <FoundationJobPanel workspaceId={session.workspaceId} userId={session.userId} />
      )}
    </Shell>
  );
}
