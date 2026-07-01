/**
 * Chapter 1 — interactive room narration (Acts 1–8).
 *
 * These pick up where Act 0 (the six-beat voiced welcome in
 * `welcome-sequence.ts`) leaves off, in the same format and voice: one short
 * spoken monologue per room plus a single title-card caption, ready to drop
 * into the cinematic engine.
 *
 * Each entry maps to a step in `LOOP_STEPS` (see `@/lib/aie-demo/types`).
 * Act 3 is the workshop draft beat — `business_brain` (Northline demo brief
 * after Brain themes); the curation interview is folded into that step, not a
 * separate generic team-interview room.
 *
 * Voice: Clive — warm, eager, lightly theatrical Victorian golden retriever.
 * Pam — sharp, fair challenger, witty, a little scary, never cruel.
 * Doc — practical engineer, plain-spoken, files things, keeps the paper trail.
 *
 * Claim discipline: no invented metrics, no overclaimed engineering depth.
 * Brains move Workshop draft → Trusted Brain only on human approval; Brain
 * Keys are scoped, time-limited, metered, and logged.
 */

export type RoomScript = {
  actId: number;
  step: string;
  speaker: "clive" | "pam" | "doc";
  monologue: string;
  caption: string;
};

export const ROOM_SCRIPTS: RoomScript[] = [
  {
    actId: 1,
    step: "user_brain",
    speaker: "clive",
    caption: "Who sits in the chair?",
    monologue: `So. The second chair is yours now, and before we build a single thing, I'd rather like to know who's in it. Not your title — how you actually work.

Where do you fly, where do you stall, how sure do you tend to feel, and how do you like a new thing explained? A few honest lines will do.

And let me be plain about why, because it matters: this is so the room can fit you, not measure you. It tells me when to slow down, and it tells Pam how hard to push. It isn't a test. There are no wrong answers — only yours.`,
  },
  {
    actId: 2,
    step: "brains_intro",
    speaker: "clive",
    caption: "Your themes. Light just one.",
    monologue: `Welcome to the Brain Vault — Iris tends the vats; Pam guards the gate. Nothing leaves trusted until it has earned it.

The list beside me is not the same for everyone. I recommend themes from what you told me about your sector — each vat is structured context for one domain you actually own.

The temptation is to light them all at once. Please don't. That is context bloat, and it makes every agent vague and far too sure of itself. Pick one — the function you know best, or the first brain your company genuinely needs. We'll make that one good before we glance at the rest.`,
  },
  {
    actId: 3,
    step: "business_brain",
    speaker: "clive",
    caption: "From raw notes to structured context.",
    monologue: `In we go, then — inside the vat you chose. This is the curation bench, where the real work happens.

For this demo I've assembled a workshop draft from a fictional field-sales team — Northline Field Ops. It's messy source material turned into structured context: sorted, labelled, each piece tied back to where it came from.

Nothing here is official yet — it's a draft on the bench, not truth on the wall. But it's beginning to look like something you could actually trust.`,
  },
  {
    actId: 4,
    step: "pam_challenge",
    speaker: "pam",
    caption: "If it survives Pam, it's stronger.",
    monologue: `Right. Clive's done the warm part. I do the useful part. I've read the draft, so don't flinch.

Here is how I work, every time. The strongest thing in here. The weakest assumption holding it up. The evidence that's missing. The rabbit hole someone is about to cheerfully fall down. Then — and only then — whether it's safe to send to Doc.

I'm not here to be unkind; I'm here so you don't automate a mistake at speed. If it survives me, it's stronger. If it doesn't, far better you hear it from me now than from someone who matters later.`,
  },
  {
    actId: 5,
    step: "human_decision",
    speaker: "clive",
    caption: "You decide, always.",
    monologue: `And here we are at the one step I cannot take for you. Pam has had her say, I've had mine — but what becomes Trusted is yours alone.

Stamp the draft, and it leaves the Workshop for the Trusted Brain: the approved context your agents are actually allowed to lean on. Or send it back, and nothing is lost — it simply waits for you.

I can suggest all day long. Only you approve. You decide, always.`,
  },
  {
    actId: 6,
    step: "doc_handoff",
    speaker: "doc",
    caption: "Approved. Filed. On the record.",
    monologue: `Doc here. You've approved it, so I'll file it. This part's quick.

Watch the flow: the approved brief moves out of the Workshop vat and into the Trusted vat, which seals behind it. The old drafts get set aside, so nothing stale gets relied on by mistake.

And it prints — who approved what, when, and why, on the record. That's your paper trail. Nothing to take on faith. Filed.`,
  },
  {
    actId: 7,
    step: "context_access",
    speaker: "clive",
    caption: "A scoped key, granted by you, logged.",
    monologue: `Now the Brain is trusted, an agent can ask to use it — but it can't simply help itself, and that's rather the point.

It requests a Brain Key: permission to read one specific slice of the Trusted Brain, for one specific task, for a limited time. Not a master key to everything forever — a narrow one, for this, for now. You grant it.

Every use is metered and logged, so you can always see who drew on what. Go on — grant it, and watch.`,
  },
  {
    actId: 8,
    step: "receipts",
    speaker: "clive",
    caption: "Your brain is alive. Next: cast your agents.",
    monologue: `There. Look at it — your Brain is alive. Trusted context, owned by you, that your agents can draw on safely and you can audit any time you fancy.

That's the whole loop, start to finish: I reason, Pam challenges, you choose, Doc files. Small, trustworthy, and unmistakably yours.

Next comes the fun part. We move to the studio, where you cast new agents — give each one a clear job, a personality if you like, and a Brain to stand on. But that, Architect, is a chapter for another day.`,
  },
];
