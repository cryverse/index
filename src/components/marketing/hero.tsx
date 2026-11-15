import { ArrowRight } from "lucide-react";
import { ButtonLink } from "./button-link";
import { HeroVisual } from "./hero-visual";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pb-14 pt-10 sm:px-6 md:pb-24 md:pt-20">
      <div className="gradient-radial-accent pointer-events-none absolute inset-0" />
      <div className="marketing-grid-bg pointer-events-none absolute inset-0 opacity-40" />

      <div className="relative mx-auto grid max-w-6xl gap-10 sm:gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div className="min-w-0">
          <p className="animate-hero-enter text-[0.68rem] font-medium uppercase tracking-[0.18em] text-accent sm:text-xs sm:tracking-[0.25em]">
            AI Research & Data Agent
          </p>
          <h1 className="animate-hero-enter-delay-1 mt-4 text-balance text-[2rem] font-semibold leading-[1.12] tracking-tight text-foreground sm:mt-5 sm:text-4xl md:text-5xl lg:text-[3.25rem]">
            Turn complex data into clear decisions.
          </h1>
          <p className="animate-hero-enter-delay-2 mt-5 max-w-lg text-base leading-relaxed text-pretty text-muted sm:mt-6 md:text-lg">
            An intelligent research agent that investigates information, analyzes
            data, and transforms findings into actionable intelligence.
          </p>
          <div className="animate-hero-enter-delay-3 mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:items-center">
            <ButtonLink
              href="/dashboard"
              variant="primary"
              className="w-full sm:w-auto"
            >
              Explore the workspace
              <ArrowRight className="h-4 w-4" aria-hidden />
            </ButtonLink>
            <ButtonLink
              href="#capabilities"
              variant="secondary"
              className="w-full sm:w-auto"
            >
              Discover capabilities
            </ButtonLink>
          </div>
        </div>

        <div className="animate-hero-enter-delay-3 min-w-0 lg:pl-4">
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}
