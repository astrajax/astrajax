export type CurationSittingBeat = {
  id: string;
  title: string;
  caption: string;
  monologue: string;
};

export const CURATION_SITTING_BEATS: CurationSittingBeat[] = [
  {
    id: "open",
    title: "Sit with Clive",
    caption: "Curate this brain's context — drafts, flags, and trusted truths.",
    monologue: `Right. Before we touch a single record, let me tell you what's on the docket for this brain. I'll walk you through the flagged conversations, the draft truths waiting in the Workshop, and anything Clive's Man spotted in intake. You confirm what gets filed; I propose, you decide. Pam may mutter from the corner, but she won't stop us in demo mode.`,
  },
  {
    id: "destinations",
    title: "Where things live",
    caption: "Workshop = drafts. Trusted Brain = approved context agents may use.",
    monologue: `Every action shows its destination before you confirm. Drafts land in the Workshop bench. Approved truths live in the Trusted Brain. Interactions queue in the Workshop review table. Nothing disappears — the paper trail keeps a receipt.`,
  },
];

export function buildDocketSummaryMonologue(input: {
  draftCount: number;
  flaggedCount: number;
  sourceDocCount: number;
  trustedCount: number;
}): string {
  const parts = [
    `${input.trustedCount} trusted truth${input.trustedCount === 1 ? "" : "s"}`,
    `${input.draftCount} draft${input.draftCount === 1 ? "" : "s"} waiting`,
    `${input.flaggedCount} flagged conversation${input.flaggedCount === 1 ? "" : "s"}`,
    `${input.sourceDocCount} source document${input.sourceDocCount === 1 ? "" : "s"} to mine`,
  ];
  return `Here's the docket: ${parts.join("; ")}. Ask me to summarise any item, propose a fix, or promote a draft when you're ready.`;
}
