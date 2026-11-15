import type { ReactNode } from "react";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="bg-background flex min-h-full min-w-0 flex-1 flex-col text-foreground">
      {children}
    </div>
  );
}