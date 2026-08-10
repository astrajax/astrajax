"use client";

/**
 * Two-route onboarding — now consuming Ruth Hadley's frozen V1.0.0 contract.
 *
 * The UI reads the typed fixture from getOnboardingFixtureV1() (validated by
 * the semantic validator before it reaches here — Ruth's Kate/CI acceptance
 * step). ADAPTER SEAM: presentation components consume the contract's logical
 * shape only; no Airtable table or field IDs are baked in. Breaking contract
 * needs go BACK to Ruth as a versioned amendment — never a silent divergence.
 *
 * The two verb-led routes append append-only route sessions; evidence is a
 * discriminated union on evidenceClass; inferences are versioned;
 * confirmation events target exact inference ID + version and snapshot the
 * presented value; only accepted-for-Workshop items reach the draft.
 */
import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import { getOnboardingFixtureV1 } from "@/lib/onboarding/fixture-v1";
import {
  evidenceEdgesFor,
  type ConfirmationDecision,
  type Evidence,
  type ImportedEvidence,
  type Inference,
} from "@/lib/onboarding/contract-v1";
import {
  acceptAsDraft,
  allFilesUploaded,
  answerGap,
  answerProbe,
  backStep,
  canAcceptDraft,
  canSwitchRoute,
  chooseRoute,
  hasUploadingFiles,
  initialOnboardingState,
  nextStep,
  probeProgress,
  removeFile,
  setConfirmation,
  setCorrection,
  stageFile,
  stopProbingEarly,
  updateFileState,
  type OnboardingState,
  type RouteId,
  type SourcePackFile,
} from "@/lib/onboarding/machine";
import { SourcePackUploader } from "@/components/onboarding/SourcePackUploader";
import { StudyMarkdown } from "@/components/chapter1/StudyMarkdown";
import { FolioActionLedger } from "@/components/chapter1/FolioActionLedger";
import { SourcePackPlate } from "@/components/onboarding/plates/SourcePackPlate";
import { CorpusCensusPlate } from "@/components/onboarding/plates/CorpusCensusPlate";
import { ProvisionalConstellationPlate } from "@/components/onboarding/plates/ProvisionalConstellationPlate";
import { usePrefersReducedMotion } from "@/components/command-centre/usePortraitTransition";
import "./onboarding.css";

const ROUTE_LABELS: Record<RouteId, { verb: string; bestWhen: string }> = {
  "bring-material": { verb: "Bring your material", bestWhen: "Best when your documents already exist." },
  "talk-through": { verb: "Talk it through", bestWhen: "Best when it mostly lives in your head." },
};

function isImported(e: Evidence): e is ImportedEvidence {
  return e.evidenceClass === "imported_document";
}

export function OnboardingFlow() {
  const fixture = useMemo(() => getOnboardingFixtureV1(), []);
  const [state, setState] = useState<OnboardingState>(() => initialOnboardingState());
  const [draft, setDraft] = useState("");
  const reducedMotion = usePrefersReducedMotion();

  const choose = useCallback((route: RouteId) => setState((s) => chooseRoute(s, route)), []);
  const next = useCallback(() => setState((s) => nextStep(s)), []);
  const back = useCallback(() => setState((s) => backStep(s)), []);

  const progress = probeProgress(state, fixture.case.questionProgress.hardCap);

  // Route B's adaptive probing comes from the gap-question bank (each answer
  // becomes self_reported evidence with exact question + turn provenance).
  const probeQuestions = useMemo(
    () => [
      { id: "q1", question: "In plain words, what do you actually do day to day?" },
      { id: "q2", question: "What kind of organisation is that inside?" },
      { id: "q3", question: "Which parts of this work do you feel confident doing yourself, and where do you still want support?" },
      { id: "q4", question: "Who do you work closest with, week to week?" },
      { id: "q5", question: "What decisions land on your desk most often?" },
      { id: "q6", question: "Which of those should never be delegated?" },
    ],
    [],
  );
  const currentQuestion =
    state.route === "bring-material"
      ? probeQuestions[Object.keys(state.gapAnswers).length]
      : probeQuestions[state.probeIndex];

  const submitAnswer = () => {
    if (!currentQuestion || !draft.trim()) return;
    if (state.route === "bring-material") {
      setState((s) => answerGap(s, currentQuestion.id, draft.trim()));
    } else {
      setState((s) => answerProbe(s, currentQuestion.id, draft.trim()));
    }
    setDraft("");
  };

  // Ruth's four inferable output territories (attributeType): provisional_role,
  // sector, observed_collaborator, brain_theme (+ competency, self-reported only).
  const proposedInferences = fixture.inferences.filter((i) => i.status === "proposed");

  return (
    <div className="onboarding">
      {/* ── Opening choice ── */}
      {state.step === "choice" && (
        <section className="onboarding__choice" aria-labelledby="onb-choice-h">
          <p className="onboarding__eyebrow">Chapter 1 · begin</p>
          <h1 id="onb-choice-h" className="onboarding__h1">Two ways in. Same destination.</h1>
          <p className="onboarding__lede">
            Clive builds your Trusted Brain either way. Pick the route that fits how your
            material lives — switch any time before you confirm, and nothing you've said is lost.
          </p>
          <div className="onboarding__routes">
            {(Object.keys(ROUTE_LABELS) as RouteId[]).map((route, i) => (
              <button
                key={route}
                type="button"
                className="onboarding__route-card"
                onClick={() => choose(route)}
                aria-label={`${ROUTE_LABELS[route].verb}. ${ROUTE_LABELS[route].bestWhen}`}
              >
                <Image
                  className="onboarding__route-frame"
                  src={i === 0 ? "/brand/system-assets/folio/furniture/docket-frame-left.svg" : "/brand/system-assets/folio/furniture/docket-frame-right.svg"}
                  alt=""
                  width={553}
                  height={287}
                  aria-hidden
                  unoptimized
                />
                <span className="onboarding__route-verb">{ROUTE_LABELS[route].verb}</span>
                <span className="onboarding__route-best">{ROUTE_LABELS[route].bestWhen}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Route A: envelope ── */}
      {state.step === "a-envelope" && (
        <FlowShell step="Bring your material · first, the envelope" onBack={back}>
          <h2 className="onboarding__h2">Three small things before your files.</h2>
          {(["Identity", "Authority", "Privacy"] as const).map((t) => (
            <div key={t} className="onboarding__card onboarding__card--plate onboarding__plate-card">
              <p className="onboarding__field-label">{t}</p>
              <p className="onboarding__body">
                {t === "Identity"
                  ? "You, and only you — this brain is yours."
                  : t === "Authority"
                    ? "You approve what becomes trusted. Clive proposes; you decide."
                    : "Your material stays yours. Nothing here leaves this page or trains anything."}
              </p>
            </div>
          ))}
          <NavRow onPrimary={next} primaryLabel="To your Source Pack" />
        </FlowShell>
      )}

      {/* ── Route A: Source Pack manifest + upload/staging ── */}
      {state.step === "a-source-pack" && (
        <FlowShell step="Bring your material · the Source Pack" onBack={back}>
          <h2 className="onboarding__h2">Your Source Pack.</h2>
          <p className="onboarding__lede">
            Up to 5 files · 50 MB total · 20 MB each.
          </p>
          {/* Blank-plate grammar: live file labels on the Source Pack plate;
              the uploader is the interaction surface beneath. */}
          {state.files.length > 0 ? (
            <SourcePackPlate
              items={state.files.map((f) => ({
                id: f.id,
                evidenceClass: "imported_document" as const,
                label: f.name,
                provenance: f.state === "uploaded" ? "uploaded" : f.state === "uploading" ? "uploading…" : f.state === "failed" ? "failed" : f.extension || "file",
              }))}
              reducedMotion={reducedMotion}
            />
          ) : null}
          <SourcePackUploader
            state={state}
            onFileSelect={(file: SourcePackFile) => setState((s) => stageFile(s, file))}
            onFileUpdate={(fileId, update) => setState((s) => updateFileState(s, fileId, update))}
            onFileRemove={(fileId) => setState((s) => removeFile(s, fileId))}
          />
          <NavRow
            onPrimary={allFilesUploaded(state) && !hasUploadingFiles(state) ? next : undefined}
            primaryLabel={
              hasUploadingFiles(state)
                ? "Uploading…"
                : state.files.length === 0
                  ? "Add files to continue"
                  : state.files.some((f) => f.state === "failed")
                    ? "Fix failed uploads to continue"
                    : "See what Clive found"
            }
          />
        </FlowShell>
      )}

      {/* ── Route A: extraction + corpus census ── */}
      {state.step === "a-extraction" && (
        <FlowShell step="Bring your material · what Clive found" onBack={back}>
          <h2 className="onboarding__h2">Read deterministically, not guessed.</h2>
          <CorpusCensusPlate
            rows={fixture.evidence.map((e) => ({
              id: e.evidenceId,
              evidenceClass: e.evidenceClass,
              label: isImported(e) ? e.locator.label : "Your answer",
              trace: isImported(e) ? e.exactText.slice(0, 48) + "…" : `asked: “${e.questionText.slice(0, 40)}…”`,
              recency: "6 Aug 2026",
              tally: isImported(e) ? 1 : undefined,
            }))}
            gapReserve={{ label: "Open questions held in reserve", count: 2 }}
            totals={{
              documents: fixture.sourcePack.sources.length,
              words: Number(fixture.sourcePack.sources[0]?.profile.census.paragraphCount ?? 0) * 40 || 0,
            }}
            reducedMotion={reducedMotion}
          />
          <NavRow onPrimary={next} primaryLabel="Answer the gap questions" />
        </FlowShell>
      )}

      {/* ── Route A: gap questions ── */}
      {state.step === "a-gap-questions" && (
        <FlowShell step="Bring your material · the gaps only" onBack={back} chat>
          <h2 className="onboarding__h2">What your documents can't say.</h2>
          <Conversation questions={probeQuestions} answers={state.gapAnswers} currentQuestion={currentQuestion} />
          {currentQuestion ? (
            <Composer value={draft} onChange={setDraft} onSubmit={submitAnswer} label="Your answer" />
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
          <Conversation questions={probeQuestions} answers={state.probeAnswers} currentQuestion={currentQuestion} />
          {currentQuestion ? (
            <>
              <Composer value={draft} onChange={setDraft} onSubmit={submitAnswer} label="Your answer" />
              <button
                type="button"
                className="onboarding__link-btn"
                onClick={() => setState((s) => stopProbingEarly(s))}
                aria-label="Stop probing early and go to what you've captured"
              >
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
          {state.supportingFile && state.supportingFile.state === "uploaded" ? (
            <p className="onboarding__body">✓ {state.supportingFile.name} attached.</p>
          ) : (
            <SourcePackUploader
              state={{ ...state, files: state.supportingFile ? [state.supportingFile] : [] }}
              maxFiles={1}
              onFileSelect={(file: SourcePackFile) => setState((s) => ({ ...s, supportingFile: file }))}
              onFileUpdate={(_, update) =>
                setState((s) =>
                  s.supportingFile ? { ...s, supportingFile: { ...s.supportingFile, ...update } } : s,
                )
              }
              onFileRemove={() => setState((s) => ({ ...s, supportingFile: null }))}
            />
          )}
          <NavRow
            onPrimary={
              !state.supportingFile || state.supportingFile.state === "uploaded"
                ? next
                : state.supportingFile.state === "uploading"
                  ? undefined
                  : next
            }
            primaryLabel={
              state.supportingFile?.state === "uploading"
                ? "Uploading…"
                : "See what Clive has drafted"
            }
          />
        </FlowShell>
      )}

      {/* ── Convergence: versioned inferences + exact-version confirmation ── */}
      {state.step === "convergence" && (
        <FlowShell step="Confirm what's true · then it's a draft" onBack={back}>
          <h2 className="onboarding__h2">What Clive has provisionally drawn.</h2>
          <p className="onboarding__lede">Provisional only — nothing is trusted until you confirm it, item by item.</p>
          <ProvisionalConstellationPlate
            territories={["provisional_role", "sector", "brain_theme", "observed_collaborator"].map((attr) => {
              const inf = fixture.inferences.find((i) => i.attributeType === attr);
              return {
                key: attr === "brain_theme" ? ("themes" as const) : attr === "observed_collaborator" ? ("collaborators" as const) : attr === "provisional_role" ? ("role" as const) : ("sector" as const),
                label: attr === "provisional_role" ? "Your role" : attr === "sector" ? "Sector" : attr === "brain_theme" ? "Brain themes" : "Observed collaborators",
                provisional: inf?.value.display ?? "—",
                evidenceCount: inf?.evidence.length ?? 0,
                openQuestions: attr === "brain_theme" ? 1 : 0,
                accepted: state.confirmations[inf?.inferenceId ?? ""] === "confirm",
              };
            })}
            reducedMotion={reducedMotion}
          />
          <FolioActionLedger
            title="Clive's Actions"
            actions={[
              {
                id: "a1",
                label: "Mapped your material and your words into evidence.",
                status: "completed",
                statusText: "Completed · just now",
              },
              {
                id: "a2",
                label: "Drafted provisional inferences for your confirmation.",
                status: "completed",
                statusText: "Completed · just now",
              },
              {
                id: "a3",
                label: "Awaiting your decision on each item.",
                status: "in_progress",
                statusText: "In progress · waiting on you",
              },
            ]}
            footnote="I'll update you as each item settles."
          />
          <div className="onboarding__inference">
            {proposedInferences.map((inf) => (
              <div key={inf.inferenceId} className="onboarding__infer-card" data-correcting={state.confirmations[inf.inferenceId] === "correct" ? "true" : undefined}>
                <p className="onboarding__field-label">
                  {inf.attributeType.replace(/_/g, " ")} · v{inf.version}
                </p>
                <p className="onboarding__infer-value">{inf.value.display}</p>
                <EvidenceLinks inference={inf} fixture={fixture} />
                <p className="onboarding__hint">{inf.uncertainty}</p>
                <div className="onboarding__infer-actions" role="group" aria-label={`Confirm ${inf.attributeType}`}>
                  {(["confirm", "correct", "leave_open"] as ConfirmationDecision[]).map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      className={`onboarding__choice-btn${state.confirmations[inf.inferenceId] === choice ? " is-active" : ""}`}
                      aria-pressed={state.confirmations[inf.inferenceId] === choice}
                      onClick={() => setState((s) => setConfirmation(s, inf.inferenceId, choice))}
                    >
                      {choice === "confirm" ? "Confirm" : choice === "correct" ? "Correct" : "Leave open"}
                    </button>
                  ))}
                </div>
                {state.confirmations[inf.inferenceId] === "correct" && (
                  <input
                    className="onboarding__correction onboarding__correction--bracketed"
                    type="text"
                    placeholder="The corrected value"
                    aria-label={`Corrected value for ${inf.attributeType.replace(/_/g, " ")}`}
                    value={state.corrections[inf.inferenceId] ?? ""}
                    onChange={(e) => setState((s) => setCorrection(s, inf.inferenceId, e.target.value))}
                  />
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            className="btn-primary onboarding__accept onboarding__accept--plate"
            disabled={!canAcceptDraft(state, proposedInferences.map((i) => i.inferenceId))}
            onClick={() => setState((s) => acceptAsDraft(s))}
            aria-label="Accept confirmed items as a draft Trusted Brain"
          >
            Accept as draft
          </button>
          {!canAcceptDraft(state, proposedInferences.map((i) => i.inferenceId)) && (
            <p className="onboarding__hint">Decide on every item first — confirm, correct, or leave open.</p>
          )}
        </FlowShell>
      )}

      {/* ── Receipt: Clive handback ── */}
      {state.step === "receipt" && (
        <section className="onboarding__receipt">
          <p className="onboarding__eyebrow">Clive's handback</p>
          <h1 className="onboarding__h1">
            <Image
              className="onboarding__receipt-seal"
              src="/brand/system-assets/folio/furniture/medallion-accepted-sage.svg"
              alt=""
              width={48}
              height={48}
              aria-hidden
              unoptimized
            />
            A draft, on your word.
          </h1>
          <StudyMarkdown
            content={
              "Here's what I'm holding, provisionally:\n\n" +
              fixture.inferences
                .map((inf) => {
                  const c = state.confirmations[inf.inferenceId];
                  const mark = c === "confirm" ? "confirmed" : c === "correct" ? `corrected to “${state.corrections[inf.inferenceId]}”` : "left open";
                  return `- **${inf.attributeType.replace(/_/g, " ")}** — ${inf.value.display} (*${mark}*)`;
                })
                .join("\n") +
              "\n\nNothing here is trusted yet. It's a draft brain, built from what you brought and what you said — your evidence stays visible against every line."
            }
          />
          <div className="onboarding__evidence-all">
            {fixture.evidence.map((e) => (
              <div key={e.evidenceId} className="onboarding__ev-row">
                <span className={`onboarding__ev-class onboarding__ev-class--${e.evidenceClass}`}>
                  {isImported(e) ? "document" : "you said"}
                </span>
                <span className="onboarding__ev-title">
                  {isImported(e) ? e.locator.label : `“${e.responseText.slice(0, 32)}…”`}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {canSwitchRoute(state) && state.step !== "choice" && state.step !== "receipt" && (
        <p className="onboarding__switch">
          {state.route === "bring-material" ? (
            <>Rather talk it through? <button type="button" className="onboarding__link-btn" onClick={() => choose("talk-through")} aria-label="Switch to Talk it through — nothing is lost">Switch — nothing is lost</button></>
          ) : (
            <>Have documents after all? <button type="button" className="onboarding__link-btn" onClick={() => choose("bring-material")} aria-label="Switch to Bring your material — nothing is lost">Switch — nothing is lost</button></>
          )}
        </p>
      )}
    </div>
  );
}

// ── building blocks ──────────────────────────────────────────────────────────

function FlowShell({ step, children, onBack, chat = false }: { step: string; children: React.ReactNode; onBack: () => void; chat?: boolean }) {
  return (
    <section className={`onboarding__flow${chat ? " onboarding__flow--chat" : ""}`} aria-label={step}>
      <p className="onboarding__eyebrow">{step}</p>
      {children}
      <button
        type="button"
        className="study-stage__ghost-btn onboarding__back"
        onClick={onBack}
        aria-label="Go back one step"
      >
        Back
      </button>
    </section>
  );
}

function NavRow({ onPrimary, primaryLabel }: { onPrimary?: () => void; primaryLabel: string }) {
  return (
    <div className="onboarding__nav">
      <button
        type="button"
        className="btn-primary"
        onClick={onPrimary}
        disabled={!onPrimary}
        aria-label={primaryLabel}
      >
        {primaryLabel}
      </button>
    </div>
  );
}

function Composer({ value, onChange, onSubmit, label }: { value: string; onChange: (v: string) => void; onSubmit: () => void; label: string }) {
  return (
    <form className="onboarding__composer" onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      <label className="onboarding__composer-label">{label}</label>
      <div className="onboarding__composer-row">
        <textarea
          className="clive-chat__input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSubmit(); } }}
          rows={2}
          placeholder="Write it in your own words…"
          aria-label={label}
        />
        <button type="submit" className="btn-primary onboarding__send--plate" disabled={!value.trim()}>Send</button>
      </div>
    </form>
  );
}

function Conversation({
  questions,
  answers,
  currentQuestion,
}: {
  questions: { id: string; question: string }[];
  answers: Record<string, string>;
  currentQuestion: { id: string; question: string } | undefined;
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

function EvidenceLinks({ inference, fixture }: { inference: Inference; fixture: ReturnType<typeof getOnboardingFixtureV1> }) {
  // ADAPTER: read support-role edges via evidenceEdgesFor — V1.1.0 made the
  // edge required, so this returns inference.evidence directly. The helper is
  // the single read point (adapter seam); roles are Direct/Corroborating/
  // Contradicting, and the tag shows only for non-Direct edges.
  const edges = evidenceEdgesFor(inference);
  const items = fixture.evidence.filter((e) => edges.some((edge) => edge.evidenceId === e.evidenceId));
  if (!items.length) return null;
  return (
    <div className="onboarding__ev-links">
      {edges.map((edge) => {
        const e = items.find((x) => x.evidenceId === edge.evidenceId);
        if (!e) return null;
        return (
          <span key={edge.evidenceId} className="onboarding__ev-link" data-support-role={edge.supportRole !== "Direct" ? edge.supportRole : undefined}>
            {isImported(e) ? e.locator.label : `asked: “${e.questionText.slice(0, 30)}…”`}
            {edge.supportRole !== "Direct" ? (
              <span className={`onboarding__ev-role onboarding__ev-role--${edge.supportRole.toLowerCase()}`}> · {edge.supportRole}</span>
            ) : null}
          </span>
        );
      })}
    </div>
  );
}
