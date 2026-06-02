> **Working draft — not canonical context.** Stored here until Publisher exists or Matthew approves it as a Context Item.

# AstraJax Journey Video Edit Guide

**Date:** 31 May 2026  
**Primary source:** `/Users/matthewhopkinson/Downloads/Butternut Box： Building an AI-Powered Sales Operation from the Ground Up.txt`  
**Reference page:** [AstraJax — The Journey, Timeline v2](https://hyperagent.com/s/2Z8JUkO98EmUG_OxucBUWA)  
**Reference script:** `docs/context/matthew-talk-track-v3.md`

## Video Source Map

There are two different kinds of source in this guide:

1. **The main talk video** — this gives the spoken story and all timestamps like `00:13-01:02`.
2. **The screen-recording demos** — these give the product visuals underneath the story.

### Main Talk Video

All timestamps in this guide that look like `00:13-01:02`, `08:47-09:12`, `31:56-33:07`, etc. come from this one talk transcript:

| Source | Detail |
|---|---|
| Transcript file | `/Users/matthewhopkinson/Downloads/Butternut Box： Building an AI-Powered Sales Operation from the Ground Up.txt` |
| **Video file (use for all timestamps)** | `/Users/matthewhopkinson/Downloads/Butternut Box： Building an AI-Powered Sales Operation from the Ground Up.mp4` (~36m) |
| Likely video title | **Butternut Box: Building an AI-Powered Sales Operation from the Ground Up** |
| Airtable match | `Townhall Section — Matthew Hopkinson` (`recXGFfrATVoHcSIm`) |
| Short town-hall excerpt only (~4m41s) | `/Users/matthewhopkinson/Library/CloudStorage/GoogleDrive-matt@butternutbox.com/My Drive/Townhall Section MH.mp4` — **do not** use for guide timestamps |
| Trimmed exports (repo) | `website/public/video/journey-clips/` — run `python3 website/scripts/trim-journey-clips.py` to regenerate |
| Use for | Hero, intro, problem, boring layer, demo voiceover, agent explanations, final lesson |

**Important:** the Airtable record previously had the wrong transcript attachment: `airtable-hyperagent-communications-summary.md`. The usable transcript is the local Downloads file above.

### Screen-Recording Demo Videos

These are the supporting visuals referenced in the guide.

| Timeline use | Airtable video record | Record ID | Use for |
|---|---|---:|---|
| Event interface gaps | `ABS: Ops Dashboard Tooltips` | `rec5Cp2ESrQUpgi3o` | Missing data, alerts, role-specific gaps |
| Event email / AI first pass | `ABS: Ops Parsing Data From Emails` | `rec1vSIiHZK17BjXb` | Organiser email, suggested updates |
| Staffing drag-and-drop | `ASS: S01 Staff Five Open Shifts` | `reckJannDtVIteY7n` | Staffing dashboard, assignment flow |
| Staffing lock / confetti / email | `ASS: S06 Communicating Shifts To Salespeople` | `recu5QCMa16oS7AwG` | Lock shifts, schedule email, surprise moment |
| Forecasting QA | `ABS: Forecast Qa Flow` | `recluCrOg3VImJYXV` | Categories, reps vs BAs, forecast QA |
| Forecasting visual export | `Forecasting` | `recLoRQaRuCsGbqpU` | Short Act 3 forecasting B-roll |
| Clive in Airtable | `ABS: Ops Clive In Airtable` | `recX42vecFp6iCXek` | Clive in custom interface |
| Reggie primary | `Our Guy Reggie` | `rec2cLoT6WOrMlItD` | Bonus agent flow, if button UI is visible |
| Reggie fallback | `My Guy Reggie` | `rec59uzZq7VJ6T5dY` | Shorter Reggie export |
| Trinity primary | `Trinity in Action` | `reco6ZOGVtsY5cCuG` | Full Trinity workflow if approve step is visible |
| Trinity fallback | `ABS: Ops Parsing Data From Emails` | `rec1vSIiHZK17BjXb` | Link/suggest part of the Trinity |
| Before-state B-roll | `Operations System — Before` | `recoUM4TiBNiRbIGn` | Old ops system / problem context |
| Staffing before B-roll | `Staffing — Prior State` | `recXjrnqaYVQzmWJn` | Manual staffing before-state |
| External polish / backup hero | `Airspace LA — Butternut Airtable Interview` | `rec1jWGfa6X2iD7c0` | Short external-facing founder proof |

If a section below only gives a timestamp and does not name a separate screen recording, assume it comes from the **main talk video**.

## 1. What This Document Is For

This is the practical edit guide for turning the Journey page from a static timeline into a guided founder story.

The main decision is:

> Use the full Butternut talk as the story spine. Use the product demos as visual proof underneath it.

The shorter Airspace interview is still useful, but it should not be the main narrative source. It is polished and external-facing, but it only gives a small slice of the story. The Butternut talk gives the full arc:

- no-code commercial founder proof
- messy operational scale
- the boring data layer
- the product interfaces
- the agent layer
- the adoption lesson

That is the AstraJax story.

## 2. Overall Editing Principle

The Journey page should feel like Matthew is walking someone through the build, not like a product feature gallery.

The screen recordings are not the story by themselves. They are evidence.

The voice story should do the heavy lifting:

1. Why Matthew has authority to talk about this, despite not being technical.
2. Why the old operating layer broke.
3. Why clean data came before agents.
4. What the operating system made possible.
5. Why the agents worked because they were narrow, trusted, and human-approved.
6. What teams should learn from it.

The visual edits should support that journey, not fight it.

## 3. Best Hero Structure

The current Hyperagent timeline has:

> **Video · Hero** — Matthew, in 90 seconds

Use the Butternut talk as the primary source for this. It is better than the Airspace interview for the full hero because it explains the story, not just the personality.

### Recommended 90-Second Hero Montage

| Order | Timestamp | Clip | Purpose |
|---:|---|---|---|
| 1 | `00:13-00:28` | “What gives me the authority... You shouldn’t be.” | Opens with the anti-authority hook. |
| 2 | `00:31-00:59` | No computer science, never written operational code, actor/RADA/West End. | Makes the non-technical founder proof explicit. |
| 3 | `01:46-02:10` | “No code and no clue... deep domain context... powerful tools on top of clean data.” | States the AstraJax thesis. |
| 4 | `07:01-07:21` | “Brilliant people doing high-value work with low-leverage tools.” | Defines the problem. |
| 5 | `08:47-09:12` | “The boring layer made everything possible... Gmail, WhatsApp, Notion and Google Sheets to an operating system.” | Sets up the whole page. |

This can be cut as one 75-90 second piece, or split across the top of the page:

- Intro 1: authority hook
- Intro 2: no code / domain context
- Hero: from messy tools to operating system

### Alternative Short Hero

If the page needs a shorter hero, use:

| Timestamp | Clip |
|---|---|
| `00:13-01:02` | Full authority / no-code opener |

This is the most self-contained early clip.

## 4. Timeline Edits And Adds

The Hyperagent page already has a strong timeline. The main change is that some nodes should become voice-led, and some should gain an extra short supporting clip.

### Intro · 1 — The Hook

**Current role:** “Why I have the authority to talk to you about AI and systems.”

**Use:**

| Timestamp | Clip |
|---|---|
| `00:13-00:28` | “What gives me the authority... You shouldn’t be.” |

**Edit note:**  
Keep this funny and disarming. This should not sound like a corporate keynote. It should sound like: “I probably shouldn’t be the person saying this, which is exactly why this matters.”

### Intro · 2 — I Don’t...

**Current role:** “No code. Just domain context — and clean data.”

**Use:**

| Timestamp | Clip |
|---|---|
| `00:31-00:59` | No computer science, never written operational code, 6x7, actor/RADA/West End. |
| `01:46-02:10` | “No code and no clue... deep domain context... clean data.” |

**Add:**  
Use `01:46-02:10` as the stronger thesis clip if only one can be shown. It is cleaner and less joke-heavy than the early opener.

### Context — Built Without AI

**Current role:** Employee #33, channel scaled, tools did not keep up.

**Use:**

| Timestamp | Clip |
|---|---|
| `03:04-03:46` | Employee #33, hired to build face-to-face sales, “I can deliver that.” |
| `04:28-05:05` | Startup scale, 1,500 employees, 120 salespeople, £8m spend, tools did not keep up. |

**Edit note:**  
This is useful, but it may not need video if the page already has the numbers. Use a short cut only if the viewer needs more founder context before the problem section.

### The Problem — Brilliant People, Low-Leverage Tools

**Current role:** Sheets, Notion, WhatsApp, Gmail, manual everything.

**Use:**

| Timestamp | Clip |
|---|---|
| `06:15-06:24` | Google Sheets, Notion, WhatsApp, Gmail; none of them talked to each other. |
| `06:28-06:57` | Cracks showing: team progression slowing, burnout risk, job satisfaction tanking. |
| `07:01-07:21` | “Brilliant people doing high-value work with low-leverage tools.” |

**Best single clip:** `07:01-07:21`.

**Add:**  
Put this quote directly on the page as text. It is the clearest line in the whole problem section.

### The 10M Cell Trigger

**Current role:** Manual systems hitting hard limits.

**Use:**

| Timestamp | Clip |
|---|---|
| `07:51-08:14` | Google Sheets 10 million cell warning as its own problem statement. |

**Add:**  
This could be a small timeline beat between “The problem” and “The boring layer.” It is a memorable hinge moment.

Suggested label:

> Google Sheets gave the problem statement back.

## 5. Act I — The Boring Layer

### Act I Intro — Twelve Months Of Foundation

**Current role:** The boring layer, clean centralised data.

**Use:**

| Timestamp | Clip |
|---|---|
| `08:23-08:57` | 12 months cleaning and centralising data; boring, but made agents possible. |
| `08:47-09:12` | Agents, custom interfaces, AI workflows came later; Gmail/WhatsApp/Notion/Sheets to operating system. |

**Best single clip:** `08:47-09:12`.

**Edit note:**  
This should be the spine of Act I. The page needs the viewer to understand that the “boring layer” is not a side quest. It is the mechanism.

### Demo 01 — Event Interface

**Timeline role:** The system does the first pass.

#### Before Clip

| Timestamp | Clip |
|---|---|
| `09:33-10:37` | Rows as activations; messy event detail; sheet contains information but does not create intelligence. |
| `10:48-11:09` | Notion, PDFs, event packs, 60 WhatsApp groups per week. |

**Best single before cut:** `10:20-10:37`.

This says the key thing:

> The sheet technically contains information, but it doesn’t really create intelligence.

#### After Clip

| Timestamp | Clip |
|---|---|
| `11:13-11:53` | Role-specific interface; detects user; only shows what they need; more visibility is not always better. |
| `11:59-12:37` | Data comes through AI; system does first pass; human confirms or declines. |

**Best single after cut:** `11:13-11:31` for the interface, or `12:16-12:37` for the AI/human judgement point.

#### Product Demo Pairing

Use these screen recordings under the voiceover:

| Purpose | Video Record | Suggested Trim |
|---|---|---|
| Missing data / prioritised gaps | `ABS: Ops Dashboard Tooltips` | `00:48-01:03` |
| AI suggested updates from organiser email | `ABS: Ops Parsing Data From Emails` | `00:29-00:44` |

**Add:**  
Demo 01 probably wants two visual cuts:

1. Role-specific interface and missing gaps.
2. AI first-pass data extraction.

Do not force one clip to do both jobs.

### Demo 02 — Staffing

**Timeline role:** Blank grid to structured recommendation.

#### Before Clip

| Timestamp | Clip |
|---|---|
| `12:41-13:47` | Manual staffing: availability, training, burnout risk, driving, spreadsheet assignment, screenshots, car breakdowns. |

**Best single before cut:** `12:43-13:09`.

#### After Clip

| Timestamp | Clip |
|---|---|
| `13:52-15:10` | One dashboard; availability; annual leave; travel; drag-and-drop; auto-populate; burnout flag; manager still owns judgement. |

**Best single after cut:** `14:15-14:42`.

This is the cleanest product proof: drag-and-drop, travel role, per-mile rate, auto-populate, performance, availability.

#### Button / Surprise Moment

| Timestamp | Clip |
|---|---|
| `15:15-16:03` | Lock shifts, send schedules, surprise-and-delight, not removing managers, removing sludge. |

**Best single cut:** `15:49-16:03`.

This is the line to keep:

> We’re just removing the sludge that exists around them.

#### Product Demo Pairing

Use these screen recordings under the voiceover:

| Purpose | Video Record | Suggested Trim |
|---|---|---|
| Drag-and-drop assignment | `ASS: S01 Staff Five Open Shifts` | around `02:00-02:15` |
| Lock schedule / confetti / emails | `ASS: S06 Communicating Shifts To Salespeople` | around `00:14-00:29` |

**Add:**  
Demo 02 should become a mini sequence:

1. Before: manual staffing / screenshot.
2. After: dashboard / drag-and-drop.
3. Button: lock and communicate shifts.

### Demo 03 — Forecasting

**Timeline role:** Gut-feel to defensible decision.

#### Forecasting Engine

| Timestamp | Clip |
|---|---|
| `16:11-16:47` | Forecasting variance down 15%; forecasting was fragile; old process worked when small but not at scale. |
| `17:05-17:46` | Engine analyses 40,000 shift records, previous performance, weather, event type, team strength, capacity. |

**Best single engine cut:** `17:05-17:36`.

#### Event Categorisation

| Timestamp | Clip |
|---|---|
| `17:53-18:24` | LLM-supported event categories; dog show is not garden centre; data structure must reflect reality. |

**Best single category cut:** `17:53-18:24`.

#### Labour Model Proof

| Timestamp | Clip |
|---|---|
| `18:32-19:33` | Employed vs self-employed performance; stronger in the right conditions; business case for 57 new employed salespeople. |

**Best single commercial proof cut:** `18:49-19:33`.

#### Product Demo Pairing

Use these screen recordings under the voiceover:

| Purpose | Video Record | Suggested Trim |
|---|---|---|
| Category and reps vs BAs | `ABS: Forecast Qa Flow` | `00:22-00:37` |
| Forecasting visual B-roll | `Forecasting` export | `00:00-00:15` |

**Add:**  
Demo 03 should lean into the commercial strategy outcome, not just the forecasting UI. The labour-model clip is what proves this was more than admin automation.

### Outcomes

**Timeline role:** What the foundation unlocked.

Use:

| Timestamp | Clip |
|---|---|
| `20:21-20:37` | £180k per year travel saving through better planning and Google APIs. |
| `21:15-21:24` | 3,000 hours saved per year at UK/I scale. |
| `21:28-21:58` | 12 months foundation, then first agent fleet in two weeks, custom interfaces two weeks after that. |

**Best single outcome cut:** `21:28-21:58`.

This directly supports the timeline claim:

> The boring layer makes the exciting layer possible.

## 6. Act II — The Agent Layer

### Agent Layer Intro

**Timeline role:** Bounded agents, two weeks to first fleet.

Use:

| Timestamp | Clip |
|---|---|
| `21:28-22:05` | Foundation existed, agents moved fast, messy data becomes confident chaos. |
| `22:18-22:59` | Clean data, team understood AI, workflows for specific jobs, no magical general assistant. |

**Best single cut:** `22:33-22:59`.

This is the agent design principle:

> Targeted agents, super narrow scopes, clear context, personality profiles.

### Agent Fleet / Personality

Use:

| Timestamp | Clip |
|---|---|
| `22:59-23:50` | Agent fleet, moments of lightness, specific roles, specific bases, less hallucination. |
| `24:18-25:12` | Personality profiles, agent office politics, trust and use. |

**Best single cut:** `23:40-24:05`.

This gives:

> The more specific the job, the lower the chance of hallucination.

### Demo 04 — Clive

**Timeline role:** The in-system guide.

#### Clive Personality

Use:

| Timestamp | Clip |
|---|---|
| `25:23-26:03` | Clive modelled after Ajax; Victorian gentleman; solution to Matthew becoming the interface. |
| `26:26-27:39` | Functionality mattered, but personality drove adoption; team jokes; flirting incident; office politics. |

**Best adoption cut:** `26:36-27:04`.

This is one of the strongest human adoption moments in the whole talk.

#### Clive Product Explanation

Use:

| Timestamp | Clip |
|---|---|
| `27:51-28:52` | Clive in Airtable native AI; context table; lookups; budget gaps; bug checks. |

**Best product cut:** `28:24-28:52`.

#### Product Demo Pairing

Use:

| Purpose | Video Record | Suggested Trim |
|---|---|---|
| Clive in interface | `ABS: Ops Clive In Airtable` | `00:09-00:24` |
| Clive reasoning / anomaly follow-up | `ABS: Ops Clive In Airtable` | `00:52-01:10` |

### Demo 05 — Reggie

**Timeline role:** Bonus admin, gone.

Use:

| Timestamp | Clip |
|---|---|
| `29:06-29:36` | Reggie looks after bonuses and payroll; fun bonus rules are hard to track. |
| `29:51-30:11` | Historical process: timestamps, Slack messages, region rules, shift records, eligibility. |
| `30:11-30:41` | Reggie button, bonus guidance, “Give Reggie a call,” allocates bonuses. |
| `30:48-31:04` | Not AI replacing manager; removes spreadsheet detective work. |

**Best single Reggie cut:** `30:11-30:41`.

**Best strategic Reggie cut:** `30:48-31:04`.

#### Product Demo Pairing

Use:

| Purpose | Video Record | Suggested Trim |
|---|---|---|
| Reggie bonus flow | `Our Guy Reggie` | review visually; likely `00:00-00:15` |
| Fallback Reggie export | `My Guy Reggie` | full 44s or first 15s |

**Important:**  
Neither Reggie screen recording had transcript text in Airtable. Watch the MP4 once before locking the cut.

### Demo 06 — The Trinity

**Timeline role:** Bounded agents, human approval.

Use:

| Timestamp | Clip |
|---|---|
| `31:15-31:49` | Trinity introduced; organiser emails are the heaviest operational lifting. |
| `31:56-32:15` | Gmail becomes a record; structured data; Brother Tashi links email to activation. |
| `32:17-32:45` | Fuzzy matching; Marlowe looks for actionable changes. |
| `32:45-33:07` | Human approves in Slack; Marcel applies change and writes audit trail. |

**Best single Trinity cut:** `31:56-33:07`.

If you need a 15-20 second version:

| Timestamp | Clip |
|---|---|
| `32:31-33:07` | Marlowe proposes, human approves, Marcel executes with audit trail. |

#### Product Demo Pairing

Use:

| Purpose | Video Record | Suggested Trim |
|---|---|---|
| Full Trinity if approve step visible | `Trinity in Action` | review visually; likely first 15-40s |
| Fallback link/suggest demo | `ABS: Ops Parsing Data From Emails` | `00:01-00:16` |

**Important:**  
`ABS: Ops Parsing Data From Emails` proves link/suggest, but it does not prove the full Trinity unless the approve/execute step is visible. `Trinity in Action` is likely the better visual if it shows the approval loop.

## 7. Act III — The Lesson

### Arms And Legs / Compounding

Use:

| Timestamp | Clip |
|---|---|
| `33:11-33:58` | Twelve months boring layer; agent layer; “arms and legs”; clean data grows into systems, systems grow into agents, agents grow into workflows. |

**Best single cut:** `33:42-33:58`.

This is a strong bridge from proof into lesson.

### Trust

Use:

| Timestamp | Clip |
|---|---|
| `34:17-34:54` | Trust has to be designed; clear outputs, expectations, audit trails, narrow jobs, weirdness. |

**Best single cut:** `34:26-34:54`.

### Training

Use:

| Timestamp | Clip |
|---|---|
| `34:58-35:12` | If people do not know how to use a system, they do not experience value; prompt fluency matters. |

### Value

Use:

| Timestamp | Clip |
|---|---|
| `35:19-35:35` | People need the system to make them better, not just faster; event coordinator value. |

### Safety

Use:

| Timestamp | Clip |
|---|---|
| `35:38-36:09` | Manual tasks disappear; people need to know where their value moves. |

### Final Line

Use:

| Timestamp | Clip |
|---|---|
| `36:09-36:24` | “Agents take the sludge... humans keep the meaning... build the conditions where AI can do useful work.” |

**Best close:** `36:09-36:24`.

This should close the page if the journey page ends with a video/audio moment.

## 8. What To Add To The Hyperagent Timeline

The current timeline is good. These are the useful additions.

### Add 1 — The 10M Cell Trigger

Place between:

- The problem
- The boring layer

Suggested copy:

> **The breaking point**  
> Google Sheets gave the problem statement back: the spreadsheet hit its 10M-cell limit.

Video:

| Timestamp | Clip |
|---|---|
| `07:51-08:14` | Google Sheets 10M-cell warning |

### Add 2 — Commercial Strategy Outcome

Place after Forecasting or inside Demo 03.

Suggested copy:

> **Not just better reporting**  
> The new data made a labour-model decision defensible: employed sellers were stronger in the right conditions, which helped secure a major hiring shift.

Video:

| Timestamp | Clip |
|---|---|
| `18:49-19:33` | Employed sellers stronger, 57 hires signed off |

### Add 3 — Compounding / Arms And Legs

Place between Outcomes and Agent Layer, or just before the final lesson.

Suggested copy:

> **The compounding moment**  
> Clean data grows into systems. Systems grow into agents. Agents grow into workflows.

Video:

| Timestamp | Clip |
|---|---|
| `33:42-33:58` | Arms and legs / compounding |

## 9. What To Replace

### Replace Hero Primary Source

**Old likely source:** Airspace LA short interview.  
**New primary source:** Butternut talk transcript.

Airspace is still useful as a polished external credibility clip, but the Butternut talk is a better narrative spine.

Use Airspace only if you need:

- a polished face-to-camera quote
- a short external validation feel
- a line about personality/adoption without the full talk context

### Replace Single Demo Clips With Mini Sequences

Demo 01, Demo 02, and Demo 03 each contain multiple ideas. Do not force them into one clip.

Recommended structure:

- Demo 01: before mess → role-specific interface → AI first pass
- Demo 02: manual staffing → dashboard/drag-drop → lock schedule
- Demo 03: fragile forecasting → categorisation → labour-model decision

## 10. What To Avoid

### Avoid Exact Number Conflicts

The talk uses numbers that mostly match the canonical story, but check these before putting them as on-screen text.

Use these canonical public-facing numbers where possible:

- £8.1m channel spend
- around 120 sellers / 90 field sellers depending context
- around 1,500 activations
- around 75 data points per activation
- around 30,000 organiser emails
- around £180k/year travel saved
- around 3,000 hours/year saved at scale
- 12-month boring layer
- first agent fleet in two weeks

Be careful with:

- “7,000 payslips a week” in the transcript — this may be too easy to challenge or misunderstand.
- “57” vs “58” new hires — use one number consistently or say “major employed hiring shift.”
- “Button Up Box” transcript typo — do not copy this into captions; use Butternut Box.

### Avoid Overusing Jokes In The First 30 Seconds

The humour is good, but the page still needs to establish credibility quickly. Keep the opener funny, then move fast into the thesis.

### Avoid Making It Look Like Generic AI Consulting

Every clip should be attached to a concrete operational example:

- an event record
- a staffing decision
- a forecast
- a bonus flow
- an organiser email
- a human approval step

If a clip sounds like “AI is the future” without proof under it, cut it.

## 11. Visual / Brand Direction For The Page

Use the brand colour guidance from `astrajax_brand_colours.md`.

For the Journey page:

- Use **Pale Cream** as the public surface.
- Use **Ink** for body text.
- Use **Terracotta** for primary actions and selected timeline moments.
- Use **Sage Signal** for “approved,” “human in the loop,” and “live system” states.
- Use **Deep Moss / night mode** only for “below the surface” sections: agent layer, audit trail, Trinity, or context environment.

Suggested visual rhythm:

1. Cream surface for the founder story and problem.
2. Cream cards for demo before/after.
3. Dark moss section when the story goes below the surface into agents.
4. Return to cream for the final lesson and CTA.

This reinforces the brand idea:

> Surface: founder-led clarity. Below the surface: the operating layer.

## 12. Production Checklist

Before editing:

- [ ] Confirm whether the Butternut talk video exists in Airtable as `Townhall Section — Matthew Hopkinson`.
- [ ] Replace or supplement the incorrect transcript attachment on that record. The attached file previously appeared to be a comms summary, not the talk transcript.
- [ ] Add the exact timestamp notes from this document to the Airtable `Review Notes` field.
- [ ] Watch `Our Guy Reggie`, `My Guy Reggie`, and `Trinity in Action` once, because their transcript fields were empty.
- [ ] Decide whether the hero is one 90-second video or several short clips embedded through the timeline.

During edit:

- [ ] Keep most clips around 15 seconds.
- [ ] Use longer clips only for Hero, Trinity, or Final Lesson if the page format supports it.
- [ ] Match on-screen text to canonical numbers.
- [ ] Do not subtitle obvious transcript errors.
- [ ] Let the screen recordings play as proof, not as training videos.

After edit:

- [ ] Check the journey still says: clean data before agents.
- [ ] Check Matthew is framed as a non-technical commercial leader, not an engineer.
- [ ] Check every agent clip names the specific agent: Clive, Reggie, Tashi, Marlowe, Marcel.
- [ ] Check human approval is visible in the Trinity section.
- [ ] Check the final lesson lands on: agents take the sludge, humans keep the meaning.

## 13. Recommended Final Page Flow

This is the cleanest full journey:

1. **Intro hook:** `00:13-01:02`
2. **Thesis:** `01:46-02:10`
3. **Scale/context:** `04:28-05:05`
4. **Problem:** `07:01-07:21`
5. **Breaking point:** `07:51-08:14`
6. **Boring layer:** `08:47-09:12`
7. **Event interface:** `10:20-12:37` split into before/after
8. **Staffing:** `12:43-16:03` split into before/after/button
9. **Forecasting:** `17:05-19:33` split into engine/categories/commercial decision
10. **Outcomes:** `20:21-21:58`
11. **Agent layer intro:** `22:33-22:59`
12. **Clive:** `26:36-28:52` split into personality/product
13. **Reggie:** `30:11-31:04`
14. **Trinity:** `31:56-33:07`
15. **Compounding:** `33:42-33:58`
16. **Final lesson:** `34:26-36:24` split into trust/training/value/safety/close

## 14. Short Version For Immediate Build

If you only want the fastest credible version, build these clips first:

| Priority | Timestamp | Use |
|---:|---|---|
| 1 | `00:13-01:02` | Hero opener |
| 2 | `01:46-02:10` | AstraJax thesis |
| 3 | `07:01-07:21` | Problem statement |
| 4 | `08:47-09:12` | Boring layer / operating system shift |
| 5 | `11:13-12:37` | Event interface after |
| 6 | `14:15-16:03` | Staffing after + sludge |
| 7 | `17:53-19:33` | Forecasting categories + labour model |
| 8 | `21:28-22:59` | Foundation to agent layer |
| 9 | `26:36-27:39` | Clive / personality / adoption |
| 10 | `30:11-31:04` | Reggie |
| 11 | `31:56-33:07` | Trinity |
| 12 | `36:09-36:24` | Final close |

That is enough to make the Journey page feel like a coherent founder-led film, even before every screen recording is perfect.
