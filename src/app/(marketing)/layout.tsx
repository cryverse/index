import type { ReactNode } from "react";

export default function MarketingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="marketing-page bg-background text-foreground flex min-h-full w-full min-w-0 flex-1 flex-col">
      {children}
    </div>
  );
}