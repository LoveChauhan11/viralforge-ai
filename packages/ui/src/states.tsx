import type { ReactNode } from "react";
import { toneForJobState, type JobStateTone } from "./nav.js";

type EmptyProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyProps) {
  return (
    <section className="vf-state" aria-live="polite">
      <h2 className="vf-state__title">{title}</h2>
      <p className="vf-state__body">{description}</p>
      {action}
    </section>
  );
}

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <section className="vf-state vf-state--loading" aria-busy="true" aria-live="polite">
      <p className="vf-state__body">{label}…</p>
    </section>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  action,
}: {
  title?: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <section className="vf-state vf-state--error" role="alert">
      <h2 className="vf-state__title">{title}</h2>
      <p className="vf-state__body">{description}</p>
      {action}
    </section>
  );
}

const TONE_CLASS: Record<JobStateTone, string> = {
  neutral: "vf-badge",
  progress: "vf-badge vf-badge--progress",
  success: "vf-badge vf-badge--success",
  warning: "vf-badge vf-badge--warning",
  danger: "vf-badge vf-badge--danger",
};

export function StatusBadge({ state }: { state: string }) {
  const tone = toneForJobState(state);
  return <span className={TONE_CLASS[tone]}>{state}</span>;
}
