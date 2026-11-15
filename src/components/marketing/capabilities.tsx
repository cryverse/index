import { BarChart3, FileText, Search } from "lucide-react";
import { Section } from "./section";

const capabilities = [
  {
    icon: Search,
    title: "Intelligent Research",
    description:
      "INDEX investigates sources, corroborates claims, and maps context so you start from evidence—not guesswork.",
    accent: "from-accent/20 to-transparent",
  },
  {
    icon: BarChart3,
    title: "Advanced Data Analysis",
    description:
      "Upload datasets or connect structured inputs. The agent detects patterns, outliers, and relationships at scale.",
    accent: "from-blue-500/15 to-transparent",
  },
  {
    icon: FileText,
    title: "Automated Reporting",
    description:
      "Findings collapse into executive-ready reports with citations, metrics, and recommended next actions.",
    accent: "from-indigo-500/15 to-transparent",
  },
];

export function Capabilities() {
  return (
    <Section id="capabilities">
      <div className="mb-10 max-w-2xl md:mb-14">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent sm:tracking-[0.2em]">
          Capabilities
        </p>
        <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          Built for rigorous research workflows
        </h2>
      </div>

      <ul className="grid gap-4 sm:gap-6 md:grid-cols-3">
        {capabilities.map(({ icon: Icon, title, description, accent }) => (
          <li
            key={title}
            className="group relative min-w-0 overflow-hidden rounded-2xl border border-border-subtle bg-surface/60 p-5 transition-colors duration-300 hover:border-accent/30 hover:bg-surface-elevated/80 sm:p-6"
          >
            <div
              className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${accent} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
            />
            <div className="relative">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-border-strong bg-background/60 text-accent transition-colors group-hover:border-accent/40 group-hover:bg-accent-muted">
                <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
              </div>
              <h3 className="mt-5 text-lg font-medium text-foreground">
                {title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {description}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}