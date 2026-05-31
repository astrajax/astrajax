const links = [
  { href: "/#story", label: "Story" },
  { href: "/#clive", label: "Clive" },
  { href: "/#method", label: "Method" },
  { href: "/#proof", label: "Proof" },
  { href: "/journey", label: "Journey" },
  { href: "/seeds-of-promise", label: "Seeds" },
  { href: "/#clive", label: "Clive" },
  { href: "/#start", label: "Contact" },
];

export function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-cream">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-display text-lg font-semibold text-ink">AstraJax</p>
        <nav className="flex flex-wrap gap-5">
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
      </div>
    </footer>
  );
}
