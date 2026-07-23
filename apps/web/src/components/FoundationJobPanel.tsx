"use client";

import { ErrorState, LoadingState, StatusBadge } from "@viralforge/ui";
import { useEffect, useId, useState, useTransition, type FormEvent } from "react";

type JobView = {
  id: string;
  state: string;
  stage: string | null;
  progress: number;
  safeErrorCode: string | null;
  result: unknown;
};

type Props = {
  workspaceId: string;
  userId: string;
};

export function FoundationJobPanel({ workspaceId, userId }: Props) {
  const formId = useId();
  const [mode, setMode] = useState<"succeed" | "fail" | "timeout">("succeed");
  const [job, setJob] = useState<JobView | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!job || ["succeeded", "failed", "cancelled"].includes(job.state)) return;
    const timer = setInterval(() => {
      void pollJob(workspaceId, userId, job.id)
        .then((next) => setJob(next))
        .catch((err: unknown) =>
          setError(err instanceof Error ? err.message : "Failed to refresh job"),
        );
    }, 1000);
    return () => clearInterval(timer);
  }, [job, userId, workspaceId]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const key =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `foundation-${Date.now()}`;
        const created = await createFoundationJob({
          workspaceId,
          userId,
          idempotencyKey: key,
          mode,
        });
        setIdempotencyKey(key);
        setJob(created);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Create failed");
      }
    });
  }

  async function onCancel() {
    if (!job) return;
    setError(null);
    startTransition(async () => {
      try {
        const next = await cancelJob(workspaceId, userId, job.id);
        setJob(next);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Cancel failed");
      }
    });
  }

  async function onRetrySameKey() {
    if (!job || !idempotencyKey) return;
    setError(null);
    startTransition(async () => {
      try {
        const again = await createFoundationJob({
          workspaceId,
          userId,
          idempotencyKey,
          mode,
        });
        setJob(again);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Retry failed");
      }
    });
  }

  return (
    <div className="vf-stack">
      <form id={formId} className="vf-panel vf-stack" onSubmit={onSubmit}>
        <label className="vf-label">
          Outcome mode
          <select
            className="vf-select"
            value={mode}
            onChange={(e) => setMode(e.target.value as typeof mode)}
            aria-describedby={`${formId}-hint`}
          >
            <option value="succeed">Succeed</option>
            <option value="fail">Fail</option>
            <option value="timeout">Timeout</option>
          </select>
        </label>
        <p id={`${formId}-hint`} className="vf-page-lead" style={{ marginBottom: 0 }}>
          Submitting again with the same idempotency key returns the same job.
        </p>
        <div className="vf-row">
          <button className="vf-button" type="submit" disabled={pending}>
            {pending ? "Working…" : "Start foundation job"}
          </button>
        </div>
      </form>

      {error ? <ErrorState description={error} /> : null}
      {pending && !job ? <LoadingState label="Creating job" /> : null}

      {job ? (
        <section className="vf-panel vf-stack" aria-live="polite">
          <div className="vf-row">
            <StatusBadge state={job.state} />
            <span>{job.stage ?? "—"}</span>
          </div>
          <div className="vf-progress" aria-label={`Progress ${job.progress}%`}>
            <span style={{ width: `${Math.max(0, Math.min(100, job.progress))}%` }} />
          </div>
          <p className="vf-page-lead" style={{ marginBottom: 0 }}>
            Job ID <code>{job.id}</code>
            {job.safeErrorCode ? (
              <>
                {" "}
                · error <code>{job.safeErrorCode}</code>
              </>
            ) : null}
          </p>
          <div className="vf-row">
            {!["succeeded", "failed", "cancelled"].includes(job.state) ? (
              <button
                className="vf-button vf-button--ghost"
                type="button"
                onClick={onCancel}
                disabled={pending}
              >
                Cancel
              </button>
            ) : null}
            <button
              className="vf-button vf-button--ghost"
              type="button"
              onClick={onRetrySameKey}
              disabled={pending || !idempotencyKey}
            >
              Retry same key
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}

async function createFoundationJob(input: {
  workspaceId: string;
  userId: string;
  idempotencyKey: string;
  mode: string;
}): Promise<JobView> {
  const res = await fetch(`/v1/workspaces/${input.workspaceId}/jobs/foundation`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-viralforge-user-id": input.userId,
    },
    body: JSON.stringify({
      idempotencyKey: input.idempotencyKey,
      mode: input.mode,
      message: "web-foundation",
    }),
  });
  const body = (await res.json()) as { job?: JobView; detail?: string; title?: string };
  if (!res.ok || !body.job) {
    throw new Error(body.detail ?? body.title ?? `HTTP ${res.status}`);
  }
  return body.job;
}

async function pollJob(workspaceId: string, userId: string, jobId: string): Promise<JobView> {
  const res = await fetch(`/v1/workspaces/${workspaceId}/jobs/${jobId}`, {
    headers: { "x-viralforge-user-id": userId },
    cache: "no-store",
  });
  const body = (await res.json()) as { job?: JobView; detail?: string; title?: string };
  if (!res.ok || !body.job) {
    throw new Error(body.detail ?? body.title ?? `HTTP ${res.status}`);
  }
  return body.job;
}

async function cancelJob(workspaceId: string, userId: string, jobId: string): Promise<JobView> {
  const res = await fetch(`/v1/workspaces/${workspaceId}/jobs/${jobId}/cancel`, {
    method: "POST",
    headers: { "x-viralforge-user-id": userId },
  });
  const body = (await res.json()) as { job?: JobView; detail?: string; title?: string };
  if (!res.ok || !body.job) {
    throw new Error(body.detail ?? body.title ?? `HTTP ${res.status}`);
  }
  return body.job;
}
