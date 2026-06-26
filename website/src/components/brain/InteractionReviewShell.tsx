"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { CHAPTER1_BRAIN_SLUG } from "@/lib/brains/airtable-ids";
import type { InteractionSummary } from "@/lib/brains/types";

const REVIEWER_STORAGE_KEY = "astrajax-interaction-reviewer";

type ReviewView = "all" | "needsReview";

async function fetchInteractions(
  brainSlug: string,
  view: ReviewView,
): Promise<InteractionSummary[]> {
  const params = new URLSearchParams({ brainSlug, limit: "25" });
  if (view === "needsReview") params.set("shortlist", "true");
  const response = await fetch(`/api/brains/interactions/list?${params.toString()}`);
  const data = (await response.json()) as { interactions?: InteractionSummary[]; error?: string };
  if (!response.ok) throw new Error(data.error ?? "Could not load interactions.");
  return data.interactions ?? [];
}

async function submitScore(payload: {
  recordId: string;
  brainSlug: string;
  qualityScore: number;
  reviewer: string;
  reviewNotes?: string;
  suspectedContextIssue?: boolean;
}): Promise<{ interaction: InteractionSummary; autoProposed?: boolean }> {
  const response = await fetch("/api/brains/interactions/score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await response.json()) as {
    interaction?: InteractionSummary;
    autoProposed?: boolean;
    error?: string;
  };
  if (!response.ok) throw new Error(data.error ?? "Could not save score.");
  if (!data.interaction) throw new Error("Score saved but no interaction returned.");
  return { interaction: data.interaction, autoProposed: data.autoProposed };
}

async function submitUpkeepAction(payload: {
  recordId: string;
  brainSlug: string;
  action: "propose" | "dismiss";
  quarantine?: boolean;
}): Promise<InteractionSummary> {
  const response = await fetch("/api/brains/interactions/action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await response.json()) as { interaction?: InteractionSummary; error?: string };
  if (!response.ok) throw new Error(data.error ?? "Could not save action.");
  if (!data.interaction) throw new Error("Action saved but no interaction returned.");
  return data.interaction;
}

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

function personaLabel(persona: string): string {
  if (persona === "pam") return "Pam";
  if (persona === "doc") return "Doc";
  return "Clive";
}

function statusBadge(interaction: InteractionSummary): string | null {
  if (interaction.reviewStatus === "Action proposed") return "Action proposed";
  if (interaction.reviewStatus === "No action") return "Dismissed";
  if (interaction.suspectedContextIssue) return "Context flagged";
  if (interaction.qualityScore && interaction.qualityScore <= 2) return "Low score";
  return null;
}

function ManifestBlock({ interaction }: { interaction: InteractionSummary }) {
  const ids = interaction.manifestRecordIds ?? [];
  if (ids.length === 0) {
    return (
      <p className="mt-3 text-xs text-ink-muted">
        No grant-backed context manifest — answer may have used public fallback snippets only.
      </p>
    );
  }

  if (interaction.isFallbackContext) {
    return (
      <div className="mt-3 rounded-xl border border-ink/10 bg-cream-deep/30 px-3 py-2 text-xs text-ink-muted">
        <p className="font-medium text-ink">Fallback context (not Trusted Brain rows)</p>
        <p className="mt-1">{ids.join(", ")}</p>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-ink/10 bg-cream-deep/30 px-3 py-2 text-xs">
      <p className="section-label mb-1">Context records used</p>
      <ul className="list-inside list-disc text-ink-muted">
        {ids.map((id) => (
          <li key={id}>{id}</li>
        ))}
      </ul>
    </div>
  );
}

interface UpkeepActionsProps {
  interaction: InteractionSummary;
  brainSlug: string;
  onUpdated: (updated: InteractionSummary) => void;
}

function UpkeepActions({ interaction, brainSlug, onUpdated }: UpkeepActionsProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const alreadyProposed = interaction.reviewStatus === "Action proposed";
  const dismissed = interaction.reviewStatus === "No action";

  const runAction = async (action: "propose" | "dismiss", quarantine?: boolean) => {
    setSaving(true);
    setError(null);
    try {
      const updated = await submitUpkeepAction({
        recordId: interaction.recordId,
        brainSlug,
        action,
        quarantine,
      });
      onUpdated(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setSaving(false);
    }
  };

  if (dismissed) {
    return <p className="mt-3 text-sm text-ink-muted">Marked as no action needed.</p>;
  }

  return (
    <div className="mt-4 rounded-2xl border border-apricot/20 bg-apricot/5 p-4">
      <p className="section-label mb-2">Upkeep actions</p>
      <p className="text-xs leading-relaxed text-ink-muted">
        Propose sends a review item to Clive&apos;s Man — Workshop only, never auto-edits Trusted
        truth. Dismiss clears this from the shortlist.
      </p>
      {alreadyProposed ? (
        <p className="mt-2 text-sm text-sage">
          Context review already proposed ({interaction.contextFlagged}).
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={saving || alreadyProposed}
          onClick={() => void runAction("propose")}
          className="btn-primary py-2 text-xs disabled:opacity-60"
        >
          Propose context review
        </button>
        <button
          type="button"
          disabled={saving || alreadyProposed}
          onClick={() => void runAction("propose", true)}
          className="btn-secondary py-2 text-xs disabled:opacity-60"
        >
          Propose quarantine
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => void runAction("dismiss")}
          className="btn-secondary py-2 text-xs disabled:opacity-60"
        >
          Dismiss — no action
        </button>
      </div>
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}

interface ScoreFormProps {
  interaction: InteractionSummary;
  brainSlug: string;
  reviewer: string;
  onSaved: (updated: InteractionSummary) => void;
}

function ScoreForm({ interaction, brainSlug, reviewer, onSaved }: ScoreFormProps) {
  const [score, setScore] = useState(interaction.qualityScore ?? 0);
  const [notes, setNotes] = useState(interaction.reviewNotes ?? "");
  const [flagContext, setFlagContext] = useState(Boolean(interaction.suspectedContextIssue));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(Boolean(interaction.qualityScore));
  const [autoProposedNote, setAutoProposedNote] = useState<string | null>(null);

  const submit = async () => {
    if (!reviewer.trim()) {
      setError("Enter your name before submitting a score.");
      return;
    }
    if (score < 1 || score > 5) {
      setError("Pick a score from 1 to 5.");
      return;
    }

    setSaving(true);
    setError(null);
    setAutoProposedNote(null);
    try {
      const result = await submitScore({
        recordId: interaction.recordId,
        brainSlug,
        qualityScore: score,
        reviewer: reviewer.trim(),
        reviewNotes: notes.trim() || undefined,
        suspectedContextIssue: flagContext,
      });
      onSaved(result.interaction);
      setSaved(true);
      if (result.autoProposed) {
        setAutoProposedNote(
          "Low score — Clive's Man has proposed a context review in Workshop (Trusted truth untouched).",
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-4 rounded-2xl border border-ink/10 bg-cream-deep/40 p-4">
      <fieldset>
        <legend className="section-label mb-2">Quality score</legend>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Quality score 1 to 5">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={score === value}
              onClick={() => setScore(value)}
              className={`h-10 w-10 rounded-full border text-sm font-medium transition ${
                score === value
                  ? "border-apricot bg-apricot text-white"
                  : "border-ink/20 bg-white text-ink hover:border-apricot"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="mt-4 block">
        <span className="section-label mb-2 block">Notes (optional)</span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={3}
          className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm text-ink"
          placeholder="What worked, what missed, or what felt off?"
        />
      </label>

      <label className="mt-3 flex items-start gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={flagContext}
          onChange={(event) => setFlagContext(event.target.checked)}
          className="mt-1"
        />
        <span>Suspected context issue — answer may have used wrong or stale brain material</span>
      </label>

      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      {autoProposedNote ? <p className="mt-3 text-sm text-sage">{autoProposedNote}</p> : null}
      {saved && !error && !autoProposedNote ? (
        <p className="mt-3 text-sm text-sage">Score saved — thank you.</p>
      ) : null}

      <button
        type="button"
        onClick={submit}
        disabled={saving}
        className="btn-primary mt-4 disabled:opacity-60"
      >
        {saving ? "Saving…" : interaction.qualityScore ? "Update score" : "Submit score"}
      </button>
    </div>
  );
}

interface InteractionCardProps {
  interaction: InteractionSummary;
  brainSlug: string;
  reviewer: string;
  view: ReviewView;
  onSaved: (updated: InteractionSummary) => void;
  onUpdated: (updated: InteractionSummary) => void;
}

function InteractionCard({
  interaction,
  brainSlug,
  reviewer,
  view,
  onSaved,
  onUpdated,
}: InteractionCardProps) {
  const badge = statusBadge(interaction);

  return (
    <article className="rounded-3xl border border-ink/10 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-moss px-3 py-1 text-xs font-medium text-cream">
            {personaLabel(interaction.persona)}
          </span>
          {interaction.qualityScore ? (
            <span className="rounded-full bg-apricot/15 px-3 py-1 text-xs font-medium text-apricot">
              Scored {interaction.qualityScore}/5
            </span>
          ) : (
            <span className="rounded-full bg-ink/5 px-3 py-1 text-xs font-medium text-ink-muted">
              Awaiting review
            </span>
          )}
          {badge ? (
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">
              {badge}
            </span>
          ) : null}
        </div>
        <time className="text-xs text-ink-muted" dateTime={interaction.createdAt}>
          {formatWhen(interaction.createdAt)}
        </time>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <p className="section-label mb-1">Question</p>
          <p className="text-sm leading-relaxed text-ink">{interaction.userMessage}</p>
        </div>
        <div>
          <p className="section-label mb-1">Answer</p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-muted">
            {interaction.assistantReply}
          </p>
        </div>
      </div>

      <ManifestBlock interaction={interaction} />

      {view === "needsReview" ? (
        <UpkeepActions interaction={interaction} brainSlug={brainSlug} onUpdated={onUpdated} />
      ) : null}

      <ScoreForm
        interaction={interaction}
        brainSlug={brainSlug}
        reviewer={reviewer}
        onSaved={onSaved}
      />
    </article>
  );
}

export function InteractionReviewShell() {
  const brainSlug = CHAPTER1_BRAIN_SLUG;
  const [reviewer, setReviewer] = useState("");
  const [view, setView] = useState<ReviewView>("needsReview");
  const [interactions, setInteractions] = useState<InteractionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(REVIEWER_STORAGE_KEY);
    if (stored) setReviewer(stored);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(REVIEWER_STORAGE_KEY, reviewer);
  }, [reviewer]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchInteractions(brainSlug, view);
      setInteractions(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load interactions.");
    } finally {
      setLoading(false);
    }
  }, [brainSlug, view]);

  useEffect(() => {
    void load();
  }, [load]);

  const pendingCount = useMemo(
    () => interactions.filter((row) => !row.qualityScore).length,
    [interactions],
  );

  const handleSaved = (updated: InteractionSummary) => {
    setInteractions((prev) =>
      prev.map((row) => (row.recordId === updated.recordId ? updated : row)),
    );
  };

  const handleUpdated = (updated: InteractionSummary) => {
    setInteractions((prev) => {
      if (view === "needsReview" && updated.reviewStatus === "No action") {
        return prev.filter((row) => row.recordId !== updated.recordId);
      }
      return prev.map((row) => (row.recordId === updated.recordId ? updated : row));
    });
  };

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="section-label">Brain quality review</p>
        <h1 className="font-display mt-2 text-3xl font-semibold text-ink sm:text-4xl">
          Rate recent agent answers
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-muted">
          Review past Clive and Pam interactions for your brain. Score each answer 1–5,
          add notes, and flag anything that looks like a context problem. The{" "}
          <strong className="font-medium text-ink">Needs review</strong> tab shows a Pam
          shortlist — low scores and suspected context issues — so you are not asked to triage
          everything.
        </p>

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={() => setView("needsReview")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              view === "needsReview"
                ? "bg-apricot text-white"
                : "border border-ink/15 bg-white text-ink hover:border-apricot"
            }`}
          >
            Needs review
          </button>
          <button
            type="button"
            onClick={() => setView("all")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              view === "all"
                ? "bg-apricot text-white"
                : "border border-ink/15 bg-white text-ink hover:border-apricot"
            }`}
          >
            All interactions
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-ink/10 bg-white p-4">
          <label className="block">
            <span className="section-label mb-2 block">Your name</span>
            <input
              type="text"
              value={reviewer}
              onChange={(event) => setReviewer(event.target.value)}
              className="w-full rounded-xl border border-ink/15 px-3 py-2 text-sm"
              placeholder="Who is reviewing?"
            />
          </label>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-ink-muted">
            <span>Brain: {brainSlug}</span>
            {!loading ? (
              <span>
                {interactions.length} loaded
                {view === "all" ? ` · ${pendingCount} awaiting score` : " in shortlist"}
              </span>
            ) : null}
            <button type="button" onClick={() => void load()} className="btn-secondary py-2 text-xs">
              Refresh
            </button>
          </div>
        </div>

        {loading ? <p className="mt-8 text-sm text-ink-muted">Loading interactions…</p> : null}
        {error ? <p className="mt-8 text-sm text-red-700">{error}</p> : null}

        {!loading && !error && interactions.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-dashed border-ink/15 bg-white p-6 text-sm text-ink-muted">
            {view === "needsReview"
              ? "Nothing on the shortlist right now — no low scores or context flags awaiting attention."
              : "No interactions logged yet for this brain. Ask Clive or Pam a question first — then come back here to score the answer."}
          </p>
        ) : null}

        <div className="mt-8 space-y-6">
          {interactions.map((interaction) => (
            <InteractionCard
              key={interaction.recordId}
              interaction={interaction}
              brainSlug={brainSlug}
              reviewer={reviewer}
              view={view}
              onSaved={handleSaved}
              onUpdated={handleUpdated}
            />
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
