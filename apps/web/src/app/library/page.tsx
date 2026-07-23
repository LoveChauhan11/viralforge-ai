import { EmptyState } from "@viralforge/ui";
import { Shell } from "@/components/Shell";

export default function LibraryPage() {
  return (
    <Shell>
      <h1 className="vf-page-title">Library</h1>
      <p className="vf-page-lead">
        Source clips, brand elements, and templates for this workspace.
      </p>
      <EmptyState
        title="Library is empty"
        description="Object storage and asset ingest arrive in S0-11 / Sprint 1. Nothing is stored on local disk."
      />
    </Shell>
  );
}
