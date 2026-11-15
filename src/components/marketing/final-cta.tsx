import { ArrowRight } from "lucide-react";
import { ButtonLink } from "./button-link";

export function FinalCta() {
  return (
    <section className="scroll-reveal relative px-4 py-16 sm:px-6 sm:py-24 md:py-32">
      <div className="gradient-radial-accent absolute inset-0" />
      <div className="relative mx-auto max-w-3xl text-center">
        <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl md:leading-tight">
          Make better decisions with better intelligence.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-pretty text-muted">
          Open the workspace to explore how INDEX brings research, analysis, and
          reporting into one coherent agent experience.
        </p>
        <div className="mt-8 sm:mt-10">
          <ButtonLink
            href="/dashboard"
            variant="primary"
            className="w-full px-6 py-3 sm:w-auto"
          >
            Open INDEX Workspace
            <ArrowRight className="h-4 w-4" aria-hidden />
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}