"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { CHAPTER1_BRAIN_SLUG } from "@/lib/brains/airtable-ids";
import type { InteractionSummary } from "@/lib/brains/types";

const REVIEWER_STORAGE_KEY = "astrajax-interaction-reviewer";

async function fetchInteractions(brainSlug: string): Promise<InteractionSummary[]> {
  const params = new URLSearchParams({ brainSlug, limit: "25" });
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
}): Promise<InteractionSummary> {
  const response = await fetch("/api/brains/interactions/score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await response.json()) as { interaction?: InteractionSummary; error?: string };
  if (!response.ok) throw new Error(data.error ?? "Could not save score.");
  if (!data.interaction) throw new Error("Score saved but no interaction returned.");
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
    try {
      const updated = await submitScore({
        recordId: interaction.recordId,
        brainSlug,
        qualityScore: score,
        reviewer: reviewer.trim(),
        reviewNotes: notes.trim() || undefined,
        suspectedContextIssue: flagContext,
      });
      onSaved(updated);
      setSaved(true);
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
      {saved && !error ? (
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
  onSaved: (updated: InteractionSummary) => void;
}

function InteractionCard({ interaction, brainSlug, reviewer, onSaved }: InteractionCardProps) {
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
          <p className="text-sm leading-relaxed text-ink-muted whitespace-pre-wrap">
            {interaction.assistantReply}
          </p>
        </div>
      </div>

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
      const rows = await fetchInteractions(brainSlug);
      setInteractions(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load interactions.");
    } finally {
      setLoading(false);
    }
  }, [brainSlug]);

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
          add notes, and flag anything that looks like a context problem. Scores write
          straight back to your Brain Interactions log.
        </p>

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
                {interactions.length} loaded · {pendingCount} awaiting score
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
            No interactions logged yet for this brain. Ask Clive or Pam a question first —
            then come back here to score the answer.
          </p>
        ) : null}

        <div className="mt-8 space-y-6">
          {interactions.map((interaction) => (
            <InteractionCard
              key={interaction.recordId}
              interaction={interaction}
              brainSlug={brainSlug}
              reviewer={reviewer}
              onSaved={handleSaved}
            />
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
