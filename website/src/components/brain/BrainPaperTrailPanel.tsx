import type { PaperTrailLine } from "@/lib/platform/brain-health";
import { getBrainBySlug } from "@/lib/platform/brains";

const SEED_PAPER_TRAIL: PaperTrailLine[] = [
  {
    id: "pt-seed-promote-1",
    action: "Promoted memory to Brain Truth (Workshop proposal)",
    actor: "Regional domain owner",
    reason: "Human gate: pricing guardrail snippet queued for truth review.",
    timestamp: "2026-06-18T10:15:00.000Z",
  },
  {
    id: "pt-seed-retire-1",
    action: "Proposed retire from retrieval",
    actor: "Clive's Man",
    reason: "Importance-1 working memory unused 14+ days — audit trail preserved.",
    timestamp: "2026-06-22T16:40:00.000Z",
  },
];

function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(
      new Date(iso),
    );
  } catch {
    return iso;
  }
}

export function BrainPaperTrailPanel({ slug }: { slug: string }) {
  const brain = getBrainBySlug(slug);
  const seedLines = SEED_PAPER_TRAIL;

  return (
    <div>
      <p className="section-label">Paper trail</p>
      <p className="mt-2 max-w-2xl text-sm text-ink-muted">
        Governed actions for {brain?.name ?? slug}. Promote, retire, and review events accumulate
        here — demo seed below; session actions in other tabs add lines locally.
      </p>

      {seedLines.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-ink/15 bg-white p-6 text-sm text-ink-muted">
          No paper-trail lines seeded for this brain yet.
        </p>
      ) : (
        <ul className="platform-paper-trail__list mt-6">
          {seedLines.map((line) => (
            <li key={line.id} className="platform-paper-trail__item card p-4">
              <p className="platform-paper-trail__action">{line.action}</p>
              <p className="platform-paper-trail__meta">
                {line.actor} · {formatWhen(line.timestamp)}
              </p>
              <p className="platform-paper-trail__reason">{line.reason}</p>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6 text-xs text-ink-muted">
        Demo data. Session promote/retire actions in Truths + memories and Context health tabs stay
        in-browser until live registry wiring ships.
      </p>
    </div>
  );
}
