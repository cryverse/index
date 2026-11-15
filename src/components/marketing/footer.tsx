export function MarketingFooter() {
  return (
    <footer className="border-t border-border-subtle px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold tracking-[0.2em] text-foreground">
            INDEX
          </p>
          <p className="mt-1 text-sm text-muted">
            AI Research & Data Agent
          </p>
        </div>
        <p className="text-sm text-muted">
          Portfolio demo by{" "}
          <span className="text-foreground/80">Mark Voss</span>
        </p>
      </div>
    </footer>
  );
}