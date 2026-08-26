---
name: agent-skill-craft
description: >-
  Diagnose and repair household skill bodies, When to Use, attachments, and
  Script files. Load on author, diagnose, or repair only. Not a Household
  Standard. Sibling of agent-prompt-craft.
---

# Agent skill craft

Diagnose and repair live skills for any household worker: whether attached
skills are needed, whether When to Use and Description tell the truth, whether
the System Prompt instructs their use, whether Documentation is fit, and
whether Script files match the skill.

This is not a Household Standard. Load it only when authoring, diagnosing, or
repairing a skill. Doc operates repairs. Workshop Proposer uses it while
authoring packs. Halvard may use it to diagnose skill-health symptoms but does
not operate the repair.

Sibling: **Agent prompt craft** (`agent-prompt-craft`) owns System Prompt
identity. This skill owns skill records. If the defect is the prompt, pack a
Head or Minion Action via prompt craft. If the defect is the skill, pack a
Skill or New skill Action here. One Action owns one surface.

## Scope

This skill governs skill-body craft and skill-repair packs. It does not by
itself authorise a live config change or a change to tools, integrations,
credential scope, resource scope, action allowlists, autoSave, learning flags,
execution mode, schedules, email, webhooks, Slack, or live mode.

Register Skills (`appPrpfvsAr71RPP3` / `tblAIXtDBBMrLuEYc`) is the design
original. The Workshop Skills catalog is a synced overlay, not the original.
Git `.cursor/skills/<slug>/` and HyperAgent skill config are checkouts.

A short skill is not automatically good. A long skill is not automatically
bad. The defect is misplaced, duplicated, stale, conflicting, unused, or
unverifiable instruction, or a script that does not match the body.

## Grain

| Layer | Owns |
|---|---|
| Household Register Skill | When to Use, Description, Documentation, Script, Script files, Scripts / Repo Path, and complete holder set. |
| Member Skills link | Reciprocal view of the Register Skill's holder set. Attachment is not proof of need. |
| System Prompt | Names standing load requirements only when runtime loading is insufficient; does not restate skill method. Attachment plus verified preload/discover behaviour may be enough. Prompt defects belong to agent-prompt-craft. |
| Script / Script files / repo path | Runnable method. Prefer repo path when git is canonical; attachments for bundles not in git; inline Script only for small single files. |
| Draft/version records | Changelog, hashes, and lineage. Never the skill's mouth. |

## Evidence required

For a live diagnosis, build a source ledger before judging:

**1.** Read the target Household Register Member: mandate, System Prompt, and
linked Skills.

**2.** Read each linked Register Skill: When to Use, Description,
Documentation, Script, Script files (`fldF1z1dtbiZcWnT6`), Scripts / Repo Path,
and complete holder set.

**3.** Read the repo twin at a named commit when Scripts / Repo Path is set
(`.cursor/skills/<slug>/SKILL.md` and any `scripts/`).

**4.** Read effective runtime skill attachment and loading behaviour when
accessible (HyperAgent skill list plus skill load mode/scope; Cursor skill
files and discovery rules). Mark UNVERIFIED if a surface cannot be read.

**5.** Record baseline, candidate, record IDs, attachment filenames,
commit/version identifiers, and the intended complete holder set.

A synced overlay, export, git file, or chat paste may be evidence. None
silently substitutes for the Register Skill row.

## Diagnose

A hit opens an inspection, not an automatic rewrite. Repair only when the
evidence shows a material effect on behaviour, safety, maintainability, or
runtime parity.

For every hit, quote the smallest exact passage, name its current owner, name
the proper owner, and state the consequence.

### Attachment need

**1. Orphan attachment**: a linked skill is never used by this worker's
mandate, When to Use does not match the job, and the prompt does not load it.
Remove that worker from the intended holder set. Do not delete the skill unless
separate estate-wide evidence shows that the skill itself is unused.

**2. Missing attachment**: the mandate or prompt requires a method that exists
as a Register Skill or Household Standard but is not linked. Add the worker to
the intended holder set. If no covering Register Skill exists, classify New
skill rather than attaching a near-match.

**3. Wrong sibling attached**: Luwani, Lazlo, or a Household Standard is
attached where a different skill owns the job. Correct the holder set on the
actual skill record; do not change identity merely to justify the attachment.

Attachment-only repair uses the skill surface. For an existing skill, create a
complete Skill Draft linked to that Register Skill, preserve the complete body
unless it also needs repair, and set the complete intended holder set. Compile
a Skill Action targeting that skill. For a genuinely new method, create a New
skill draft and Action with its intended holders. The reciprocal Member Skills
links are implementation consequences of applying that holder set; there is no
separate or invented Member-link Action. A prompt-load defect remains a
separate Head or Minion Action through agent-prompt-craft.

### When to Use and Description

**4. Load-trigger mismatch**: When to Use does not state when to load the
skill, or restates the whole Documentation.

**5. Description drift**: Description, YAML `description` in the repo twin,
and When to Use disagree about the job.

**6. AI-summary treated as source**: Suggested When to Use (AI) or Skill
Summary (AI) is treated as canonical. Human Description and When to Use win.

### Prompt instruction

**7. Required load path missing**: a required attached skill is neither
preloaded nor discoverable under the verified runtime configuration, or the
System Prompt contradicts its use. An attached skill in confirmed preload or
discover mode with a truthful When to Use is not defective merely because the
prompt omits its name. If prompt text is genuinely required, pack a
prompt-craft Head or Minion Action. If the skill record or holder set is also
wrong, use a separate Skill or New skill Action.

**8. Prompt restates the skill**: identity copies session start, routing tables,
or apply steps from Documentation. That is prompt craft hit "procedure
duplicated." Split the repair: use this skill only when the skill body or
holder set is also wrong.

### Documentation quality

**9. Changelog in the mouth**: version stamps, packing-label record IDs, or
merge history in Documentation.

**10. Verbosity without method**: length that does not add a diagnosable step,
eval, or never-rule. Fat is a symptom; the cause is mechanics in the wrong
layer or duplicated standards.

**11. Household standards copied**: Communication, Conduct, Routing, or
Activity Logging is restated instead of referenced.

**12. Frozen roster or cast fence**: mutable destinations or named not-lists
that belong in routing or identity.

**13. Orphan risk**: text proposed for removal with no remaining skill, prompt,
script, or machine field owning the behaviour.

**14. No eval floor**: a method skill has no capability and boundary tests when
the job is diagnosable. Authoring-time floor is at least five capability and
at least three boundary tests for new packs; live repair adds them when missing
and material.

### Scripts

**15. Claimed script missing**: Documentation or Script field describes a
runner that is not in Script files and not at Scripts / Repo Path.

**16. Attachment/repo drift**: Script files bytes disagree with the git path,
or multiple copies exist with no named canonical source.

**17. Script/docs mismatch**: the script's behaviour does not match
Documentation, such as wrong table IDs, a different gate, or a missing safety
stop.

**18. Secrets in script or attachment**: tokens, `.env`, or credentials. Stop.
Do not copy them into a draft. Escalate as a Config or credential pack.

**19. Unsafe or unbounded script**: it writes live records, ticks Execute, or
has no dry-run or read-only path when the skill claims diagnosis.

**20. Inline Script used for a bundle**: large multi-file code is stuffed in
the Script long-text field instead of Script files or repo path.

## Decide the repair class

End the diagnosis in exactly one class per surface:

- **No repair**: evidence does not show a material defect.
- **Attachment repair**: an existing Register Skill's complete holder set is
  wrong. Pack a complete Skill Draft and a Skill Action. Do not invent a
  Member-link surface, and do not use Head or Minion merely to change the
  reciprocal Member Skills link.
- **Skill body repair**: When to Use, Description, and/or Documentation must
  change. Pack a Skill Action on the existing Register Skill.
- **Script repair**: Script, Script files, and/or repo twin must change. Use the
  same Skill Action when it is the same skill; do not mix a different skill.
- **New skill**: required method has no covering Register row. Pack a New skill
  Action with the complete intended holder set.
- **Prompt instruction**: the verified runtime cannot preload or discover a
  required attached skill, or prompt text contradicts the skill and a prompt
  change is the correct repair. Pack through agent-prompt-craft as Head or
  Minion. Do not add a prompt line when runtime loading already makes the skill
  available, and do not hide a real prompt edit in a Skill Action.
- **Config escalation**: secrets, machine fields, or credential scope are the
  defect. This is not prose or script polish.

When more than one class affects different surfaces, split the Actions and cite
the dependency between them. A clean skill must be able to pass without a
slimming condition.

## Repair

Before drafting, inventory the baseline: When to Use, Description,
Documentation behaviour, script entrypoints, attachment filenames, repo paths,
and complete holder set.

Map every material baseline instruction to keep, move to another skill, move to
the prompt through prompt craft, move to version history, or remove as proven
redundancy. No safety-critical behaviour may disappear unmapped.

Write complete resulting bodies, never deltas. For attachment repair, preserve
the body byte-for-byte unless a separately evidenced body defect exists, and
change only the complete intended holder set. Hash every body.

Do not populate Cursor Prompt fields.

## Pack for Execute (done state)

A diagnosis memo is not done. When the repair class is not **No repair** and
not **Config escalation**, the operator creates the pack before stopping:

**1.** Create the complete Skill Draft (`tbluQsETnYKUFacc1`). For an existing
skill, link the target Register Skill and include its complete intended holder
set. For a new skill, leave the target skill empty and include all intended
holders. Keep Status Pending Approval. Write Dump Body Hash and Repo Path.

**2.** Create the Agent Update Action (`tbl1ptiU1zIRDbPeK`) citing draft record
ID, Version, and hash. Use Surface Type Skill for an existing Register Skill or
New skill for a genuinely new one. Keep Execute off and Status Pending Review.
Never invent a Member-link Action.

**3.** If System Prompt text must change, create a separate complete Household
Member Draft and Head or Minion Action under agent-prompt-craft. Do not put
prompt text into the Skill Action.

**4.** Create a Decision row when Proposer triggers fire, such as naming,
credentials, or blast radius. Leave it Pending Approval. Do not tick Execute.
Do not ask Matthew to set a draft Status to Approved.

**5.** Dispatch Workshop Challenger to read the draft row. Then stop. Matthew's
Execute tick is the release. Do not apply live. Do not Skill Forge until drain
after Execute.

## Control-plane procedure

**1.** Build the source ledger.

**2.** Run Diagnose and assign a repair class per surface.

**3.** Draft complete replacement bodies, complete intended holder sets, and
the behaviour map.

**4.** Pack drafts and Actions as in Pack for Execute. Keep live records
untouched.

**5.** Keep Execute off. Challenger reads the draft. A Challenger V2 becomes
the current candidate.

**6.** Workshop Execute tick is the single drain gate. Chat is not a second
gate. Decision rows still block while Pending Approval.

**7.** Drain applies only the cited current candidate. Read back hash, holders,
Documentation, Script files, and repo twin. On mismatch, stop.

## Hash contract

Canonicalise a draft body as Unicode NFC, UTF-8, LF line endings, no trailing
spaces, and exactly one terminal newline. Store
`sha256:<lowercase hex>` of those bytes.

After any edit, re-read the Airtable body, canonicalise it again, and update
both the draft hash and every Action citation. A local pre-write hash is
provisional until Airtable readback matches it.

Do not use markdown `1. 2. 3.` ordered lists in Documentation. Airtable rich
text rewrites them. Use `**N.**` markers.

## Script QA method

Read scripts before any execution. Do not run them against live estate data
unless the skill itself defines a bounded read-only verifier. Local static
checks and fixture tests are allowed when they cannot reach live data.

**1.** List Script files attachments and Scripts / Repo Path.

**2.** Confirm Documentation names the same entrypoints and canonical source.

**3.** Scan for secrets. Any hit is Config escalation.

**4.** Compare behaviour to Documentation, including IDs, gates, dry-run, error
handling, and write boundaries.

**5.** If git is canonical, treat any attachment as a checkout and flag drift.

## Boundaries

- Agent prompt craft owns System Prompts. Cross-dispatch; do not copy its
  diagnose list here.
- Luwani coaches humans. This skill repairs household skill records.
- Halvard may cite this skill; Doc operates.
- Workshop Challenger challenges the pack; it is not a second authoring loop
  after a complete V2.
- Household Communication, Conduct, Routing, and Activity Logging remain their
  own skills. Reference them.
- Field retirement, including Cursor Prompt and leftover tables, is Ruth's job.

## Critical evals

**1.** A worker with three unused attached skills returns **Attachment repair**
with quoted When to Use versus mandate evidence, preserves each skill body, and
packs Skill Actions with the corrected complete holder sets and Execute off.

**2.** When to Use that pastes the full Documentation returns the Skill body
repair class and a complete Skill Draft, not a delta.

**3.** A linked skill omitted from the System Prompt but verified as available
through runtime preload/discovery returns no prompt defect. The same skill when
neither loaded nor discoverable returns the Prompt instruction class and a
separate Head or Minion Action through agent-prompt-craft.

**4.** Documentation that copies Household Routing Standard returns a
skill-body repair that references the standard instead of copying it.

**5.** Script files missing while Documentation describes a runner returns
**Script repair**.

**6.** A secret in an attachment returns **Config escalation**, with no draft
that contains the secret.

**7.** A tight skill with matching When to Use, Description, verified runtime
load path, holder set, and repo script returns **No repair**.

**8.** A material class without an Action and draft, Execute off, fails this
skill's done state.

**9.** Airtable readback hash equals the draft hash and Action citation.

**10.** Markdown ordered lists are not used in Documentation.

**11.** An attachment-only defect cannot compile to an unsupported
"Member-link" surface or an identity Action. It compiles to Skill for an
existing Register Skill or New skill when the method does not yet exist.

## Acceptance

- A stranger can reproduce each finding from quoted evidence.
- Clean skills pass.
- Complete replacement bodies and holder sets are sufficient without "see
  chat".
- Prompt defects leave this lane through agent-prompt-craft; verified preload or
  discovery can satisfy the load path without a prompt edit.
- Script files, inline Script, and repo path have one canonical source.
- Attachment-only changes use the supported Skill or New skill surface and do
  not manufacture identity work.
- The operator stops only when No repair, Config escalation is filed, or the
  required Action and draft exist with Execute off.
