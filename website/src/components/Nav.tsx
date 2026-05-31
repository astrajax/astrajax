import Image from "next/image";

const links = [
  { href: "#story", label: "Story" },
  { href: "#problem", label: "Problem" },
  { href: "#method", label: "Method" },
  { href: "#proof", label: "Proof" },
  { href: "#offers", label: "Offers" },
  { href: "#clive", label: "Clive" },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-cream/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <a
          href="#"
          aria-label="AstraJax home"
          className="flex items-center gap-2.5 font-display text-lg font-semibold tracking-tight text-ink"
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
        </a>
        <nav className="hidden items-center gap-6 md:flex">
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
        <a href="#start" className="btn-primary shrink-0 text-sm">
          Book an Audit
        </a>
      </div>
    </header>
  );
}
