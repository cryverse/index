import { SalesWorkspace } from "@/components/sales/sales-workspace";

export default function HomePage() {
  return (
    <main className="workspace-shell relative min-h-full flex-1">
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        <div className="gradient-radial-accent absolute inset-x-0 top-0 h-[min(480px,55vh)] opacity-80" />
      </div>
      <SalesWorkspace />
    </main>
  );
}