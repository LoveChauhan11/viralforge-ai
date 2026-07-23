import { EmptyState } from "@viralforge/ui";
import { Shell } from "@/components/Shell";

export default function InsightsPage() {
  return (
    <Shell>
      <h1 className="vf-page-title">Insights</h1>
      <p className="vf-page-lead">What worked, what changed, and what to try next — with evidence.</p>
      <EmptyState
        title="Insights arrive with analytics sync"
        description="This shell is ready. Trend and experiment views land after publishing pipelines exist."
      />
    </Shell>
  );
}
