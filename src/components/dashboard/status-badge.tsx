import type { ResearchStatus } from "./types";

const statusStyles: Record<
  ResearchStatus,
  { label: string; className: string }
> = {
  completed: {
    label: "Completed",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  },
  in_progress: {
    label: "In progress",
    className: "border-accent/40 bg-accent-muted text-accent",
  },
  draft: {
    label: "Draft",
    className: "border-border-strong bg-white/5 text-muted",
  },
};

export function StatusBadge({ status }: { status: ResearchStatus }) {
  const { label, className } = statusStyles[status];
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${className}`}
    >
      {label}
    </span>
  );
}