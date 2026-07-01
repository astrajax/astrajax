"use client";

import Link from "next/link";
import { useStoryMode } from "@/components/command-centre/StoryModeProvider";

type FeatureStatus = "live" | "coming";

type FeatureEntry = {
  title: string;
  description: string;
  href?: string;
  status: FeatureStatus;
  cta: string;
};

const FEATURES: FeatureEntry[] = [
  {
    title: "Brain review",
    description: "Score agent answers and flag stale context from the Needs-review shortlist.",
    href: "/brain/review",
    status: "live",
    cta: "Open review",
  },
  {
    title: "Chat with Clive",
    description: "Ask Clive from anywhere — same governed context, booth-safe fallback.",
    href: "/chapter-1?book=reason",
    status: "live",
    cta: "Reason with Clive",
  },
  {
    title: "Agent Bases — conversation review + memories",
    description: "Review persona config and persona memories across agent bases.",
    href: "/agents",
    status: "live",
    cta: "Open agent bases",
  },
  {
    title: "Brains — health meter + memories review",
    description: "Maturity ladder, efficiency credit, leaderboard, and truths + memories promote gate.",
    href: "/brain/health",
    status: "live",
    cta: "Open brain health",
  },
  {
    title: "User Brain — coaching on prompting",
    description: "Coach Whit — standalone prompting coaching calibrated to your user brain.",
    href: "/coach",
    status: "live",
    cta: "Open coach",
  },
  {
    title: "Court Mode",
    description: "High-stakes multi-perspective panel — the Court surfaces perspectives; you give judgement.",
    href: "/court",
    status: "live",
    cta: "Enter the court",
  },
  {
    title: "Fleet Design",
    description: "Task-scoped agents — personality editable, competence locked — with human-gated approval.",
    href: "/fleet",
    status: "live",
    cta: "Design the fleet",
  },
  {
    title: "Package and Deploy",
    description: "HyperAgent-ready packages with governed defaults and honest mock deployment.",
    href: "/deploy",
    status: "live",
    cta: "Open deploy",
  },
  {
    title: "Doc Dispatch",
    description: "Implementation jobs board — routing, Opus to Composer builds, publish gates.",
    href: "/dispatch",
    status: "live",
    cta: "Open dispatch",
  },
  {
    title: "Adoption",
    description: "KK Kingsford scorekeeper — training, confidence, team celebrations, enablement not surveillance.",
    href: "/adoption",
    status: "live",
    cta: "Open adoption",
  },
];

const COMMAND_LINKS = [
  { href: "/command/clive", label: "Clive's study" },
  { href: "/command/doc", label: "Doc's workshop" },
  { href: "/command/pam", label: "Pam's desk" },
] as const;

export function FeatureHub() {
  const { portraitDoorsEnabled } = useStoryMode();

  return (
    <section id="platform" className="border-t border-ink/10 bg-cream-deep/40 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="section-label">Platform</p>
        <h2 className="font-display mt-3 text-3xl font-semibold text-ink sm:text-4xl">
          {portraitDoorsEnabled ? "All platform surfaces" : "Core features"}
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-ink-muted">
          {portraitDoorsEnabled ? (
            <>
              Step into a room through the portraits above — or use this full index to jump straight
              to any surface.
            </>
          ) : (
            <>
              The adoption operating system — live where it exists, honest &quot;coming&quot; where it
              doesn&apos;t. No fake screens.
            </>
          )}
        </p>

        {!portraitDoorsEnabled ? (
          <ul className="mt-6 flex flex-wrap gap-3">
            {COMMAND_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="btn-secondary text-sm">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <li key={feature.title}>
              <article
                className={`feature-hub-card h-full ${
                  feature.status === "coming" ? "feature-hub-card--coming" : ""
                }`}
              >
                <span
                  className={`feature-hub-card__badge ${
                    feature.status === "live"
                      ? "feature-hub-card__badge--live"
                      : "feature-hub-card__badge--coming"
                  }`}
                >
                  {feature.status === "live" ? "Live" : "Coming"}
                </span>
                <h3 className="mt-3 font-display text-lg font-semibold text-ink">{feature.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">
                  {feature.description}
                </p>
                {feature.href && feature.status === "live" ? (
                  <Link href={feature.href} className="btn-primary mt-5 inline-flex text-sm">
                    {feature.cta}
                  </Link>
                ) : (
                  <span className="mt-5 inline-flex rounded-full border border-ink/15 px-4 py-2 text-sm text-ink-muted">
                    {feature.cta}
                  </span>
                )}
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
