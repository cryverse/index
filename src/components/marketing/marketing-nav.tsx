"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

const navLinks = [
  { label: "Product", href: "#product" },
  { label: "Capabilities", href: "#capabilities" },
  { label: "How it works", href: "#how-it-works" },
];

function scrollToAnchor(href: string) {
  const target = document.querySelector(href);
  if (!(target instanceof HTMLElement)) return;

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  target.scrollIntoView({
    behavior: reduceMotion ? "auto" : "smooth",
    block: "start",
  });
  window.history.replaceState(null, "", href);
}

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const menuId = useId();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    const onPointerDown = (event: PointerEvent) => {
      const header = headerRef.current;
      if (
        header &&
        event.target instanceof Node &&
        !header.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    const onResize = () => {
      if (window.matchMedia("(min-width: 768px)").matches) setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  const closeAndScroll = (href: string) => {
    setOpen(false);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => scrollToAnchor(href));
    });
  };

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-50 border-b transition-colors duration-300 ${
        open
          ? "border-border-subtle bg-background/95 backdrop-blur-xl"
          : scrolled
            ? "border-border-subtle bg-background/80 backdrop-blur-xl"
            : "border-transparent bg-transparent"
      }`}
    >
      <nav
        className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-2 px-4 sm:gap-6 sm:px-6"
        aria-label="Primary"
      >
        <Link
          href="/"
          className="shrink-0 text-sm font-semibold tracking-[0.2em] text-foreground transition-opacity hover:opacity-80"
        >
          INDEX
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm text-muted transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href="/dashboard"
            className="hidden text-sm text-muted transition-colors hover:text-foreground sm:inline"
          >
            Sign in
          </Link>
          <Link
            href="/dashboard"
            className="whitespace-nowrap rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-sm font-medium text-foreground transition-all duration-200 hover:border-accent/60 hover:bg-accent/20 sm:px-4"
          >
            Open Workspace
          </Link>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border-strong text-foreground transition-colors hover:bg-white/5 md:hidden"
            aria-expanded={open}
            aria-controls={menuId}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? (
              <X className="h-4 w-4" aria-hidden />
            ) : (
              <Menu className="h-4 w-4" aria-hidden />
            )}
          </button>
        </div>
      </nav>

      {open ? (
        <div
          id={menuId}
          className="border-t border-border-subtle motion-safe:animate-[fade-in_180ms_ease-out] md:hidden"
        >
          <ul className="mx-auto flex w-full max-w-6xl flex-col px-2 py-2 sm:px-4">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="block rounded-lg px-3 py-3 text-sm text-muted transition-colors hover:bg-white/5 hover:text-foreground"
                  onClick={(event) => {
                    event.preventDefault();
                    closeAndScroll(link.href);
                  }}
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li className="sm:hidden">
              <Link
                href="/dashboard"
                className="block rounded-lg px-3 py-3 text-sm text-muted transition-colors hover:bg-white/5 hover:text-foreground"
                onClick={() => setOpen(false)}
              >
                Sign in
              </Link>
            </li>
          </ul>
        </div>
      ) : null}
    </header>
  );
}
