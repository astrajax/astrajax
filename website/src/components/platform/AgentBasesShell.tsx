import Image from "next/image";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PlatformNav } from "@/components/platform/PlatformNav";
import { AGENT_ROSTER } from "@/lib/platform/agent-bases";

function AgentPortrait({ name, portraitSrc }: { name: string; portraitSrc?: string }) {
  if (portraitSrc) {
    return (
      <Image
        src={portraitSrc}
        alt=""
        width={80}
        height={80}
        sizes="80px"
        className="platform-agent-card__portrait"
      />
    );
  }

  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  return (
    <div className="platform-agent-card__nameplate" aria-hidden>
      <span>{initials}</span>
    </div>
  );
}

export function AgentBasesShell() {
  return (
    <>
      <Nav />
      <PlatformNav />
      <main className="platform-page">
        <div className="platform-page__inner">
          <header className="platform-page__header">
            <p className="section-label">Agent bases review</p>
            <h1 className="font-display mt-2 text-3xl font-semibold text-ink sm:text-4xl">
              Fleet roster
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-ink-muted">
              Tiered character context lives in agent bases. Agents propose; humans promote to canonical.
            </p>
          </header>

          <ul className="mt-10 grid gap-4 sm:grid-cols-2">
            {AGENT_ROSTER.map((agent) =>
              agent.slug === "clive-man" ? (
                <li key={agent.slug}>
                  <div className="platform-agent-card card p-5">
                    <div className="flex gap-4">
                      <Link
                        href="/brain"
                        aria-label="Enter the brain shrine"
                        className="shrink-0 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-apricot"
                      >
                        <AgentPortrait name={agent.name} portraitSrc={agent.portraitSrc} />
                      </Link>
                      <Link href={`/agents/${agent.slug}`} className="min-w-0 flex-1 block">
                        <h2 className="font-display text-xl font-semibold text-ink">{agent.name}</h2>
                        <p className="text-sm font-medium platform-apricot-text">{agent.role}</p>
                        <p className="mt-2 text-sm text-ink-muted">{agent.oneLiner}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="status-pill status-pill--clean">{agent.brainName}</span>
                          <span className="status-pill status-pill--pending">{agent.maturityLabel}</span>
                          <span className="text-xs font-medium text-apricot">
                            Portrait opens brain shrine →
                          </span>
                        </div>
                      </Link>
                    </div>
                  </div>
                </li>
              ) : (
                <li key={agent.slug}>
                  <Link href={`/agents/${agent.slug}`} className="platform-agent-card card block p-5">
                    <div className="flex gap-4">
                      <AgentPortrait name={agent.name} portraitSrc={agent.portraitSrc} />
                      <div className="min-w-0 flex-1">
                        <h2 className="font-display text-xl font-semibold text-ink">{agent.name}</h2>
                        <p className="text-sm font-medium platform-apricot-text">{agent.role}</p>
                        <p className="mt-2 text-sm text-ink-muted">{agent.oneLiner}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="status-pill status-pill--clean">{agent.brainName}</span>
                          <span className="status-pill status-pill--pending">{agent.maturityLabel}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ),
            )}
          </ul>
          <p className="mt-8 text-xs text-ink-muted">
            Demo data. Actions update this session only, not live records.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
