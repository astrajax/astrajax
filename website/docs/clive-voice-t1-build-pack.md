# Clive Voice T1 — Build Pack v0.1 ("He Speaks")

**Status:** Proposed — this document's PR is the review surface; Matthew's merge locks it.
**Owner:** Kate (scenic workshop). **Approver:** Matthew. **Visual/voice finish authority:** Kathryn / Tara-Lee.
**Evidence base:** `main` @ `b754047`, scout-verified 7 Jul 2026 (direct reads: `CliveChatSurface.tsx` @ `fcc464f`, `api/ask-clive/route.ts` @ `c7e52d3`, `lib/clive/prompt.ts` @ `5c6f19b`, `GlobalCliveLauncher.tsx` @ `9ed3ad6`, `AskClivePanel.tsx` @ `760e5e5`, `.env.example` @ `05749a9`).
**Origin thread:** `cmra4ubsh03m607adg3bwh0bz`.

## Purpose

Locked decisions for Tier 1 of talk-to-Clive: **Clive speaks his answers aloud** in the two public chat mounts, in a spoken register, with the portrait's lamplight breathing to his voice. One build PR cites this pack instead of re-litigating provider, placement, or scope. Drift control, not ceremony.

This pack also pilots the **worker-lane economy**: low-reasoning lanes carry verbatim specs so they can run on the cheapest models; orchestration, register, and final assembly stay with Kate.

## Scope

- Voice **output** only (T1). Opt-in, off by default, feature-flagged.
- Mounts: **Ask Clive panel** (homepage) and **GlobalCliveLauncher** (site-wide). Both are default-mode `CliveChatSurface` mounts calling `/api/ask-clive` — the spoken flag rides cleanly.
- A **spoken register** for voiced replies (shorter, ear-shaped), which also caps TTS cost.

**Out of scope:** T2 mic input (next pack revision after T1 field test); T3 duplex conversation; `studyMode` / Chapter 1 loop surfaces (they use `onCustomSend` and bypass ask-clive — voice there is its own workstream with the full painted-stage theatre, W2 below); voice **casting** (separate track — T1 ships a labelled placeholder voice); any new painted art.

## Ground truth (scout-verified, 7 Jul 2026)

- `CliveChatSurface` is the shared organ (W1-hardened 6 Jul). Reply completion has a clean seam: `onAssistantMessage?.(reply)` fires once per completed turn; streaming text is separate state. The fetch body to `/api/ask-clive` is built inside `requestReply` — a `spoken` field slots in beside `persona`/`beat`.
- `/api/ask-clive` streams via `streamText` (`@ai-sdk/anthropic`, `claude-sonnet-4-6`, `maxOutputTokens: 400`), with a seeded fallback stream and interaction logging. `buildSystemPrompt(blocks, { persona, loopContext })` in `lib/clive/prompt.ts` is the register seam.
- Both target mounts render Clive's 36/40px portrait (`/agent-cast/clive-wigglesworth.png`) — the glow target exists in both without new art.
- The SR status node announces each completed reply (W1). With voice on, a screen-reader user hears both announcement and audio. Accepted for v1: voice is an explicit opt-in gesture. Noted, not solved.
- `.env.example` groups vars by feature with comments; the Court precedent (`COURT_MODEL=claude-haiku-…`) establishes env-driven cheap-model choice.
- **No new npm dependency is needed**: the TTS call is a plain `fetch` to the provider REST API.
- W1's `aria-live` fix is fresh — **no lane may touch the announcement logic** (drift hazard).

## Locked decisions

- **D1 — Provider-agnostic route.** New `POST /api/clive-voice` → `audio/mpeg`. v1 adapter: **OpenAI `gpt-4o-mini-tts`** ($15/M chars ≈ 1–2¢ per spoken answer), voice **`fable`** (the British-leaning preset) steered by an instructions string. ElevenLabs is the expected *casting* destination later — the route contract isolates the swap to one file. Plain fetch, no SDK.
- **D2 — Voice lives in the surface.** `CliveChatSurface` gains a `voice?: boolean` prop. The surface owns the toggle, playback, and analysis; it emits `--clive-speech-level` (0–1) and `data-clive-speaking` on its `.clive-chat` root. Mounts style their own glow — mechanism in the organ, look in the room.
- **D3 — Gesture-honest playback.** Off by default; the toggle click is the unlocking gesture (primes the shared `HTMLAudioElement` for iOS). Preference persisted (`localStorage: astrajax-clive-voice`). No autoplay, ever.
- **D4 — Spoken register rides the same request.** When voice is on, the body carries `spoken: true`; `buildSystemPrompt` appends the SPOKEN REGISTER block (verbatim in Lane B); `maxOutputTokens` drops 400 → 220. The full text still renders — **the transcript is the caption.**
- **D5 — Whole-answer TTS.** One TTS call after the stream completes. Sentence-chunked streaming TTS is a stretch goal, explicitly out of v1.
- **D6 — Graceful failure.** TTS error → quiet in-surface note ("His voice is resting — words on the page, as ever."), text flow untouched, no retry loop.
- **D7 — Feature flag as kill switch.** Toggle renders only when `NEXT_PUBLIC_CLIVE_VOICE=1`; the route 503s without `OPENAI_API_KEY`. Unset either → the feature does not exist.
- **D8 — Placeholder voice is labelled.** Toggle tooltip/title names it a temporary voice pending casting. No pretence.

## Lanes — one build PR, worker-economised

| Lane | Work | Runner | Why this runner |
|---|---|---|---|
| A | `/api/clive-voice` route + `.env.example` section | **Worker (haiku)** | Verbatim contract below; formulaic proxy |
| B | `spoken` plumbing: `types.ts`, ask-clive route, `prompt.ts` clause | **Worker (haiku)** | Three-file mechanical diff; clause text supplied verbatim |
| C | `use-clive-voice.ts` hook (playback + AnalyserNode + CSS var) | **Worker (sonnet)** | Real care: Safari single-source rule, gesture unlock, cleanup |
| D | Surface integration, mount wiring, glow CSS, toggle UI + copy | **Kate** | Register, craft, and the freshly-fixed a11y surface |
| E | Review every worker line, assemble, commit, PR narrative | **Kate** | Accountability — workers never commit |

Worker rules: workers produce file contents in the sandbox from the specs below; Kate reviews line-by-line before anything is committed; no worker touches `aria-live` logic or invents props; any spec ambiguity halts the lane rather than improvising.

### Lane A spec (verbatim contract)

`website/src/app/api/clive-voice/route.ts` — `runtime = "nodejs"`, `dynamic = "force-dynamic"`.
`POST { text: string, persona?: "clive" }` → validate: non-empty, ≤ 2,000 chars, else 400. Missing `OPENAI_API_KEY` → 503 `{ error: "Voice is resting." }`. Call `https://api.openai.com/v1/audio/speech` with `{ model: env.CLIVE_TTS_MODEL ?? "gpt-4o-mini-tts", voice: env.CLIVE_TTS_VOICE ?? "fable", input: text, instructions: env.CLIVE_TTS_INSTRUCTIONS ?? DEFAULT_INSTRUCTIONS }`. Non-OK upstream → 502 with the same resting-voice envelope (detail to console only). OK → pass through bytes, `Content-Type: audio/mpeg`, `Cache-Control: no-store`.
`DEFAULT_INSTRUCTIONS`: *"Warm, wistful Victorian gentleman; unhurried; gentle RP; a private reading voice by lamplight; slightly hopeful, as if glad of the company."*
`.env.example` addition under a `# Clive voice (T1 — see website/docs/clive-voice-t1-build-pack.md)` header: `OPENAI_API_KEY=`, `CLIVE_TTS_MODEL=gpt-4o-mini-tts`, `CLIVE_TTS_VOICE=fable`, `NEXT_PUBLIC_CLIVE_VOICE=`.

### Lane B spec (verbatim contract)

1. `lib/clive/types.ts`: add optional `spoken?: boolean` to `AskCliveRequest`.
2. `api/ask-clive/route.ts`: `const spoken = body.spoken === true;` → pass `spoken` into `buildSystemPrompt` options; `maxOutputTokens: spoken ? 220 : 400`.
3. `lib/clive/prompt.ts`: options gain `spoken?: boolean`; when true, append after the loop section:

```
════════════════════════════════════════
SPOKEN REGISTER (the visitor is listening, not reading)
════════════════════════════════════════
Answer as Clive speaks, not as he writes:
- Two or three sentences, then stop. If there is truly more, close by offering it ("Shall I go on?").
- No lists, no headings, no bullet points — spoken words only.
- Plain warm sentences; contractions welcome; the needy Victorian warmth stays.
- Never mention this register or that your words are being read aloud.
```

### Lane C spec (contract)

`website/src/lib/clive/use-clive-voice.ts` — client hook. API: `useCliveVoice({ enabled, targetRef, onVoiceError }) → { speak(text), stop(), speaking, prime() }`.
Requirements: one shared `HTMLAudioElement`, created lazily; `prime()` is called from the toggle's click handler (gesture unlock: muted play/pause round-trip, plus `AudioContext.resume()`); `createMediaElementSource` **once per element, ever** (Safari) — guard with a ref; graph `source → analyser → destination`; rAF loop writes smoothed RMS to `--clive-speech-level` and toggles `data-clive-speaking` on `targetRef.current`; `speak(text)` fetches the route, plays from a blob object-URL, revokes the previous URL; full cleanup on unmount; every failure path calls `onVoiceError` and resolves silently (never throws into the surface).

## Sequencing

1. **This pack PR** — Matthew's merge locks it.
2. **Build PR** (`kate/clive-voice-t1`): lanes A–C run as parallel workers, D–E Kate; one PR, one concern.
3. **Field-fix PR** (expected, small): whatever Matthew's phone finds — the iOS Safari residue.

## Acceptance (build PR DoD)

- Flag off / key unset → site byte-identical in behaviour; no toggle, no route effects.
- Flag on: toggle appears in panel + launcher, default off, labelled as placeholder voice.
- Toggle on → replies arrive in spoken register (short, no lists), audio plays after stream completes, avatar lamplight breathes with amplitude, transcript renders in full.
- iOS Safari: audio plays when toggled on in the same session (gesture-primed).
- `prefers-reduced-motion`: no pulsing glow (static speaking indicator acceptable); audio unaffected.
- TTS failure: resting-voice note, chat unharmed, retry untouched.
- Curate/studyMode mounts: zero behavioural change (`voice` prop unset).

## Cost

- **Run-time:** ~1–2¢ per spoken answer (220-token replies ≈ ~900 chars at $15/M chars). No per-minute meter anywhere in T1. Kill switch is D7.
- **Build-time:** lanes A/B on the cheapest worker models, C on the mid tier; Kate-time concentrates in D/E. Matthew-time: merge twice, add two env vars in Vercel, listen on the phone.

## Open calls (Matthew arbitrates; Kathryn/TL finish)

1. **Voice casting** — professional clone (Matthew's own read is on the table) vs designed voice; lands at the provider the casting chooses; D1 isolates the swap. Separate track, does not gate T1.
2. **Glow finish** — intensity, colour temperature (Burnt Apricot warmth suggested), reduced-motion static treatment.
3. **Toggle affordance skin** — v1 ships an honest labelled control; a painted affordance (bell-pull, brass horn) is a later Kathryn call.
4. **W2 horizon** — voice in the study/Chapter 1 surfaces (the full portrait stage; interacts with the Welcome-beat canon) + T2 mic input: pack revision v0.2 after T1 field test.

## Governance

Green/Amber presentation-layer change on `kate/*` branches; feature-flagged dark until Matthew sets env vars; Matthew's merge is the gate. One conscious-gating item, named per house rule: **T1 introduces a new external dependency (an OpenAI API key for TTS)** — the key is added by Matthew in Vercel, never committed. No canon, no schedules, no credentials in repo. Per the Autonomy & Gating Policy, structure bounds the risk — no extra review loops manufactured.
