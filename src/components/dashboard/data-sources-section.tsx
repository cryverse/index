import { FileSpreadsheet, FileText, Sheet } from "lucide-react";
import type { DataSourceItem } from "./types";

type DataSourcesSectionProps = {
  items: DataSourceItem[];
  expanded?: boolean;
};

const typeIcon = {
  csv: Sheet,
  xlsx: FileSpreadsheet,
  pdf: FileText,
} as const;

export function DataSourcesSection({
  items,
  expanded = false,
}: DataSourcesSectionProps) {
  return (
    <section aria-labelledby="data-sources-title">
      <DataSourcesHeading expanded={expanded} />

      <ul
        className={`mt-4 grid gap-2 ${
          expanded ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-3"
        }`}
      >
        {items.map((item) => {
          const Icon = typeIcon[item.type];
          return (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-xl border border-border-subtle bg-surface/50 px-3 py-3 transition-colors hover:border-white/15 hover:bg-surface-elevated/60"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border-strong bg-background/50 text-accent">
                <Icon className="h-4 w-4" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {item.name}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {item.size} · {item.updated}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function DataSourcesHeading({ expanded }: { expanded: boolean }) {
  return (
    <div>
      <h2 id="data-sources-title" className="text-sm font-medium text-foreground">
        Your Data
      </h2>
      <p className="mt-1 text-xs text-muted">
        {expanded
          ? "Connected sample files available for demo research runs."
          : "Sample sources available in this demo workspace."}
      </p>
    </div>
  );
}