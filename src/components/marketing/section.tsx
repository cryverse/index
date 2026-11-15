import type { ReactNode } from "react";

type SectionProps = {
  id?: string;
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  reveal?: boolean;
};

export function Section({
  id,
  children,
  className = "",
  containerClassName = "",
  reveal = true,
}: SectionProps) {
  return (
    <section
      id={id}
      className={`relative px-4 py-16 sm:px-6 sm:py-20 md:py-28 ${reveal ? "scroll-reveal" : ""} ${className}`}
    >
      <div
        className={`mx-auto w-full max-w-6xl ${containerClassName}`}
      >
        {children}
      </div>
    </section>
  );
}