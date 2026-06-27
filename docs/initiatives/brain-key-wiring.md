# Brain Key Wiring — Chapter 1 Access Model

**Status:** Working spec for AIE Chapter 1  
**Owner:** Matthew  
**Last updated:** 26 June 2026  
**Canonical architecture:** `[docs/business/architecture.md](../business/architecture.md)`

### Naming and surfacing

- **Brain Key** = internal term for the human-approved access grant + server-side credential use. Engineering docs, schema, env vars.
- **Public / demo language** = “approved context for this task,” “context access,” “Workshop only (Seedling).” Do not lead with “Brain Key” in UI or booth copy.
- **Maturity gate:** no context-access flow until the brain is at least **Working** (approved rows exist in Trusted Brain). Seedling = Workshop drafts only.
- **Hard lock** = separate bases (Workshop vs Trusted). **Scope** = retrieval/audit filter inside a grant — not a separate key product per scope area.

---

## Purpose

Clive and Pam can **request** access to a trusted Brain. They are **blind** to trusted context until a human approves a short-lived grant. They **never receive, store, or remember** the Brain Key (Airtable credential). Only server-side Doc routes use credentials after human approval.

---

## Storage boundaries


| Base                                    | Role                     | Holds                                                                                                                        | Never holds                                                                                     |
| --------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **Brain Registry**                      | Index + governance       | Brain metadata, **agent metadata**, maturity, workshop/trusted/agent base IDs, Brain Key Requests, Access Grants, Change Log | Trusted context text, persona memory text, API tokens                                           |
| **Brain Workshop**                      | Draft / propose          | Draft Brain Truth, Brain Interactions, Pam Reviews, pending Approval Decisions, Doc Actions, User Brains                     | Approved canonical context, persona memories                                                    |
| **Trusted Brain** (one per Brain theme) | Canonical business truth | Approved Brain Truth, Brain Memories (working shared recall)                                                                 | Draft or quarantined records, character narrative, persona config |
| **Agent** (one per agent)               | Character + role memory  | Narrative Arch, Persona Config, Persona Memories, Minions                                                                    | Canonical business truth, other agents' state                                                   |


Strictest practical rules:

- **One Trusted Brain base per Brain theme** — token scoping for business truth.
- **One Agent base per agent** — token scoping for character and persona memory (Clive, Pam, Doc, Clive's Man for Chapter 1). **Clive's Man** is the same cast member as The Man in `character-provenance.md` §7 — brain steward and full character, not a separate metaphor.
- **HyperAgent does not store durable memory** for product agents. Runtimes fetch from Agent + Trusted bases at session start.

---

## Credential map


| Credential (Vercel env)           | Read               | Write                                                  | Used by                                                                                    |
| --------------------------------- | ------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `BRAIN_REGISTRY_READ_TOKEN`       | Registry           | —                                                      | Public routes (metadata only)                                                              |
| `BRAIN_WORKSHOP_WRITE_TOKEN`      | Workshop           | Workshop                                               | Clive/Pam interaction log, draft writes                                                    |
| `BRAIN_WORKSHOP_READ_TOKEN`       | Workshop           | —                                                      | Admin workbench                                                                            |
| `BRAIN_TRUSTED_{SLUG}_READ_TOKEN` | That Trusted Brain | —                                                      | Brain Truth retrieve (after grant validation)                                              |
| `BRAIN_DOC_PROMOTE_TOKEN`         | Workshop + Trusted | Trusted + Registry Change Log                          | Doc promote route only                                                                     |
| `BRAIN_KEY_ADMIN_TOKEN`           | Registry           | Registry (grants)                                      | Human approve route                                                                        |
| `BRAIN_AGENT_{SLUG}_READ_TOKEN`   | That Agent base    | —                                                      | Server loads Narrative Arch + Persona Config + Persona Memories + Minions for that persona |
| `BRAIN_AGENT_{SLUG}_WRITE_TOKEN`  | That Agent base    | That Agent base (Persona Memories, Minions state only) | Server-side persona auto-save; never browser or model prompt                               |


**Invariant:** No env var used by Clive/Pam chat routes may write to a Trusted Brain base.

**Invariant:** No env var used by Clive/Pam chat routes may read another agent's Agent base.

Browser and model prompts never receive these values. See `[website/src/lib/brains/secrets.ts](../../website/src/lib/brains/secrets.ts)`.

---

## Brain Key model

The Brain Key is **not** an API key shown to an agent. It is a **human-approved access grant**.

1. Clive or Pam creates a **Brain Key Request** (purpose, brain, scope, reason, expiry).
2. **Human approves directly** — no Pam gate on read access. Unlocking trusted context for a bounded task is a human judgement call, not a sceptical review moment.
3. Server creates **Access Grant** (`grant_id`, `brain_id`, `persona_id`, `scope`, `session_id`, `expires_at`, `max_uses`, `approved_by`).
4. Server validates grant on retrieve → loads approved snippets from Trusted Brain → returns **prompt-safe snippets only**.
5. Grant use logged with record IDs, content hashes, persona, route — not full payload or secrets.

**When Pam still applies (action gates only):** canonical context approval, agent creation, deployment, Doc handoff — not routine Brain Key unlock for read access.

### No-memory rule

- Never send tokens, grant secrets, or raw trusted base IDs to Clive, Pam, browser, or persisted interaction logs.
- Brain Interactions store **retrieval manifest** (record IDs + hashes), not full trusted text.
- Grants are short-lived: default 15 minutes, max 3 retrievals, bound to `session_id` + `persona_id`.
- Session continuation requires a valid grant or a new human approval.

### Persona memory auto-save (Agent bases)

Persona Memories are **non-canonical** and may auto-form without human approval on create. This is intentional — character recall should feel alive, not bureaucratic.

Guards (same spirit as no-memory rule, applied to writes):

- Persona Memory writes pass `**sanitizeForClient`** — no tokens, grant secrets, raw trusted base IDs, or copied Brain Truth text.
- Persona Memories hold the agent's **own recall**, not a cache of business truth.
- Human gate applies at **promotion** only: Persona Memory → Brain Memory → Draft Brain Truth → Brain Truth.
- Steward (Clive's Man) may dedupe and retire stale Persona Memories without approving their birth.

This is **not** HyperAgent `autoSaveMemories`. Governed fleet exports keep `autoSaveMemories = false` because HyperAgent must not own the brain. Auto-save targets **Airtable Agent bases** under sanitiser + retire discipline.

**Tier 1 and Tier 2 are different from auto-save.** Persona Memories (Tier 3) auto-form without a per-record gate. **Super Objective (Tier 1) and Known Truths (Tier 2)** are canonical character bedrock, so character-craft agent writes there default to **Provenance Status = Pending** and only Matthew promotes them to **Approved-Canonical**. Same spirit as the no-memory and promotion rules: an agent proposes, a human promotes before it counts.

---

## Registry tables

Full field-level blueprint: `[brain-key-schema.md](./brain-key-schema.md)`.

Summary: **Brains**, **Agents**, **Brain Key Requests**, **Access Grants**, **Change Log**.

---

## Workshop tables

Full blueprint: `[brain-key-schema.md](./brain-key-schema.md)`.

Summary: **User Brains**, **Draft Brain Truth**, **Brain Interactions**, **Pam Reviews**, **Approval Decisions**, **Doc Actions**.

## Trusted Brain tables (per theme)

Full blueprint: `[brain-key-schema.md](./brain-key-schema.md)`.

Summary: **Brain Truth** (approved only), **Brain Memories** (working shared recall).

## Agent base tables (one per agent)

Full blueprint: `[brain-key-schema.md](./brain-key-schema.md)`.

Summary: **Narrative Arch**, **Persona Config**, **Persona Memories**, **Minions**.

Chapter 1 agents: `clive`, `pam`, `doc`, `clive-man`.

### Tiered character context (Narrative Arch + Persona Memories)

Character truth lives in three tiers ordered by injection priority, so the most important truth is always in front of the runtime and context cannot bloat:

| Tier | Lives in | Injection | Governance |
|------|----------|-----------|------------|
| **1 — Super Objective** | Narrative Arch (`Tier = Tier 1 — Super Objective`) | 5/5, always injected. One selfish sentence; at most one active per character | Canonical. Agent writes land **Pending**; Matthew promotes to **Approved-Canonical** |
| **2 — Known Truths** | Narrative Arch (`Tier = Tier 2 — Known Truth`) | 4/5, always injected, **capped at five** (one per `Known Truth Slot`) | Canonical bedrock, never-changing. Agent writes land **Pending**; Matthew promotes |
| **3 — Persona Memories** | Persona Memories table | 3/5, **retrieved on demand**, limitless | Non-canonical. Auto-form as **Active**, no per-record gate. Each memory links to **exactly one** Known Truth |

The five Known Truth slots: formative memory, secret, baseline relationship stance, greatest fear, Inner Attitude. The memory → truth link (Tier 3 → Tier 2) is a `multipleRecordLinks` field; "exactly one, required" is enforced at the write path and an optional Interface form, not at the table schema (see schema doc enforcement note). The approval gate field on Tiers 1 and 2 is **Provenance Status** (Pending / Approved-Canonical).

---

## API contracts

All routes: `POST`, JSON body, server-only Airtable access. Responses pass through `sanitizeForClient()`.

### `POST /api/brains/key/request`

**Auth:** Public session (rate-limited); workshop write token server-side only.

```json
{
  "brainSlug": "astrajax-chapter-1",
  "persona": "clive",
  "purpose": "Answer booth question about pricing guardrails",
  "scope": "read:brain-truth:pricing",
  "reason": "User asked about claim-control; need approved positioning snippets",
  "sessionId": "uuid",
  "requestedExpiryMinutes": 15
}
```

**Response:**

```json
{
  "requestId": "bkr_...",
  "status": "pending",
  "requiresHumanApproval": true
}
```

No `pamGateRecommended` on this route — Pam is not part of the Brain Key unlock flow.

### `POST /api/brains/key/approve`

**Auth:** Admin header `x-brain-key-admin` must match server env (human approval surface).

```json
{
  "requestId": "bkr_...",
  "decision": "approved",
  "approver": "Matthew",
  "grantMaxUses": 3,
  "grantExpiryMinutes": 15,
  "notes": "Booth demo — pricing scope only"
}
```

**Response:**

```json
{
  "grantId": "grt_...",
  "status": "active",
  "expiresAt": "ISO8601",
  "maxUses": 3
}
```

Grant ID is returned to the **human UI only**, then passed to chat routes as opaque handle — never embedded in model system prompt as a secret.

### `POST /api/brains/truth/retrieve`

**Auth:** Valid active grant required.

```json
{
  "grantId": "grt_...",
  "sessionId": "uuid",
  "persona": "clive",
  "brainSlug": "astrajax-chapter-1",
  "scope": "read:brain-truth:pricing"
}
```

**Response:**

```json
{
  "snippets": [
    { "recordId": "rec...", "title": "...", "text": "...", "contentHash": "sha256:..." }
  ],
  "manifest": {
    "recordIds": ["rec..."],
    "hashes": ["sha256:..."],
    "grantId": "grt_...",
    "retrievedAt": "ISO8601"
  },
  "remainingUses": 2
}
```

### `POST /api/brains/interactions/log`

```json
{
  "sessionId": "uuid",
  "persona": "clive",
  "brainSlug": "astrajax-chapter-1",
  "userMessage": "...",
  "assistantReply": "...",
  "manifest": { "recordIds": [], "hashes": [], "grantId": "grt_..." },
  "channel": "website"
}
```

Does not persist full snippet text when `manifest.grantId` is set.

New rows default **Review Status** to `New` and **Context Flagged** to `None`.

### `GET /api/brains/interactions/list`

Query: `brainSlug` (required), `limit` (optional, max 50), `shortlist=true` (optional Needs Review shortlist).

```json
{
  "interactions": [
    {
      "recordId": "rec...",
      "interactionId": "int_...",
      "sessionId": "uuid",
      "persona": "clive",
      "brainSlug": "astrajax-chapter-1",
      "userMessage": "...",
      "assistantReply": "...",
      "channel": "website",
      "createdAt": "ISO8601",
      "qualityScore": 4,
      "reviewer": "Client name",
      "reviewNotes": "Optional",
      "reviewedAt": "ISO8601",
      "suspectedContextIssue": false,
      "reviewStatus": "Reviewed",
      "contextFlagged": "None",
      "manifestRecordIds": ["rec..."],
      "grantId": "grt_...",
      "isFallbackContext": false
    }
  ]
}
```

When `shortlist=true`, returns only interactions with **Quality Score** <= 2 or **Suspected Context Issue** checked, excluding rows where **Review Status** = `No action`. Fallback manifest IDs (`fallback-`*) are surfaced as fallback context and are not treated as trusted hash alarms.

Server-side Workshop token only — never exposed to browser.

### `POST /api/brains/interactions/score`

```json
{
  "recordId": "rec...",
  "brainSlug": "astrajax-chapter-1",
  "qualityScore": 4,
  "reviewer": "Client name",
  "reviewNotes": "Optional",
  "suspectedContextIssue": false
}
```

Sets **Reviewed At** to now. Scores 3-5 set **Review Status** to `Reviewed`; if `suspectedContextIssue` is true they set **Context Flagged** to `Flagged for review`. Scores 1-2 auto-propose review in Workshop only: **Review Status** = `Action proposed` and **Context Flagged** = `Flagged for review`, or `Quarantine proposed` when score = 1 and `suspectedContextIssue` is true.

Response includes `interaction` and `autoProposed` (`true` when `qualityScore <= 2`).

Client UI: `/brain/review` (Chapter 1 brain slug by default).

### Website public Clive channel (`POST /api/ask-clive`)

Homepage **Ask Clive** uses the same Trusted Brain retrieval helper as grant-backed answers (`retrieveTrustedSnippets` in `website/src/lib/brains/trusted-truth.ts`) for the public positioning scope (`read:brain-truth:positioning`). There is **no per-session Brain Key grant** on this route — it is a server-side read for the marketing website channel only. When Trusted Brain tokens are not configured, it falls back to `FALLBACK_TRUSTED_SNIPPETS` (placeholder manifest IDs such as `fallback-positioning`).

Every Ask Clive exchange is logged to **Brain Interactions** via `POST /api/brains/interactions/log` with:

- `persona: clive`, `brainSlug: astrajax-chapter-1`, `channel: website`
- manifest record IDs + hashes from the snippets used (no grant ID on this channel)
- `sessionId` from the browser (stable per device via localStorage)

This replaces the legacy single-base Context Items loader (`appYv601Oq7fKTCj0`). Review and score homepage Clive answers at `/brain/review`.

### `POST /api/brains/interactions/action`

Workshop-only upkeep action for the `/brain/review` Needs Review shortlist. Does not write Trusted Brain Truth, Brain Memories, freshness, category, scope, authority, or canonical text.

```json
{
  "recordId": "rec...",
  "brainSlug": "astrajax-chapter-1",
  "action": "propose",
  "actor": "Client name",
  "quarantine": false
}
```

`action: "propose"` sets **Review Status** to `Action proposed` and **Context Flagged** to `Flagged for review` or `Quarantine proposed` when `quarantine` is true. `action: "dismiss"` sets **Review Status** to `No action` and **Context Flagged** to `None`.

### `POST /api/brains/doc/promote`

**Auth:** Doc promote token only; requires `approvalDecisionId`.

```json
{
  "approvalDecisionId": "apd_...",
  "brainSlug": "astrajax-chapter-1",
  "promotions": [
    {
      "draftRecordId": "rec...",
      "category": "Positioning",
      "scope": "read:brain-truth:positioning"
    }
  ],
  "approver": "Matthew",
  "reason": "Human approved brain brief section 2"
}
```

Reads draft **Title** and **Canonical Text** from Workshop only. **Category** and **Scope** come from the promote payload (Trusted-only fields). Creates new Trusted rows, quarantines drafts, writes Change Log, revokes related grants.

---

## Chapter 1 UI states


| State                 | User sees                                                              | Clive/Pam see                              | Trusted access           |
| --------------------- | ---------------------------------------------------------------------- | ------------------------------------------ | ------------------------ |
| **locked**            | Brain name, maturity; “trusted context locked”                         | Workshop + public fallback only            | None                     |
| **key_requested**     | Agent asked to unlock; approval card with brain, scope, reason, expiry | “Waiting for you to approve the Brain Key” | None                     |
| **awaiting_approval** | Approve / Reject buttons (admin)                                       | Waiting                                    | None                     |
| **unlocked**          | “Brain unlocked for this task” + countdown                             | Approved snippets for current scope        | Grant-validated retrieve |
| **expired**           | “Key expired — request again”                                          | Blind again                                | None                     |
| **promotion_pending** | Doc handoff status                                                     | N/A                                        | Doc route only           |


`pam_challenge` exists elsewhere in Chapter 1 (canonical approval, Doc handoff) — **not** on Brain Key unlock.

State machine lives in `[website/src/lib/brains/ui-states.ts](../../website/src/lib/brains/ui-states.ts)`.

---

## Acceptance checks

Automated in `[website/src/lib/brains/guards.ts](../../website/src/lib/brains/guards.ts)` + `npm run test:brain-key`:

1. Clive/Pam routes cannot call trusted Airtable without `validateGrant()` passing.
2. `sanitizeForClient()` strips token-like strings from all API responses.
3. Interaction log rejects payloads containing `Bearer`  or env token patterns.
4. Retrieve without grant → 403.
5. Expired or over-used grant → 403.
6. Wrong `session_id` or `persona` on grant → 403.
7. Doc promote without `approvalDecisionId` → 400.

---

## Related

- [AIE build plan](./aie-build-plan.md)
- [Architecture](../business/architecture.md) — Clive drafts, Pam challenges, human approves, Doc acts; §7 four-base model; §9.2 minion routing
- [Doc Brain Base Builder](./doc-brain-base-builder.md) — runbook + live inventory
- [Brain upkeep](./brain-upkeep.md) — thin propose-only Needs Review loop

---

## Live Airtable bases (MCP-created 24–25 Jun 2026)


| Base                                   | ID                  | Purpose                                                            |
| -------------------------------------- | ------------------- | ------------------------------------------------------------------ |
| **AstraJax Brain Registry**            | `appbdTVHevH6Bl5ZZ` | Brains, **Agents**, Brain Key Requests, Access Grants, Change Log  |
| **AstraJax Brain Workshop**            | `appL2fdnGmhA02WXd` | Draft Brain Truth, interactions, Pam reviews, approvals, Doc queue |
| **AstraJax Trusted Brain — Chapter 1** | `app6tjzzG0L0lOeVb` | Brain Truth, Brain Memories                                        |
| **AstraJax Agent — Clive**             | `appBd9tudgvOSrhSX` | Narrative Arch, Persona Config, Persona Memories, Minions          |
| **AstraJax Agent — Pam**               | `appH7NeSSNntuKRL4` | same                                                               |
| **AstraJax Agent — Doc**               | `appI5tpwsKNwjfrqR` | same                                                               |
| **AstraJax Agent — Clive's Man**       | `appZ71CSKBlhnb4hR` | same                                                               |


**Schema blueprint (replicate from scratch):** `[brain-key-schema.md](./brain-key-schema.md)`  
**Live table IDs:** `[website/src/lib/brains/airtable-ids.ts](../../website/src/lib/brains/airtable-ids.ts)`  
**Builder initiative (status + runbook):** `[doc-brain-base-builder.md](./doc-brain-base-builder.md)`

**Seeded:** Chapter 1 registry row, Brain Truth seed records, four Agent bases (persona config + narrative arch), Clive's Man minions, Doc Agent base minion row **`doc-brain-base-builder`**, Brain Memories table.

**Matthew manual:** mint scoped PATs → Vercel env (see `doc-brain-base-builder.md` §11); add `doc` to Brain Key Requests Persona select if needed; delete **LEGACY Scope (delete in UI)** on Trusted Brain Truth when convenient.

**Repo follow-up:** wire `website/src/lib/brains/` to Agent bases for runtime persona memory (env vars `BRAIN_AGENT_{SLUG}_`*).