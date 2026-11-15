import { Sparkles } from "lucide-react";

export function DashboardHeader({ agentReady }: { agentReady: boolean }) {
  return (
    <header className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-[1.75rem]">
            Good morning.
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted md:text-[0.95rem]">
            Ask INDEX to research markets, analyze datasets, and compare findings
            across your business data.
          </p>
        </div>
        <div
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
            agentReady
              ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
              : "border-accent/30 bg-accent-muted text-accent"
          }`}
        >
          <span className="relative flex h-2 w-2">
            {agentReady ? (
              <>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70 motion-reduce:animate-none" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </>
            ) : (
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            )}
          </span>
          {agentReady ? "Agent ready" : "Running research"}
        </div>
      </div>

      <div className="inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-surface/60 px-3 py-2 text-xs text-muted">
        <Sparkles className="h-3.5 w-3.5 text-accent" aria-hidden />
        Live research uses your uploads for this session only. Results are generated
        by OpenAI from extracted file content.
      </div>
    </header>
  );
}