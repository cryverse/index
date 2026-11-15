import {
  CheckCircle2,
  Circle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { PreviewChart } from "./preview-chart";
import { Section } from "./section";

const steps = [
  { label: "Gather market signals across 12 sources", status: "done" as const },
  { label: "Normalize and cross-validate datasets", status: "done" as const },
  { label: "Run comparative trend analysis", status: "active" as const },
  { label: "Draft structured insight report", status: "pending" as const },
];

const workspaceItems = ["Research", "Datasets", "Reports", "Settings"];

const insights = [
  {
    title: "Primary finding",
    body: "Category growth accelerated 18% QoQ, concentrated in enterprise segments.",
  },
  {
    title: "Risk signal",
    body: "Supplier concentration index rose above threshold in two regions.",
  },
];

function StepIcon({ status }: { status: (typeof steps)[number]["status"] }) {
  if (status === "done") {
    return <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" aria-hidden />;
  }
  if (status === "active") {
    return (
      <Loader2
        className="h-4 w-4 shrink-0 animate-spin text-accent"
        aria-hidden
      />
    );
  }
  return <Circle className="h-4 w-4 shrink-0 text-white/20" aria-hidden />;
}

export function ProductPreview() {
  return (
    <Section id="product" className="border-t border-border-subtle bg-surface/40">
      <div className="mb-8 max-w-2xl sm:mb-10">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent sm:tracking-[0.2em]">
          Product preview
        </p>
        <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          The INDEX workspace
        </h2>
        <p className="mt-4 text-muted leading-relaxed">
          A marketing visualization of the authenticated agent environment — not
          live AI output.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border-strong bg-[#0c0c0f] shadow-[0_24px_80px_-24px_rgba(0,0,0,0.8)]">
        <div className="flex items-center gap-2 border-b border-border-subtle px-3 py-3 sm:px-4">
          <div className="hidden shrink-0 gap-1.5 sm:flex" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
          </div>
          <span className="ml-1 min-w-0 truncate font-mono text-[11px] text-muted sm:ml-2">
            index.workspace / research
          </span>
          <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-md border border-accent/30 bg-accent-muted px-2 py-0.5 text-[10px] font-medium text-accent">
            <Sparkles className="h-3 w-3" aria-hidden />
            Preview
          </span>
        </div>

        <ul className="grid grid-cols-2 gap-1.5 border-b border-border-subtle px-3 py-2.5 sm:grid-cols-4 lg:hidden">
          {workspaceItems.map((item, i) => (
            <li
              key={item}
              className={`rounded-md px-2.5 py-1 text-center text-xs ${
                i === 0 ? "bg-accent-muted text-foreground" : "text-muted"
              }`}
            >
              {item}
            </li>
          ))}
        </ul>

        <div className="grid min-w-0 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="hidden border-r border-border-subtle p-4 lg:block">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
              Workspace
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {workspaceItems.map((item, i) => (
                <li
                  key={item}
                  className={`rounded-md px-2 py-1.5 ${
                    i === 0
                      ? "bg-accent-muted text-foreground"
                      : "text-muted"
                  }`}
                >
                  {item}
                </li>
              ))}
            </ul>
          </aside>

          <div className="grid min-w-0 gap-3 p-3 sm:gap-4 sm:p-4 md:grid-cols-2 md:p-6">
            <div className="min-w-0 rounded-xl border border-border-subtle bg-surface-elevated/60 p-4 md:col-span-2">
              <p className="text-[10px] uppercase tracking-wider text-muted">
                Active research
              </p>
              <h3 className="mt-2 text-balance text-base font-medium text-foreground sm:text-lg">
                Q3 competitive landscape — SaaS analytics
              </h3>
              <p className="mt-2 text-sm text-muted">
                Objective: quantify market momentum and surface concentration
                risk across vendors.
              </p>
            </div>

            <div className="min-w-0 rounded-xl border border-border-subtle bg-surface-elevated/40 p-4">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
                Agent activity
              </p>
              <ul className="mt-4 space-y-3">
                {steps.map((step) => (
                  <li key={step.label} className="flex min-w-0 gap-2.5 text-sm">
                    <StepIcon status={step.status} />
                    <span
                      className={`min-w-0 ${
                        step.status === "pending"
                          ? "text-muted"
                          : "text-foreground/90"
                      }`}
                    >
                      {step.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="min-w-0 overflow-hidden rounded-xl border border-border-subtle bg-surface-elevated/40 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
                  Trend index
                </p>
                <span className="shrink-0 font-mono text-xs text-accent">+18.4%</span>
              </div>
              <div className="mt-3 min-w-0">
                <PreviewChart />
              </div>
            </div>

            <div className="min-w-0 rounded-xl border border-border-subtle bg-surface-elevated/40 p-4 md:col-span-2">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
                Structured insight preview
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {insights.map((item) => (
                  <article
                    key={item.title}
                    className="rounded-lg border border-border-subtle bg-background/50 p-3 transition-colors hover:border-white/15"
                  >
                    <h4 className="text-sm font-medium text-foreground">
                      {item.title}
                    </h4>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      {item.body}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}