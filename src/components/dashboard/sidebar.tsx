"use client";

import Link from "next/link";
import {
  Database,
  History,
  LayoutDashboard,
  Menu,
  Plus,
  X,
} from "lucide-react";
import type { DashboardNavId } from "./types";

type SidebarProps = {
  activeNav: DashboardNavId;
  collapsed: boolean;
  mobileOpen: boolean;
  onNavChange: (id: DashboardNavId) => void;
  onNewResearch: () => void;
  onToggleCollapsed: () => void;
  onMobileOpenChange: (open: boolean) => void;
};

const navItems: {
  id: DashboardNavId;
  label: string;
  icon: typeof LayoutDashboard;
}[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "history", label: "Research History", icon: History },
  { id: "sources", label: "Data Sources", icon: Database },
];

export function Sidebar({
  activeNav,
  collapsed,
  mobileOpen,
  onNavChange,
  onNewResearch,
  onToggleCollapsed,
  onMobileOpenChange,
}: SidebarProps) {
  const showLabels = !collapsed || mobileOpen;

  const sidebarBody = (
    <aside
      className={`dashboard-sidebar flex h-full min-h-0 w-full flex-col border-border-subtle bg-surface lg:h-auto lg:min-h-full lg:border-r ${
        collapsed && !mobileOpen ? "lg:w-[68px]" : "lg:w-60"
      }`}
    >
      <div className="flex h-14 items-center justify-between gap-2 border-b border-border-subtle px-3 lg:px-4">
        <Link
          href="/"
          className="text-sm font-semibold tracking-[0.2em] text-foreground transition-opacity hover:opacity-80"
        >
          {showLabels ? "INDEX" : "IX"}
        </Link>
        <button
          type="button"
          onClick={() => {
            if (mobileOpen) onMobileOpenChange(false);
            else onToggleCollapsed();
          }}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle text-muted transition-colors hover:bg-white/5 hover:text-foreground lg:inline-flex"
          aria-label={mobileOpen ? "Close sidebar" : "Toggle sidebar"}
        >
          {mobileOpen ? (
            <X className="h-4 w-4" aria-hidden />
          ) : (
            <Menu className="h-4 w-4" aria-hidden />
          )}
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-3 lg:p-4">
        <button
          type="button"
          onClick={onNewResearch}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent/60 hover:bg-accent/20 ${
            showLabels ? "" : "lg:px-2"
          }`}
        >
          <Plus className="h-4 w-4 shrink-0" aria-hidden />
          {showLabels ? <span>New Research</span> : <span className="sr-only">New Research</span>}
        </button>

        <nav aria-label="Workspace">
          <ul className="space-y-1">
            {navItems.map(({ id, label, icon: Icon }) => {
              const active = activeNav === id;
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => {
                      onNavChange(id);
                      onMobileOpenChange(false);
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                      active
                        ? "border border-accent/25 bg-accent-muted text-foreground"
                        : "border border-transparent text-muted hover:bg-white/5 hover:text-foreground"
                    } ${showLabels ? "" : "lg:justify-center lg:px-2"}`}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    {showLabels ? (
                      <span className="truncate">{label}</span>
                    ) : (
                      <span className="sr-only">{label}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <div className="border-t border-border-subtle p-3 lg:p-4">
        <div
          className={`rounded-lg border border-border-subtle bg-background/50 p-3 ${
            showLabels ? "" : "flex justify-center lg:p-2"
          }`}
        >
          <div className={`flex items-center gap-3 ${showLabels ? "" : "lg:justify-center"}`}>
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border-strong bg-surface-elevated text-xs font-medium text-foreground"
              aria-hidden
            >
              MV
            </div>
            {showLabels ? (
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  Demo workspace
                </p>
                <p className="truncate text-xs text-muted">Mark Voss · Portfolio</p>
              </div>
            ) : (
              <span className="sr-only">Demo workspace</span>
            )}
          </div>
        </div>
      </div>
    </aside>
  );

  return (
  <>
    <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border-subtle bg-surface px-4 lg:hidden">
      <Link
        href="/"
        className="text-sm font-semibold tracking-[0.2em] text-foreground"
      >
        INDEX
      </Link>
      <button
        type="button"
        onClick={() => onMobileOpenChange(true)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border-strong text-foreground"
        aria-label="Open sidebar"
      >
        <Menu className="h-4 w-4" aria-hidden />
      </button>
    </div>

      <div
      className={`fixed inset-0 z-40 bg-black/60 transition-opacity lg:hidden ${
        mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!mobileOpen}
    >
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close sidebar overlay"
        onClick={() => onMobileOpenChange(false)}
      />
    </div>

    <div
      className={`fixed inset-y-0 left-0 z-50 w-[min(18rem,88vw)] transform shadow-2xl transition-transform motion-reduce:transition-none lg:relative lg:z-0 lg:h-auto lg:min-h-full lg:w-auto lg:transform-none lg:shadow-none ${
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}
    >
      {sidebarBody}
    </div>
  </>
  );
}