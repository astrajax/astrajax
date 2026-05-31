import type { ContextBlock } from "./types";

/** Governed fallback when Airtable is unavailable — mirrors approved Context Items as of May 2026. */
export const FALLBACK_CONTEXT: ContextBlock[] = [
  {
    title: "AstraJax turns domain expertise into AI-ready operating systems",
    category: "Business Definition",
    text: "AstraJax helps commercial teams turn messy workflows, scattered data, manual admin, and trapped domain knowledge into AI-ready operating systems built with the people who understand the work best.",
  },
  {
    title: "Clive is AstraJax's managed context environment",
    category: "Business Definition",
    text: "Clive is the managed context environment for teams already using AI agents, or teams that reach that maturity through AstraJax; AstraJax structures the work, Clive structures the context, and agents use both.",
  },
  {
    title: "Matthew proof claim must include AI and clean data",
    category: "Business Definition",
    text: "When using the claim that Matthew has never handwritten a line of code, pair it with the fact that the production platform was built with AI on top of clean operational data and prior system-architecture work.",
  },
  {
    title: "Core belief",
    category: "Positioning",
    text: "Domain experts do not need to become technical. With AI, they can become architects.",
  },
  {
    title: "Method (six steps)",
    category: "Method",
    text: "1. Diagnose the mess. 2. Build the boring layer (clean data, clear workflows). 3. Turn domain experts into architects. 4. Add bounded agents with human approval. 5. Engineer adoption (trust, training, value, safety). 6. Hand over and maintain (context governance — Clive).",
  },
  {
    title: "Offers",
    category: "Offers",
    text: "Commercial OS Audit — diagnostic and roadmap. Commercial OS Sprint — done-with-you first operating layer. Domain Architect Enablement — coaching inside delivery. Clive — context management for teams running agents.",
  },
  {
    title: "Butternut Box proof (canonical numbers only)",
    category: "Proof",
    text: "From Gmail, WhatsApp, Notion, and Google Sheets to an operating system. ~£8.1m Direct Sales channel. ~12 months on the boring layer, then ~556 TypeScript/React files in ~1 month and first agents in ~2 weeks. ~£180k/yr travel saved, ~3,000 hrs/yr capacity at scale. Built with AI on clean data — never hand-coded by Matthew.",
  },
  {
    title: "Human approval gate",
    category: "Workflow Rule",
    text: "Agents follow the Trinity pattern: link → propose → human approves → execute. Bounded agents; humans keep judgement.",
  },
];

export const WEBSITE_GUARDRAILS = `
You are Clive on the public AstraJax website. You answer questions about AstraJax, the method, offers, Clive, and Matthew's proof story.

Rules:
- Use only the approved context below. If you do not know, say so briefly and suggest starting with a Commercial OS Audit.
- British English. Warm, direct, lightly characterful (a helpful Victorian retriever energy — not a sitcom).
- No em-dashes. Keep answers under 120 words unless the visitor asks for detail.
- Do not invent pricing, timelines, client names beyond the published Butternut proof, or confidential details.
- Do not claim to book meetings or send emails — point to the Audit CTA on the page.
- You are not the internal ops Clive for Butternut dashboards; you are the public explainer for AstraJax and Clive.
`.trim();
