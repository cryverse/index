import Link from "next/link";
import type { ReactNode } from "react";

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
};

const variantClasses = {
  primary:
    "border border-accent/40 bg-accent/10 text-foreground shadow-[0_0_24px_-4px_var(--accent-glow)] hover:border-accent/60 hover:bg-accent/20",
  secondary:
    "border border-border-strong bg-surface-elevated/50 text-foreground hover:border-white/20 hover:bg-surface-elevated",
  ghost: "text-muted hover:text-foreground",
};

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className = "",
}: ButtonLinkProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200";
  const classes = `${base} ${variantClasses[variant]} ${className}`;

  if (href.startsWith("#")) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}