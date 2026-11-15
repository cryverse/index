import { Section } from "./section";

const steps = [
  {
    number: "01",
    title: "Define your objective",
    description:
      "State the question, scope, and constraints. INDEX structures the investigation before any analysis runs.",
  },
  {
    number: "02",
    title: "Let INDEX investigate and analyze",
    description:
      "The agent gathers information, validates data, and executes analysis steps you can follow in real time.",
  },
  {
    number: "03",
    title: "Review structured insights and reports",
    description:
      "Receive cited findings, visual summaries, and exportable reports ready for stakeholders.",
  },
];

export function HowItWorks() {
  return (
    <Section
      id="how-it-works"
      className="border-t border-border-subtle bg-surface/30"
    >
      <div className="mb-10 max-w-2xl md:mb-14">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent sm:tracking-[0.2em]">
          How it works
        </p>
        <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          From objective to intelligence in three steps
        </h2>
      </div>

      <ol className="grid gap-8 md:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.number} className="relative min-w-0">
            {index < steps.length - 1 ? (
              <div
                className="absolute left-8 top-14 hidden h-px w-[calc(100%-2rem)] bg-gradient-to-r from-border-strong to-transparent md:block"
                aria-hidden
              />
            ) : null}
            <p className="font-mono text-sm text-accent">{step.number}</p>
            <h3 className="mt-4 text-xl font-medium text-foreground">
              {step.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {step.description}
            </p>
          </li>
        ))}
      </ol>
    </Section>
  );
}