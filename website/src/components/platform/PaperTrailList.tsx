import type { PaperTrailLine } from "@/lib/platform/brain-health";

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

export function PaperTrailList({ lines }: { lines: PaperTrailLine[] }) {
  if (lines.length === 0) return null;
  return (
    <div className="platform-paper-trail mt-4">
      <p className="section-label mb-3">Paper trail</p>
      <ul className="platform-paper-trail__list">
        {lines.map((line) => (
          <li key={line.id} className="platform-paper-trail__item">
            <p className="platform-paper-trail__action">{line.action}</p>
            <p className="platform-paper-trail__meta">
              {line.actor} · {formatWhen(line.timestamp)}
            </p>
            <p className="platform-paper-trail__reason">{line.reason}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
