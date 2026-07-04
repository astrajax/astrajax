"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useState } from "react";

type NavLink = {
  href: string;
  label: string;
  featured?: boolean;
  hint?: string;
};

const links: NavLink[] = [
  { href: "/#method", label: "Loop", hint: "How adoption works" },
  { href: "/#citizen-builder", label: "Citizen Builder", hint: "Why experts shape the AI" },
  {
    href: "/brain",
    label: "Brain review",
    hint: "Score agent answers and flag stale context",
  },
];

const featuredLinks = links.filter((link) => link.featured);
const secondaryLinks = links.filter((link) => !link.featured);

function desktopLinkClass(link: NavLink) {
  if (link.featured) {
    return "font-display text-base font-semibold text-ink transition hover:text-apricot";
  }
  return "text-base font-medium text-ink-muted transition hover:text-ink";
}

function mobileFeaturedClass() {
  return "font-display text-sm font-semibold text-ink transition hover:text-apricot sm:text-base";
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      {open ? (
        <>
          <path d="M6 6l12 12" />
          <path d="M18 6L6 18" />
        </>
      ) : (
        <>
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </>
      )}
    </svg>
  );
}

type NavProps = {
  /** Homepage hero: wainscoting band on the Victorian wall — not a floating SaaS bar. */
  immersive?: boolean;
};

export function Nav({ immersive = false }: NavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const closeMenu = () => setMenuOpen(false);

  const headerClass = immersive
    ? "sticky top-0 z-50 hero-nav-band"
    : "sticky top-0 z-50 border-b border-ink/10 bg-cream/95 backdrop-blur-md";

  const innerClass = immersive
    ? "hero-nav-band__inner mx-auto flex h-[var(--hero-nav-height)] max-w-6xl items-center gap-3 px-4 sm:gap-4 sm:px-6"
    : "mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6 md:py-4";

  const menuPanelClass = immersive
    ? "hero-nav-band__menu md:hidden"
    : "border-t border-ink/10 bg-cream md:hidden";

  return (
    <header className={headerClass}>
      <div className={innerClass}>
        {!immersive ? (
          <Link
            href="/"
            aria-label="AstraJax home"
            className="flex shrink-0 items-center gap-2 font-display text-lg font-semibold tracking-tight text-ink sm:gap-2.5"
            onClick={closeMenu}
          >
            <Image
              src="/astrajax-logo.png"
              alt=""
              width={1024}
              height={929}
              priority
              className="h-8 w-auto shrink-0"
            />
            <span>AstraJax</span>
          </Link>
        ) : null}

        <nav
          className="hidden flex-1 items-center justify-center gap-10 lg:gap-12 md:flex"
          aria-label="Main"
        >
          {links.map((link) => (
            <a key={link.href} href={link.href} className={desktopLinkClass(link)}>
              {link.label}
            </a>
          ))}
        </nav>

        <nav
          className="flex flex-1 items-center justify-end gap-4 sm:gap-5 md:hidden"
          aria-label="Featured"
        >
          {featuredLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={mobileFeaturedClass()}
              onClick={closeMenu}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <button
          type="button"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink/15 text-ink transition hover:border-ink/30 md:hidden"
          aria-expanded={menuOpen}
          aria-controls={panelId}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <MenuIcon open={menuOpen} />
        </button>
      </div>

      {menuOpen ? (
        <nav id={panelId} aria-label="More" className={menuPanelClass}>
          <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
            <ul className="grid gap-1">
              {secondaryLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="block rounded-lg px-3 py-3 transition hover:bg-ink/5"
                    onClick={closeMenu}
                  >
                    <span className="block text-base font-medium text-ink">{link.label}</span>
                    {link.hint ? (
                      <span className="mt-0.5 block text-sm text-ink-muted">{link.hint}</span>
                    ) : null}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
