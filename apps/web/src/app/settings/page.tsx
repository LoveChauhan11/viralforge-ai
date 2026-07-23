import { ErrorState } from "@viralforge/ui";
import { Shell } from "@/components/Shell";
import { saveLocalSession } from "@/lib/actions";
import { getLocalSession } from "@/lib/session";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ needAuth?: string; error?: string }>;
}) {
  const params = await searchParams;
  const session = await getLocalSession();

  return (
    <Shell>
      <h1 className="vf-page-title">Settings</h1>
      <p className="vf-page-lead">
        Local development identity (header auth). Staging and production forbid this adapter.
      </p>

      {params.needAuth ? (
        <ErrorState
          title="Authentication required"
          description="Set a local user ID and workspace ID before creating jobs."
        />
      ) : null}
      {params.error === "missing" ? (
        <ErrorState
          title="Missing values"
          description="Both user ID and workspace ID are required."
        />
      ) : null}

      <form className="vf-panel vf-stack" action={saveLocalSession}>
        <label className="vf-label">
          Local user ID
          <input
            className="vf-input"
            name="userId"
            required
            defaultValue={session.userId ?? ""}
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        <label className="vf-label">
          Workspace ID
          <input
            className="vf-input"
            name="workspaceId"
            required
            defaultValue={session.workspaceId ?? ""}
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        <button className="vf-button" type="submit">
          Save local session
        </button>
        <p className="vf-page-lead" style={{ marginBottom: 0 }}>
          Run <code>pnpm seed</code> and copy the printed <code>userId</code> /{" "}
          <code>workspaceId</code>.
        </p>
      </form>
    </Shell>
  );
}
