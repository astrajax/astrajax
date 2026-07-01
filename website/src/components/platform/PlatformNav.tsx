"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const PLATFORM_LINKS = [
  { href: "/brain", label: "Brain shrine" },
  { href: "/agents", label: "Agent bases" },
  { href: "/coach", label: "Coach" },
  { href: "/court", label: "Court mode" },
  { href: "/fleet", label: "Fleet design" },
  { href: "/deploy", label: "Package and deploy" },
  { href: "/dispatch", label: "Doc dispatch" },
  { href: "/adoption", label: "Adoption" },
] as const;

export function PlatformNav() {
  const pathname = usePathname();

  return (
    <nav
      className="platform-nav"
      aria-label="Platform surfaces"
    >
      <div className="platform-nav__inner">
        <Link href="/#platform" className="section-label platform-nav__home">
          Platform
        </Link>
        <ul className="platform-nav__list">
          {PLATFORM_LINKS.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`platform-nav__link${active ? " platform-nav__link--active" : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
