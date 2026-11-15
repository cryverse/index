import { ChevronRight } from "lucide-react";
import type { ResearchCardItem } from "./types";
import { StatusBadge } from "./status-badge";

type RecentResearchSectionProps = {
  items: ResearchCardItem[];
  onSelect: (item: ResearchCardItem) => void;
  compact?: boolean;
};

export function RecentResearchSection({
  items,
  onSelect,
  compact = false,
}: RecentResearchSectionProps) {
  return (
    <section aria-labelledby="recent-research-title">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2
            id="recent-research-title"
            className="text-sm font-medium text-foreground"
          >
            Recent Research
          </h2>
          {!compact ? (
            <p className="mt-1 text-xs text-muted">
              Sample records from your demo workspace.
            </p>
          ) : null}
        </div>
      </div>

      <ul
        className={`mt-4 grid gap-3 ${
          compact ? "md:grid-cols-1" : "md:grid-cols-2 xl:grid-cols-3"
        }`}
      >
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(item)}
                className="group flex h-full w-full flex-col rounded-xl border border-border-subtle bg-surface/60 p-4 text-left transition-colors hover:border-accent/30 hover:bg-surface-elevated/80"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-strong bg-background/50 text-accent transition-colors group-hover:border-accent/40 group-hover:bg-accent-muted">
                    <Icon className="h-4 w-4" aria-hidden />
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                <h3 className="mt-4 text-sm font-medium text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
                  {item.description}
                </p>
                <div className="mt-4 flex items-center justify-between gap-2 pt-1 text-xs text-muted">
                  <span>{item.date}</span>
                  <span className="inline-flex items-center gap-1 text-foreground/80 opacity-0 transition-opacity group-hover:opacity-100">
                    Open
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}