"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { BOOKING_URL } from "@/lib/site";

const links = [
  { href: "/#story", label: "Story" },
  { href: "/#clive", label: "Clive" },
  { href: "/#problem", label: "Problem" },
  { href: "/#method", label: "Method" },
  { href: "/#proof", label: "Proof" },
  { href: "/#agent-cast", label: "Cast" },
  { href: "/#offers", label: "Offers" },
  { href: "/journey", label: "Journey" },
  { href: "/seeds-of-promise", label: "Seeds" },
];

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

export function Nav() {
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

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-cream/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3 md:py-4">
        <Link
          href="/"
          aria-label="AstraJax home"
          className="flex items-center gap-2.5 font-display text-lg font-semibold tracking-tight text-ink"
          onClick={closeMenu}
        >
          <Image
            src="/astrajax-logo.png"
            alt=""
            width={32}
            height={32}
            priority
            className="h-8 w-8 shrink-0"
          />
          <span>AstraJax</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Main">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-ink-muted transition-colors hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 text-ink transition hover:border-ink/30 md:hidden"
            aria-expanded={menuOpen}
            aria-controls={panelId}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <MenuIcon open={menuOpen} />
          </button>
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary hidden shrink-0 text-sm md:inline-flex"
          >
            Book an Audit
          </a>
        </div>
      </div>

      {menuOpen ? (
        <nav
          id={panelId}
          aria-label="Mobile"
          className="border-t border-ink/10 bg-cream md:hidden"
        >
          <div className="mx-auto max-w-6xl px-6 py-4">
            <ul className="grid gap-1">
              {links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="block rounded-lg px-3 py-3 text-base font-medium text-ink transition hover:bg-ink/5"
                    onClick={closeMenu}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary mt-4 w-full justify-center text-sm"
              onClick={closeMenu}
            >
              Book an Audit
            </a>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
