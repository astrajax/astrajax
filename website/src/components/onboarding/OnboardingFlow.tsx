"use client";

/**
 * Two-route onboarding — the Living Folio flow against fixture contract v0.1.
 *
 * Opening choice between two verb-led routes (no maturity judgement), each
 * converging on Ruth's Evidence → Provisional Inference → Human Confirmation
 * state. Everything reads from getOnboardingEvidence() — the single seam
 * Ruth's verified contract satisfies later. No backend truth claims, canon,
 * invites, connectors, or production multi-tenancy.
 *
 * Folio grammar: teaching Clive left / lesson right at rest; the interaction
 * state (work left, Clive upper-right, actions below) as the user engages;
 * the thin gold-leaf thought-vein on sends; live text via StudyMarkdown;
 * page-native engraved controls; reduced-motion honoured; the reaction
 * queue keeps Clive's video uninterrupted.
 */
import { useCallback, useMemo, useState } from "react";
import {
  getOnboardingEvidence,
  type ConfirmationChoice,
  type SourcePackFile,
} from "@/lib/onboarding/evidence-contract";
import {
  acceptAsDraft,
  activeQuestions,
  answerGap,
  answerProbe,
  backStep,
  canAcceptDraft,
  canSwitchRoute,
  chooseRoute,
  initialOnboardingState,
  nextStep,
  probeProgress,
  setConfirmation,
  setCorrection,
  stageFile,
  stopProbingEarly,
  ROUTE_LABELS,
  type OnboardingState,
  type RouteId,
} from "@/lib/onboarding/machine";
import { StudyMarkdown } from "@/components/chapter1/StudyMarkdown";

export function OnboardingFlow() {
  const evidence = useMemo(() => getOnboardingEvidence(), []);
  const [state, setState] = useState<OnboardingState>(() => initialOnboardingState(evidence));
  const [draft, setDraft] = useState("");

  const choose = useCallback(
    (route: RouteId) => setState((s) => chooseRoute(s, route)),
    [],
  );
  const next = useCallback(() => setState((s) => nextStep(s)), []);
  const back = useCallback(() => setState((s) => backStep(s)), []);

  const questions = activeQuestions(state, evidence);
  const progress = probeProgress(state, evidence.probeQuestions.length);

  const submitAnswer = () => {
    const q = questions[state.route === "bring-material" ? Object.keys(state.gapAnswers).length : state.probeIndex];
    if (!q || !draft.trim()) return;
    if (state.route === "bring-material") {
      setState((s) => answerGap(s, q.id, draft.trim()));
    } else {
      setState((s) => answerProbe(s, q.id, draft.trim()));
    }
    setDraft("");
  };

  const currentQuestion =
    state.route === "bring-material"
      ? questions[Object.keys(state.gapAnswers).length]
      : questions[state.probeIndex];

  return (
    <div className="onboarding">
      {/* ── Opening choice — two equal verb-led routes, no maturity judgement ── */}
      {state.step === "choice" && (
        <section className="onboarding__choice" aria-labelledby="onb-choice-h">
          <p className="onboarding__eyebrow">Chapter 1 · begin</p>
          <h1 id="onb-choice-h" className="onboarding__h1">
            Two ways in. Same destination.
          </h1>
          <p className="onboarding__lede">
            Clive builds your Trusted Brain either way. Pick the route that fits
            how your material lives — you can switch any time before you confirm,
            and nothing you've said is lost.
          </p>
          <div className="onboarding__routes">
            {(Object.keys(ROUTE_LABELS) as RouteId[]).map((route) => (
              <button
                key={route}
                type="button"
                className="onboarding__route-card"
                onClick={() => choose(route)}
              >
                <span className="onboarding__route-verb">{ROUTE_LABELS[route].verb}</span>
                <span className="onboarding__route-best">{ROUTE_LABELS[route].bestWhen}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Route A: minimal envelope ── */}
      {state.step === "a-envelope" && (
        <FlowShell step="Bring your material · first, the envelope" onBack={back}>
          <h2 className="onboarding__h2">Three small things before your files.</h2>
          <div className="onboarding__card">
            <p className="onboarding__field-label">Identity</p>
            <p className="onboarding__body">You, and only you — this brain is yours.</p>
          </div>
          <div className="onboarding__card">
            <p className="onboarding__field-label">Authority</p>
            <p className="onboarding__body">
              You approve what becomes trusted. Clive proposes; you decide.
            </p>
          </div>
          <div className="onboarding__card">
            <p className="onboarding__field-label">Privacy</p>
            <p className="onboarding__body">
              Your material stays yours. Nothing here leaves this page or trains anything.
            </p>
          </div>
          <NavRow onPrimary={next} primaryLabel="To your Source Pack" />
        </FlowShell>
      )}

      {/* ── Route A: Source Pack manifest + upload/staging ── */}
      {state.step === "a-source-pack" && (
        <FlowShell step="Bring your material · the Source Pack" onBack={back}>
          <h2 className="onboarding__h2">Your Source Pack.</h2>
          <p className="onboarding__lede">
            Accepted:{" "}
            {evidence.sourcePack.accepted.map((t) => t.extension).join(", ")} · up to{" "}
            {evidence.sourcePack.maxFiles} files, {evidence.sourcePack.maxTotalMb} MB total.
          </p>
          <ul className="onboarding__file-list">
            {state.files.map((f) => (
              <li key={f.id} className={`onboarding__file onboarding__file--${f.state}`}>
                <span className="onboarding__file-name">{f.name}</span>
                <span className="onboarding__file-meta">
                  {f.extension} · {f.sizeMb} MB · {f.state}
                </span>
              </li>
            ))}
          </ul>
          <div className="onboarding__drop">
            <p className="onboarding__body">
              Drop files here, or{" "}
              <button
                type="button"
                className="onboarding__link-btn"
                onClick={() =>
                  setState((s) =>
                    stageFile(s, {
                      id: `f-${Date.now()}`,
                      name: "another-document.pdf",
                      extension: ".pdf",
                      sizeMb: 1.4,
                      state: "staging",
                    }),
                  )
                }
              >
                browse
              </button>
            </p>
          </div>
          <NavRow onPrimary={next} primaryLabel="See what Clive found" />
        </FlowShell>
      )}

      {/* ── Route A: extraction ledger + corpus census ── */}
      {state.step === "a-extraction" && (
        <FlowShell step="Bring your material · what Clive found" onBack={back}>
          <h2 className="onboarding__h2">Read deterministically, not guessed.</h2>
          <div className="onboarding__census">
            <span>{evidence.corpusCensus.documents} documents</span>
            <span>{evidence.corpusCensus.totalWords.toLocaleString()} words</span>
            {evidence.corpusCensus.namedSignals.map((s) => (
              <span key={s.label}>
                {s.count} {s.label}
              </span>
            ))}
          </div>
          <ul className="onboarding__ledger">
            {evidence.extractionLedger.map((row) => (
              <li key={row.id} className="onboarding__ledger-row">
                <span className="onboarding__ledger-label">{row.label}</span>
                <span className="onboarding__ledger-source">{row.sourceLabel}</span>
              </li>
            ))}
          </ul>
          <NavRow onPrimary={next} primaryLabel="Answer two gap questions" />
        </FlowShell>
      )}

      {/* ── Route A: targeted gap questions ── */}
      {state.step === "a-gap-questions" && (
        <FlowShell step="Bring your material · two gaps only" onBack={back} chat>
          <h2 className="onboarding__h2">Two things your documents can't say.</h2>
          <Conversation
            route={state.route}
            questions={questions}
            answers={state.gapAnswers}
            currentQuestion={currentQuestion}
            evidence={evidence}
          />
          {currentQuestion ? (
            <Composer
              value={draft}
              onChange={setDraft}
              onSubmit={submitAnswer}
              label="Your answer"
            />
          ) : (
            <NavRow onPrimary={next} primaryLabel="See what Clive has drafted" />
          )}
        </FlowShell>
      )}

      {/* ── Route B: Clive-led adaptive probing ── */}
      {state.step === "b-probing" && (
        <FlowShell step="Talk it through · with Clive" onBack={back} chat>
          <div className="onboarding__progress" role="progressbar" aria-valuenow={Math.round(progress.fraction * 100)} aria-valuemin={0} aria-valuemax={100}>
            <span className="onboarding__progress-bar" style={{ width: `${progress.fraction * 100}%` }} />
            <span className="onboarding__progress-text">
              {progress.answered} of {progress.total} · stop any time
            </span>
          </div>
          <Conversation
            route={state.route}
            questions={questions}
            answers={state.probeAnswers}
            currentQuestion={currentQuestion}
            evidence={evidence}
          />
          {currentQuestion ? (
            <>
              <Composer
                value={draft}
                onChange={setDraft}
                onSubmit={submitAnswer}
                label="Your answer"
              />
              <button type="button" className="onboarding__link-btn" onClick={() => setState((s) => stopProbingEarly(s))}>
                That's enough — go to what you've captured
              </button>
            </>
          ) : (
            <NavRow onPrimary={next} primaryLabel="Add one supporting file (optional)" />
          )}
        </FlowShell>
      )}

      {/* ── Route B: optional supporting file ── */}
      {state.step === "b-supporting-file" && (
        <FlowShell step="Talk it through · one file, if it helps" onBack={back}>
          <h2 className="onboarding__h2">One supporting file — entirely optional.</h2>
          <p className="onboarding__lede">
            If one document would sharpen what you've said, add it. Otherwise skip on.
          </p>
          {state.supportingFile ? (
            <p className="onboarding__body">✓ {state.supportingFile.name} attached.</p>
          ) : (
            <div className="onboarding__drop">
              <button
                type="button"
                className="onboarding__link-btn"
                onClick={() =>
                  setState((s) => ({
                    ...s,
                    supportingFile: {
                      id: `f-support-${Date.now()}`,
                      name: "supporting-note.md",
                      extension: ".md",
                      sizeMb: 0.1,
                      state: "staged",
                    },
                  }))
                }
              >
                Attach one file
              </button>
            </div>
          )}
          <NavRow onPrimary={next} primaryLabel="See what Clive has drafted" />
        </FlowShell>
      )}

      {/* ── Convergence: Evidence → Provisional Inference → Human Confirmation ── */}
      {state.step === "convergence" && (
        <FlowShell step="Confirm what's true · then it's a draft" onBack={back}>
          <h2 className="onboarding__h2">What Clive has provisionally drawn.</h2>
          <p className="onboarding__lede">
            Provisional only — nothing is trusted until you confirm it, item by item.
          </p>
          <div className="onboarding__inference">
            {evidence.provisional.fields.map((field) => (
              <div key={field.key} className="onboarding__infer-card">
                <p className="onboarding__field-label">{field.label}</p>
                <p className="onboarding__infer-value">{field.values.join(" · ")}</p>
                <EvidenceLinks ids={field.evidenceIds} evidence={evidence} />
                <div className="onboarding__infer-actions" role="group" aria-label={`Confirm ${field.label}`}>
                  {(["confirm", "correct", "leave_open"] as ConfirmationChoice[]).map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      className={`onboarding__choice-btn${state.confirmations[field.key] === choice ? " is-active" : ""}`}
                      aria-pressed={state.confirmations[field.key] === choice}
                      onClick={() => setState((s) => setConfirmation(s, field.key, choice))}
                    >
                      {choice === "confirm" ? "Confirm" : choice === "correct" ? "Correct" : "Leave open"}
                    </button>
                  ))}
                </div>
                {state.confirmations[field.key] === "correct" && (
                  <input
                    className="onboarding__correction"
                    type="text"
                    placeholder="The corrected value"
                    value={state.corrections[field.key] ?? ""}
                    onChange={(e) => setState((s) => setCorrection(s, field.key, e.target.value))}
                  />
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            className="btn-primary onboarding__accept"
            disabled={!canAcceptDraft(state, evidence)}
            onClick={() => setState((s) => acceptAsDraft(s, evidence))}
          >
            Accept as draft
          </button>
          {!canAcceptDraft(state, evidence) && (
            <p className="onboarding__hint">Decide on every item first — confirm, correct, or leave open.</p>
          )}
        </FlowShell>
      )}

      {/* ── Receipt: Clive handback ── */}
      {state.step === "receipt" && (
        <section className="onboarding__receipt">
          <p className="onboarding__eyebrow">Clive's handback</p>
          <h1 className="onboarding__h1">A draft, on your word.</h1>
          <StudyMarkdown
            content={
              "Here's what I'm holding, provisionally:\n\n" +
              evidence.provisional.fields
                .map((f) => {
                  const c = state.confirmations[f.key];
                  const mark = c === "confirm" ? "confirmed" : c === "correct" ? `corrected to “${state.corrections[f.key]}”` : "left open";
                  return `- **${f.label}** — ${f.values.join(" · ")} (*${mark}*)`;
                })
                .join("\n") +
              "\n\nNothing here is trusted yet. It's a draft brain, built from what you brought and what you said — your evidence stays visible against every line. When you're ready, we grow it together."
            }
          />
          <div className="onboarding__evidence-all">
            {evidence.evidence.map((e) => (
              <div key={e.id} className="onboarding__ev-row">
                <span className={`onboarding__ev-class onboarding__ev-class--${e.evidence_class}`}>
                  {e.evidence_class === "imported_document" ? "document" : "you said"}
                </span>
                <span className="onboarding__ev-title">{e.title}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* route switching, always available before confirmation */}
      {canSwitchRoute(state) && state.step !== "choice" && state.step !== "receipt" && (
        <p className="onboarding__switch">
          {state.route === "bring-material" ? (
            <>
              Rather talk it through?{" "}
              <button type="button" className="onboarding__link-btn" onClick={() => choose("talk-through")}>
                Switch — nothing is lost
              </button>
            </>
          ) : (
            <>
              Have documents after all?{" "}
              <button type="button" className="onboarding__link-btn" onClick={() => choose("bring-material")}>
                Switch — nothing is lost
              </button>
            </>
          )}
        </p>
      )}
    </div>
  );
}

// ── building blocks ──────────────────────────────────────────────────────────

function FlowShell({
  step,
  children,
  onBack,
  chat = false,
}: {
  step: string;
  children: React.ReactNode;
  onBack: () => void;
  chat?: boolean;
}) {
  return (
    <section className={`onboarding__flow${chat ? " onboarding__flow--chat" : ""}`}>
      <p className="onboarding__eyebrow">{step}</p>
      {children}
      <button type="button" className="study-stage__ghost-btn onboarding__back" onClick={onBack}>
        Back
      </button>
    </section>
  );
}

function NavRow({ onPrimary, primaryLabel }: { onPrimary: () => void; primaryLabel: string }) {
  return (
    <div className="onboarding__nav">
      <button type="button" className="btn-primary" onClick={onPrimary}>
        {primaryLabel}
      </button>
    </div>
  );
}

function Composer({
  value,
  onChange,
  onSubmit,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  label: string;
}) {
  return (
    <form
      className="onboarding__composer"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <label className="onboarding__composer-label">{label}</label>
      <div className="onboarding__composer-row">
        <textarea
          className="clive-chat__input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSubmit();
            }
          }}
          rows={2}
          placeholder="Write it in your own words…"
          aria-label={label}
        />
        <button type="submit" className="btn-primary" disabled={!value.trim()}>
          Send
        </button>
      </div>
    </form>
  );
}

function Conversation({
  route,
  questions,
  answers,
  currentQuestion,
  evidence,
}: {
  route: RouteId | null;
  questions: ReturnType<typeof activeQuestions>;
  answers: Record<string, string>;
  currentQuestion: ReturnType<typeof activeQuestions>[number] | undefined;
  evidence: ReturnType<typeof getOnboardingEvidence>;
}) {
  const answered = questions.filter((q) => answers[q.id]?.trim());
  return (
    <div className="onboarding__conversation">
      {answered.map((q, i) => (
        <div key={q.id}>
          <div className="onboarding__turn onboarding__turn--clive">
            <p className="onboarding__speaker">Clive</p>
            <StudyMarkdown content={q.question} />
          </div>
          <div className="onboarding__turn onboarding__turn--you">
            <p className="onboarding__speaker">You · turn {i + 1}</p>
            <p className="onboarding__answer">{answers[q.id]}</p>
          </div>
        </div>
      ))}
      {currentQuestion && (
        <div className="onboarding__turn onboarding__turn--clive">
          <p className="onboarding__speaker">Clive</p>
          <StudyMarkdown content={currentQuestion.question} />
        </div>
      )}
    </div>
  );
}

function EvidenceLinks({
  ids,
  evidence,
}: {
  ids: string[];
  evidence: ReturnType<typeof getOnboardingEvidence>;
}) {
  const items = evidence.evidence.filter((e) => ids.includes(e.id));
  if (!items.length) return null;
  return (
    <div className="onboarding__ev-links">
      {items.map((e) => (
        <span key={e.id} className="onboarding__ev-link">
          {e.locators[0]?.label}
          {e.provenance?.question ? ` · asked: “${e.provenance.question}”` : ""}
        </span>
      ))}
    </div>
  );
}
