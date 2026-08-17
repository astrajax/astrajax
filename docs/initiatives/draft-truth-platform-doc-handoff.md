# Draft Brain Truth — Platform Doc handoff

**Status:** Working initiative brief for `@doc`. Website field-ID / dual-text / Brain Registry door + Trusted dual-register path shipped on branch `doc/draft-truth-field-id-writes` (17 Aug 2026) — **not merged**. HyperAgent pack / HEAD-only project-link / import list still open in this brief. Not a second schema source of truth.  
**Owner:** Matthew. **Lane:** Doc takes every amendment.  
**Date of signed intent:** 16–17 August 2026.  
**Do not invent doctrine.** Point at the live sources; implement the contract below.

Canonical / working sources (edit those; do not copy them wholesale into a second SSOT):

- Draft Brain Truth shape: [`docs/initiatives/brain-key-schema.md`](./brain-key-schema.md)
- Access, credentials, Workshop inventory: [`docs/initiatives/brain-key-wiring.md`](./brain-key-wiring.md)
- Operator flow (do not invert): [`docs/context/clive-man-context-flow.md`](../context/clive-man-context-flow.md)
- Live IDs: [`website/src/lib/brains/airtable-ids.ts`](../../website/src/lib/brains/airtable-ids.ts)

**Audience:** Platform Doc. Matthew is non-technical. This file is the build brief.

**Why you have this file:** this morning’s chat patched, then patched the patch, then told Matthew to import the wrong HyperAgent files. He has withdrawn trust from that loop. You own the lot. Do not implement another half-fix. Do not tell him “just update the executors.”

---

## 1. Why this brief exists (trust failure; Doc owns the lot)

Matthew asked for one capture contract: new Workshop drafts must carry both texts, a live brain, agent-owned fields only, and an optional project link when the **reasoning head** chooses one.

What he got instead:

1. A website helper that still writes Airtable by **field name** (a rename silently broke file-mining and the Receiving Wall).
2. A first project-link “fix” that made cheap executors match an **exact project title** in the claim — sludge back on the human.
3. A second “fix” that moved the choice to the **proposer** (still Composer / Kimi K3).
4. An import card that said **update the two executor JSON files only**, with no proposer and no head.

Matthew’s words, 17 Aug 2026, after that last card: he still had low-powered executors making the decision; we had told him to update executor files and mentioned no proposer change; he wants **you** to take **all** amendments. Do not trust this morning’s patch loop. Treat uncommitted skill / pack edits on `doc/clive-man-draft-truth-write-contract` as suspect evidence, not as done work.

Your job: make the **whole family** match the signed contract, regenerate the HyperAgent pack, give Matthew an exact import list of **every agent and skill that changed**, then smoke-test. One job. One branch. One PR when you are actually done.

---

## 2. Live objects (IDs)

Do not invent IDs. These are live-observed. Refresh from `airtable-ids.ts` if you discover drift; do not guess.

| Object | ID |
|---|---|
| Workshop base | `appL2fdnGmhA02WXd` |
| Draft Brain Truth | `tblswvXNYFDqnl6af` |
| Workshop Brain Registry (link target for a live brain) | `tblsI93ayQm4hq5bw` |
| Brain Registry link on a draft | `fldB1vIzRA6NBxEYs` |
| Canonical Text for Agents | `fld95ls0LG26rCNx4` |
| Canonical Text for Humans | `fldbnsCNSXmLXE51y` |
| Projects | `tbl5jo7EKBxAjjKbf` |
| Related Projects on drafts | `fld9wY5ncNSeMxVye` |
| Related Drafts on projects (reciprocal) | `fldHUpN0X5IlvClU8` |
| Project Name | `fldonDAGcLRG2GEzD` |
| Intended Outcome | `fldrb5LY13Feofm2l` |
| Lifecycle | `fld4SAa3XCObipxa8` |
| Lifecycle Active / Paused / Closed | `seljDftZRizDXWaK8` / `selbbJnwjmjnSCR8M` / `selED0i2J4g8kJGaE` |
| Human Reviewed | `fldi0T3Kq4psOpLoi` |
| Should Have Been Auto-Handled | `fldWEGX7L3cGuqxe9` |
| Control-plane report (builder overlay) | `rpt-draft-truth-builder-overlay-20260817` / `rec7CebyrzBHYzELy` on `appubDI76O0t8xisg` |
| Projects grain record | `rpt-projects-thin-table-20260817` |

**Three Active seed projects** (agents never create rows):

| Project | Record ID |
|---|---|
| Establish K3 Open-Weights Fine-Tuning for AstraJax | `rec9deYmfHS8s39za` |
| Manage AstraJax Context On-Platform | `rechmkpaan4o4R6CT` |
| Prove Autonomous Agent Self-Improvement | `recH3hh1hPrLhsyVH` |

Registry index (not the Workshop link table): `appbdTVHevH6Bl5ZZ`. Trusted Chapter 1 is a different base — do not write it from capture.

---

## 3. Signed intent (Matthew’s words, not our spin)

16 Aug 2026, four corrections, then a flinch at “review claims for promotion”:

1. **Text for humans** is the same claim, easy to read, no record IDs. **Text for agents** is worded so a following agent loses nothing in the packaging. **Both can be canon.**
2. The human-review fields exist **so Doc can improve skills and agent configs**. Platform build only. **Not for clients.**
3. There is a **Human Reviewed** checkbox. If it is not ticked, it is not reviewed. That answers the “are these scores live?” worry.
4. The old **Needed Human Review?** box was meant as “this didn’t need human eyes and should have auto-approved” — meaning **autonomously into Draft**, not into Trusted.

On promotion theatre: *“do you really both recommend reviewing claims for promotion?? it would add SO much demand on the user and kill the platform workflow.”* Signed answer: **no**. Digests. Humans promote to Trusted rarely (Lane C). Agents write Draft / Quarantined only.

17 Aug 2026, capture paths: *make sure Clive’s Man flows report correctly — linking to live brains, writing both texts, filling the right fields, documents where appropriate.*

17 Aug 2026, Projects: he signed a **thin** table (Name, Intended Outcome, Lifecycle). Quote from the parallel thread: *“We can just retire the table if it gets annoying cant we. Build it pls.”* Optional Related Projects on drafts. No auto-link of old rows. No copy into client brains.

17 Aug 2026, project-link judgement — signed YES, then corrected (see §10). Final rule: **Clive’s Man the HEAD (Sol) decides.** Cheap hands copy or write IDs. They do not choose.

17 Aug 2026, HyperAgent: hybrid. You regen the pack. **He** imports (update existing, do not delete or duplicate). You cannot click HyperAgent. Source-document upload does not fix the allowlist.

---

## 4. Dual text

*Canon* = the signed-off record the business may treat as true. Dual text is **one claim, two registers**, both canon if they keep the same meaning. If they disagree, that is a defect, not a choice.

| Register | Field | ID | Job |
|---|---|---|---|
| Agent | Canonical Text for Agents | `fld95ls0LG26rCNx4` | Complete claim. Keep record IDs and precision. Do not strip facts for readability. |
| Human | Canonical Text for Humans | `fldbnsCNSXmLXE51y` | Same claim, readable, **no record IDs**. |

**Defect you must keep fixed:** on 16 Aug the human column was written by **nothing** (0 of 126 rows). Every **new** create must write both. A helper may derive the human register by stripping IDs from the agent text when the agent has nothing plainer to say. It may not leave the human field blank. Do not silently back-fill the old 126 unless Matthew later asks — that is a different job.

Trusted Brain Truth still uses the name **Canonical Text**. Do not rename it there.

---

## 5. Builder-review overlay (Doc loop, not client queue)

These fields are an **AstraJax platform-builder loop**: Matthew ticks and scores so you can improve skills and configs. They are not a client product. They are not a per-row promotion queue.

- Humans promote to Trusted **rarely** (Lane C).
- Agents write **Draft** or **Quarantined** only.
- Matthew sees **digests**, not per-row promotion theatre.
- **Do not copy this overlay into client brains.**

**Human Reviewed** (`fldi0T3Kq4psOpLoi`) is the only “looked at” signal. Unticked = ignore overrides, scores, and notes. Ticked does **not** mean approved or promoted.

**Should Have Been Auto-Handled** (`fldWEGX7L3cGuqxe9`, renamed from Needed Human Review?):

- Means: “this should have gone through without me” — autonomously into **Draft**.
- **Never** auto-promote to Trusted.
- After the rename, the old meaning inverted. Eight reviewed+ticked rows were cleared. Only `recFQUsaMcRMsJtZg` was set true (reviewed; note said it should have been captured without him).

---

## 6. Field rename pack (live — do not revert)

Already applied on Workshop Draft Brain Truth. IDs did not change. **Do not revert the names.** Website and HyperAgent must key on **field IDs**, not these names.

| Old name | Live name | ID |
|---|---|---|
| Needed Human Review? | Should Have Been Auto-Handled | `fldWEGX7L3cGuqxe9` |
| Human Chosen Record Type *(empty = agent was correct)* | Human Chosen Record Type (parenthetical dropped) | `fld8RMUWe9grDx9F6` |
| Context Capture Quality | Capture Quality | `fldaEEJvOK3YMepwK` |
| Human Notes on Communications | Readability Notes | `fldV4xwixcBhcpnHv` |
| Human Notes on Context Capture Quality | Capture Quality Notes | `fld7iMmXepwsZ3ieD` |
| Context Importance *(unscored = shouldn't be context)* | Context Importance (kill-rule dropped from the name) | `fld31KoLoNuuYUx6V` |
| Candidate for Follow Up Question from Agent | Follow-up Candidate | `fldqxz6XyOQwCwyCz` |
| Human Clarification | Builder Notes | `fld6SLo2yjscSEU5v` |

The two canonical texts, Human Reviewed, and the Human Chosen * overrides kept their names and got honest descriptions. Do not “helpfully” rename them again.

---

## 7. Agent write forbid-list

Capture agents must **never** write:

- Human Reviewed
- Human Chosen Brain / Category / Record Type / Horizon
- Readability Rating, Capture Quality, Context Importance
- Readability Notes, Capture Quality Notes, Builder Notes
- Should Have Been Auto-Handled
- Follow-up Candidate
- Status **Trusted**, **Promoted**, **Rejected**, or the drift value **Approved**

A write that includes any of those is a failed write. The shared helper must refuse the whole payload. An agent-set “Human Reviewed” would make the only looked-at signal a lie.

Agents **may** write: Title, both canonical texts, Brain Slug, Brain Registry link, Brain Theme, Proposed Category, Record Type, Horizon, Capture Source, Source Documents, Context Amendment Versions, Related Projects (**IDs already in the cleared brief only**), Proposed By Agent, Created By, Status Draft or Quarantined, Supersedes Trusted Truth ID.

---

## 8. Website write-path contract (IDs, both texts, Brain Registry, helper)

One door: [`website/src/lib/brains/draft-truth-write.ts`](../../website/src/lib/brains/draft-truth-write.ts), used by [`website/src/lib/brains/handlers/draft-propose.ts`](../../website/src/lib/brains/handlers/draft-propose.ts) and every other website capture path (file mining, Receiving Wall create, intake routing).

**Write-by-name bug (you own this).** Airtable’s REST API keys create/update payloads on **field names** unless you send field IDs. On 17 Aug, `Canonical Text` was renamed to **Canonical Text for Agents**. Callers still sending the old name got `UNKNOWN_FIELD_NAME`. File-mining failed quietly. The Receiving Wall showed empty letters. That is why “the website helper exists” is not the same as “the path is safe.”

**Contract:**

1. **Airtable REST writes use field IDs**, not names. A future rename must not break capture again. Today the helper still builds `DRAFT_TRUTH_FIELD_NAMES` and POSTs those names. That leftover is a defect. Fix it.
2. Every create writes **both** texts.
3. Every create links **Brain Registry** (`fldB1vIzRA6NBxEYs` → `tblsI93ayQm4hq5bw`). A Brain Slug is a label, not a destination. The slug field was in the repo; the **link** was in no repo file this morning — drafts could not attach a live brain. That ID is now in `airtable-ids.ts`. Keep it required on create.
4. Fill agent-owned fields (category, type, horizon, capture source, proposed-by, created-by).
5. Refuse every builder-review field in §7.
6. Status Draft or Quarantined only.
7. Related Projects: accept live `rec…` IDs already chosen by the head. No name matching. Blank is legal.
8. Link Source Documents when a file is the evidence. Link Context Amendment Versions when the row came from the V1 queue.

HyperAgent Python already keys many writes on field IDs. The website must catch up. Do not leave one door on names and one on IDs.

---

## 9. Projects + Related Projects

Matthew signed a **thin** Workshop table. One row is one bounded piece of work he has recognised, with a named outcome and a close point. Not a task tracker. Soft retire = Lifecycle Closed. Hard retire = delete the table.

| Field | Notes |
|---|---|
| Project Name | Only home for the name |
| Intended Outcome | What done looks like |
| Lifecycle | Active / Paused / Closed |
| Related Drafts | Reciprocal of Related Projects |

No owner, deadline, priority, next action, or weekly auto-create.

**Related Projects** on a draft is optional, many-to-many, blank legal. Persistent truths may have none. A document upload is not a substitute for a project link.

**Forbidden:**

- Exact Active project **name** matching in the claim (puts the sludge on the human).
- Agents creating a Projects row.
- Auto-linking the old 126 drafts.
- Copying Projects or the builder-review overlay into client brains.
- Inventing a fourth project because the claim “feels like” one.

---

## 10. Who decides a project link (HEAD only)

This is the failure he is angry about. Record the three failed instructions so you do not repeat them.

### Failed instruction 1 — executor exact-name match

Doc wired: link a project only if the claim uses an **exact Active project title**, word for word. Matthew was then told the executors do not choose; they only link if he (or the claim) supplied the magic name.

He caught the contradiction: *the executors do not sit and choose* versus *Clive’s Man / the morning executor writes the claim — you do not.* If the writer will not choose and the human must type the title, **all the reasoning lands on him**. That is the opposite of AstraJax.

He signed: **YES. DO THAT.** — meaning move the choice off the human and off exact-name matching.

### Failed instruction 2 — proposer reasons, executor writes

The next patch put judgement on the **proposer** (Composer / Kimi K3): load `listActiveProjects`, pass `rec…` IDs, executor writes only those IDs. Skills, schema, and context-flow were edited to say “Proposer / Clive’s Man decides.”

Matthew: *“fucks sake. So i still have low powered executors making these decisions??”*

We admitted it: the proposer is still cheap. Choice must be **Clive’s Man the HEAD** (Sol).

### Failed instruction 3 — “import the executors only”

After the pack was generated, Matthew was told to update **only**:

1. `hyperagent/exports/agents/agent-clive-man-context-executor-v0_4.json` (morning)
2. `hyperagent/exports/agents/agent-clive-man-executor-v0_4.json` (chat)

No head. No proposer. No challenger. No skills.

His reply: *“But you're telling me to just update the executor files and nothing else!? no mention of a proposer change!?!?!?!!”*

That instruction was **wrong**. If the chooser is the head (or was the proposer), updating only the writers leaves the decision where it was. **Never repeat “executors only.”**

### Correct contract (implement this)

| Role | Model | Project-link job |
|---|---|---|
| **Clive’s Man the HEAD** (`@clive-man`) | Sol | **Decides:** this project / these / none. Looks at the **live** Active Projects list (not a hardcoded three). Puts `rec…` IDs or `none` in the brief. |
| **Proposer** | Composer / K3 | **Copies IDs only.** Must not invent, swap, or add. If the head said none, write none. |
| **Challenger** | Composer / K3 | **May veto** (ID missing, not Active, claim does not justify). Veto ≠ a new choice. If the head said none, do not add one. |
| **Executor** (chat) and **Context Executor** (morning) | K3 low | **Writes** Related Projects only from IDs already in the **cleared** brief. No resolver. No name matching. No create project. Blank is legal. |

**Lane A** (verbatim 1–3 rows, trusted household source): if Matthew **named** a project, use that ID. If he did not, leave blank. **Do not infer.**

**Lane B** (derived / untrusted / batches): the head **must** include `related_project_ids: [...] | none` **before** the proposer runs.

**Morning pipe** (Activity Intake / Ambient → Auditor 06:00 → Challenger 07:00 → Executor 08:00): Intake and Ambient **do not** choose projects. They write Context Amendment Versions only. If the cleared V2 payload has no IDs, the draft’s Related Projects stays blank. Do not let Auditor, Activity Intake, or Ambient “load the live list and judge.” That is the same cheap-minion leak. Blank is the legal default on the scheduled path unless a head brief already supplied IDs.

Current repo leftovers you must overwrite (they still teach failed instruction 2):

- `.cursor/skills/clive-man/SKILL.md` — “Proposer / Clive’s Man loads the live Active list and decides”
- `.cursor/skills/clive-man-proposer/SKILL.md` — step 7 still has the proposer **decide**
- `.cursor/skills/clive-man-activity-intake/SKILL.md` — `related_projects` “after loading the live Active list and judging”
- `docs/initiatives/brain-key-schema.md` Related Projects row and Projects footer
- `docs/context/clive-man-context-flow.md` “Clive's Man (proposer) loads…”
- Helper comments that say IDs are “chosen by the proposer”

---

## 11. Clive’s Man flow (do not invert)

Operator picture: [`docs/context/clive-man-context-flow.md`](../context/clive-man-context-flow.md). Do not brief from skills first.

```text
Work happens
  → Household Activity (this conversation happened)
  → Activity Intake + Thread Ambient write Context Amendment Versions only
       (Stage V1 · Verdict Proposed — still a proposal queue)
  → Auditor 06:00 → Challenger 07:00 → Executor 08:00 materialise Draft Brain Truth
  → Matthew approves (rare) → Trusted Brain Truth
```

| Door | Writes | Does not write |
|---|---|---|
| Activity Intake | Context Amendment Versions only | Draft Brain Truth, Trusted, Projects |
| Thread Ambient | Context Amendment Versions only | Draft Brain Truth, Trusted, Projects |
| On-demand `@clive-man` (Lane A–B) | May create Draft Brain Truth | Trusted; builder-review fields; new Projects |
| Source-document mining | May create Draft Brain Truth (and link the file) | Trusted; builder-review fields |

Leave the HyperAgent **08:00** schedule **off** until Matthew is happy with live rows. Keep existing credentials. Do not mint new ones for this job. Ambient 05:00 stays off until its own bookmark / credential gate (already recorded in wiring).

---

## 12. HyperAgent pack + exact import rule

**Hybrid, signed:**

1. You regenerate the v0.4 family pack **in the repo** from the corrected sources.
2. Matthew imports in HyperAgent: **update the existing agent / skill**, do not delete, do not make a second.
3. He tells you “import complete.”
4. You run one controlled smoke draft.

**Facts he was mis-taught this morning:**

- On-platform Doc **cannot** click HyperAgent. Do not ask him to “give the pack to Doc to update.”
- Uploading a source document does **not** fix the executor allowlist.
- Importing yesterday’s JSON does not either.
- Leave **08:00 off**. Keep the credentials already on the agents.

**The import list is the whole family that changed, never “executors only.”** After the pack is **correct** (head decides; proposer copies; challenger vetoes; executors write IDs only; both texts; Brain Registry; forbid-list), you list the **exact** files. Likely set if those artifacts actually changed — confirm after regen, drop any file that did not change:

Agents:

- `hyperagent/exports/agents/agent-clive-man-v0_4.json` — **head**
- `hyperagent/exports/agents/agent-clive-man-proposer-v0_4.json`
- `hyperagent/exports/agents/agent-clive-man-challenger-v0_4.json`
- `hyperagent/exports/agents/agent-clive-man-executor-v0_4.json` — chat executor
- `hyperagent/exports/agents/agent-clive-man-context-executor-v0_4.json` — morning executor
- Matching context-auditor / context-challenger / ambient / activity-intake exports **only if** their contract or allowlist changed

Skills (same rule — matching skills, not “executors only”):

- `hyperagent/exports/skills/skill-clive-man-v0_4.json`
- `hyperagent/exports/skills/skill-clive-man-proposer-v0_4.json`
- `hyperagent/exports/skills/skill-clive-man-challenger-v0_4.json`
- `hyperagent/exports/skills/skill-clive-man-executor-v0_4.json`
- `hyperagent/exports/skills/skill-clive-man-context-executor-v0_4.json`
- Plus auditor / context-challenger skills if they changed

Cursor twins (`.cursor/skills/clive-man*`) must say the same contract as the HyperAgent pack. Do not leave Cursor on HEAD-decides and HyperAgent on proposer-decides.

This morning’s working tree already has dirty v0.4 JSON with new field IDs and the **wrong** chooser. Do not hand Matthew those files as the import pack. Regen **after** the head-only contract is in the sources.

---

## 13. Already in repo vs still broken vs Matthew still must do

Branch: `doc/clive-man-draft-truth-write-contract`. Not pushed as of this brief. Three commits vs `origin/main` plus a merge, then a large **uncommitted** dirty tree from the morning patch loop.

### Already live in Airtable (do not rebuild, do not revert)

- Dual-text field names and descriptions.
- Builder-review rename pack (§6).
- Tick inversion on Should Have Been Auto-Handled (eight cleared; `recFQUsaMcRMsJtZg` true).
- Projects table, reciprocal link, three Active seeds.
- Control-plane reports named in §2.

### Already committed on the branch (keep; finish)

- Shared website helper: both texts, Brain Registry resolve, refuse builder-review fields, Draft / Quarantined only.
- `draft-propose` and other website capture paths pointed at that helper.
- Overlay field IDs in `airtable-ids.ts`.
- Schema / context-flow notes that dual text and the overlay exist.
- Helper tests for the write contract.

### In the dirty working tree (suspect — do not ship as-is)

- Projects IDs and `relatedProjectRecordIds` on the helper (ID write is fine; comments still say the **proposer** chooses).
- Skills and docs still teaching failed instruction 2.
- HyperAgent sources / exports that accept new fields but still have the cheap chooser.
- Activity Intake told to judge `related_projects`.

### Still broken (you own)

- Website REST still POSTs **field names**. Rename-fragile. Switch to IDs.
- Brain Registry link is in the helper now; live HyperAgent morning machine will still **reject** new fields until a **correct** pack is imported.
- Project-link judgement is not on the HEAD. Cursor and HyperAgent still have the proposer (or leftover exact-name) story.
- Import card Matthew was given was **executors only**. That lie is why this file exists.
- Old 126 rows still have empty human text. New writes must not repeat that. Do not auto-rewrite history unless he asks.
- Schema / flow / skills still contradict §10. After you implement, those files must say HEAD decides — they are working copies, not a second SSOT, but they must not keep the failed instruction.

### Matthew still must do (only after you say the pack is correct)

1. In HyperAgent, **update existing** agents and skills from the exact file list you give him. Do not delete. Do not duplicate.
2. Leave 08:00 off. Keep current credentials.
3. Tell you “import complete.”
4. Look at one new draft with you (smoke in §14).

He does **not** import the two-file list from 17 Aug 08:21. He does **not** upload source documents as a substitute.

---

## 14. Done when

Smoke, one new draft, after import:

- **Canonical Text for Agents** is filled (complete claim).
- **Canonical Text for Humans** is filled (same claim, no record IDs).
- **Brain Registry** links a live brain (not slug-only).
- **Related Projects** is filled **only** if the head chose an ID; otherwise blank. No exact-name trick. No proposer invention.
- **Human Reviewed** and every other builder-review field are untouched.
- Status is Draft (or Quarantined if that was the brief). Not Trusted. Not Promoted.
- Proposed By Agent is an honest name (Clive’s Man / the real actor), not a blank “Agent” lie if you know which door wrote it.

Also done when:

- Website creates go through the helper **by field ID**.
- Cursor skills and HyperAgent pack tell the same HEAD-only story.
- You have given Matthew the **exact** import list of every file that changed — head, proposer, challenger, both executors, matching skills — and he has updated those existing HyperAgent objects.
- You have not copied the overlay or Projects into a client brain.
- You have not auto-linked old drafts.
- You have not turned 08:00 on.

---

## 15. What not to touch

- Client brain bases (no overlay, no Projects table).
- Trusted Brain Truth writes or a Trusted rename of Canonical Text.
- Old draft back-fill (human text, project links) unless Matthew later commissions it.
- Creating Projects from any agent.
- Reverting the live field names in §6.
- Ambient 05:00 enablement, checkpoint mint, or 08:00 on.
- Existing HyperAgent credentials.
- A second schema SSOT or a dated filename.
- Another “just the executors” import card.
- This morning’s uncommitted proposer-decides edits as if they were signed.

---

## Doc execution order (plain)

1. Read this file, then the four sources in the header. Confirm live IDs; do not invent.
2. Finish the website helper: field IDs, both texts, Brain Registry required, forbid-list, Related Projects = IDs from the brief only.
3. Rewrite the Clive’s Man **family** contract: HEAD decides; proposer copies; challenger vetoes; executors write. Lane A / Lane B as in §10. Morning pipe does not choose.
4. Align Cursor skills **and** HyperAgent sources, then regen the pack.
5. Give Matthew the exact import list (whole family that changed). Wait for “import complete.”
6. Smoke one draft (§14). Then PR the one job.

If anything in the dirty tree helps, keep the ID maps and the “executor writes IDs only” tests. Throw away the chooser. The chooser is the head.
