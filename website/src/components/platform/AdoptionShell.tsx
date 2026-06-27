import Image from "next/image";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PlatformNav } from "@/components/platform/PlatformNav";
import { DEFAULT_ADOPTION, ADOPTION_PROOF_NOTE } from "@/lib/platform/adoption";
import { TRAINING_HUB_URL } from "@/lib/site";

function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function trendArrow(trend: "up" | "stable" | "down"): string {
  if (trend === "up") return "↑";
  if (trend === "down") return "↓";
  return "→";
}

export function AdoptionShell() {
  const snapshot = DEFAULT_ADOPTION;
  const xpPercent = Math.min(
    100,
    Math.round((snapshot.xp.currentXp / snapshot.xp.xpRequired) * 100),
  );

  return (
    <>
      <Nav />
      <PlatformNav />
      <main className="platform-page">
        <div className="platform-page__inner">
          <header className="platform-page__header">
            <div className="flex flex-wrap items-start gap-4">
              <Image
                src={snapshot.hostPortraitSrc}
                alt={`Portrait of ${snapshot.hostName}`}
                width={88}
                height={88}
                sizes="88px"
                className="platform-agent-card__portrait platform-agent-card__portrait--lg"
              />
              <div>
                <p className="section-label">Adoption scorekeeper</p>
                <h1 className="font-display mt-2 text-3xl font-semibold text-ink sm:text-4xl">
                  {snapshot.hostName}
                </h1>
                <p className="mt-1 text-sm font-medium platform-apricot-text">{snapshot.hostRole}</p>
                <p className="mt-3 max-w-2xl text-lg text-ink-muted">{snapshot.hostGreeting}</p>
              </div>
            </div>
          </header>

          <section className="card platform-adoption-enablement p-4 sm:col-span-2">
            <p className="text-sm text-ink">{snapshot.enablementNote}</p>
          </section>

          <div className="platform-grid mt-8">
            <section className="card p-5 sm:col-span-2">
              <p className="section-label">Adoption signals: {snapshot.brainName}</p>
              <p className="mt-1 text-xs text-ink-muted">Team momentum, not individual surveillance.</p>
              <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {snapshot.signals.map((signal) => (
                  <li key={signal.id} className="card-muted p-4">
                    <p className="section-label">{signal.label}</p>
                    <p className="platform-adoption-metric mt-2 font-display text-2xl font-semibold text-ink">
                      {signal.value}
                      <span className="text-base font-normal text-ink-muted">{signal.unit}</span>
                      <span className="ml-2 text-sm text-sage" aria-label={`Trend ${signal.trend}`}>
                        {trendArrow(signal.trend)}
                      </span>
                    </p>
                    {signal.id === "confidence" ? (
                      <p className="mt-1 text-xs font-medium text-ink-muted">
                        Aggregated team signal, not individual scores.
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs text-ink-muted">{signal.description}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section className="card p-5">
              <p className="section-label">XP and level</p>
              <p className="mt-1 text-xs text-ink-muted">
                Team brain progress, not individual ranking
              </p>
              <p className="mt-2 font-display text-xl font-semibold text-ink">
                {snapshot.brainName}, Level {snapshot.xp.level}: {snapshot.xp.label}
              </p>
              <div
                className="platform-adoption-xp-bar mt-4"
                role="progressbar"
                aria-valuenow={xpPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="XP progress"
              >
                <div className="platform-adoption-xp-bar__fill" style={{ width: `${xpPercent}%` }} />
              </div>
              <p className="platform-adoption-metric mt-2 text-sm text-ink-muted">
                {snapshot.xp.currentXp} / {snapshot.xp.xpRequired} XP
              </p>
            </section>

            <section className="card p-5">
              <p className="section-label">Proof link</p>
              <p className="mt-2 text-sm text-ink-muted">{ADOPTION_PROOF_NOTE}</p>
              <a
                href={TRAINING_HUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary mt-4 inline-flex text-sm"
              >
                Open training hub
              </a>
            </section>

            <section className="card p-5 sm:col-span-2">
              <p className="section-label">Celebrate teams, never rank individuals</p>
              <p className="mt-1 text-xs text-ink-muted">
                Positive categories only. No &quot;who asked fewest questions&quot; leaderboard.
              </p>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {snapshot.teamCelebrations.map((entry) => (
                  <li key={entry.id} className="card-muted p-4">
                    <p className="section-label">{entry.team}</p>
                    <p className="mt-1 font-display font-semibold text-ink">{entry.headline}</p>
                    <p className="mt-1 text-sm text-ink-muted">{entry.detail}</p>
                    <p className="mt-2 text-xs text-ink-muted">{formatWhen(entry.celebratedAt)}</p>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <p className="mt-6 text-sm text-ink-muted">
            Brain maturity lives separately in{" "}
            <Link href="/brain/health" className="text-apricot underline-offset-2 hover:underline">
              Brain health
            </Link>
            . This surface is the people side of adoption.
          </p>

          <p className="mt-4 text-xs text-ink-muted">
            Demo data. Actions update this session only, not live records.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
