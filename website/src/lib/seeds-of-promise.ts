/** Seeds of Promise x AstraJax - Split story on Sage (#6E7B52) */

export const SEEDS_SAGE = "#6E7B52";
export const SEEDS_CREAM = "#F3EDDB";
export const SEEDS_CLAY = "#A95A2E";

export const seedsNavLinks = [
  { href: "#need", label: "The need" },
  { href: "#model", label: "Foundation" },
  { href: "#agentic", label: "Agentic layer" },
  { href: "#unlocks", label: "What it unlocks" },
  { href: "#malawi", label: "Proof" },
  { href: "#ask", label: "Fund" },
] as const;

export const seedsHero = {
  headline: "Turn access into agency.",
  summary:
    "A practical pilot for Seeds of Promise: connect the computer centre, capture the community context, then give local leaders narrow AI agents that turn questions into usable coaching, plans, and proposals.",
  image: {
    src: "/seeds-of-promise/hero-coaching-chalkboard.png",
    alt: "Matthew Hopkinson coaching community leaders at a chalkboard session in Malawi",
    caption: "AI coaching with community leaders, Malawi",
  },
  ctaPrimary: "Partner with us",
  ctaSecondary: "Read the plan",
  ctaSecondaryHref: "#model",
};

export type SeedsSplitRow = {
  id: string;
  eyebrow: string;
  headline: string;
  lead?: string;
  bullets?: string[];
  callout?: string;
  image: {
    src: string;
    alt: string;
    caption?: string;
  };
  imageSide: "left" | "right";
};

export const seedsNeed: SeedsSplitRow = {
  id: "need",
  eyebrow: "The need",
  headline: "Short of access, not ambition.",
  lead: "Seeds of Promise already has the rare ingredients: trusted leadership, a ready community, and a computer-centre vision. The missing layer is access that actually works.",
  bullets: [
    "Young people have limited routes into digital learning and guided practice",
    "Expert advice often means long journeys, scarce visitors, or word of mouth",
    "Farming, greenhouses, tailoring, and fundraising need specialist support",
    "Generic tech training rarely fits the language, culture, or local constraints",
  ],
  callout:
    "The problem is not lack of vision. It is that knowledge, coaching, and specialist support are too far away from the people who could use them.",
  image: {
    src: "/seeds-of-promise/need-workshop-audience.png",
    alt: "Community leaders seated for an AI workshop in Malawi",
    caption: "Community workshop, Malawi",
  },
  imageSide: "left",
};

export const seedsModelRows: SeedsSplitRow[] = [
  {
    id: "model",
    eyebrow: "Layer 1 - Infrastructure",
    headline: "Make the computer centre usable.",
    lead: "This is the part funders can see immediately: a specific community in Malawi has the will and the space. The pilot helps make that space reliable enough for learning and work.",
    bullets: [
      "Connectivity, likely Starlink or the best local option",
      "Power resilience, including solar where needed",
      "Usable laptops, tablets, routers, and supporting equipment",
      "A maintainable computer-room setup with clear local ownership",
    ],
    image: {
      src: "/seeds-of-promise/model-computer-room.png",
      alt: "Seeds of Promise computer room with desktop workstations",
      caption: "Existing computer centre - ready for the next layer",
    },
    imageSide: "right",
  },
  {
    id: "model-context",
    eyebrow: "Layer 2 - Context",
    headline: "Codify the local reality.",
    lead: "Once the room works, AstraJax does the work that makes AI useful: collecting the context that a generic tool will never arrive with.",
    bullets: [
      "Train local champions who can own the day-to-day use",
      "Capture real goals, available resources, local language, costs, and constraints",
      "Translate outside expertise into examples the community can actually use",
      "Keep people in control, with AI supporting rather than replacing judgement",
    ],
    callout:
      "This is the AstraJax connection: the foundation changes, but the principle does not. Structure the work. Structure the context. Then let agents use both.",
    image: {
      src: "/seeds-of-promise/model-workshop-flipchart.png",
      alt: "Facilitators leading a community planning session at a flipchart",
      caption: "Understanding context before building agents",
    },
    imageSide: "left",
  },
];

export const seedsAgenticLayer: SeedsSplitRow = {
  id: "agentic",
  eyebrow: "Layer 3 - Agentic support",
  headline: "A small specialist layer, shaped around Seeds.",
  lead: "The unique layer is not a chatbot and not a one-off training day. It is a set of narrow, context-aware agents that local champions can use for specific jobs.",
  bullets: [
    "A learning coach that helps young people practise questions, digital skills, and explanations at the right level",
    "A greenhouse and farming coach grounded in local crops, climate, resources, and project goals",
    "A fundraising agent that can turn a Chichewa or English idea into donor updates, proposals, and pitch material",
    "A small-enterprise planner for tailoring, pricing, stock thinking, and simple business plans",
    "A community-leadership planner that helps elders compare options, prepare meetings, and structure decisions",
  ],
  callout:
    "The agents do not replace local leaders. They bring the specialist closer, ask better questions, and package guidance in a form the community can act on.",
  image: {
    src: "/seeds-of-promise/coaching-outdoors.png",
    alt: "Matthew Hopkinson and a community leader during an outdoor coaching session",
    caption: "Coaching shaped around local context",
  },
  imageSide: "right",
};

export const seedsDifferentiators = [
  {
    title: "Not generic AI training",
    body:
      "Training teaches people what AI is. The agentic layer gives them practical helpers for real jobs: learning, farming, fundraising, enterprise, and leadership.",
  },
  {
    title: "Not loose chatbot access",
    body:
      "Each agent is narrow, grounded in approved local context, and designed around human judgement. It proposes, explains, and coaches - people decide.",
  },
  {
    title: "Not Matthew as the bottleneck",
    body:
      "The goal is local champions using a toolkit that carries the method forward without waiting for the next visitor, Zoom call, or outside expert.",
  },
  {
    title: "The AstraJax proof in another setting",
    body:
      "In commercial teams, AstraJax turns messy work and scattered data into AI-ready operating systems. Here, the same method turns access, context, and trust into community-ready AI support.",
  },
];

export const seedsUnlocks: SeedsSplitRow = {
  id: "unlocks",
  eyebrow: "What it unlocks",
  headline: "Democratise context-aware education.",
  lead: "This is the practical version of the bigger promise: specialist support at the point of need, adapted to the person and the place.",
  bullets: [
    "Education - learning support and digital skills adapted to level and language",
    "Farming and greenhouses - guidance at the point of need, not a two-hour journey",
    "Fundraising - local vision shaped into proposals and donor-ready narratives",
    "Small enterprise - business planning and grant support for tailoring and local trade",
    "Community leadership - plans and options without waiting for external experts",
  ],
  callout:
    "Even when experts are willing to help, their advice often has to be translated across culture, language, resources, and lived reality. The agentic layer does that packaging work again and again.",
  image: {
    src: "/seeds-of-promise/unlocks-children-sunset.png",
    alt: "Children playing together at sunset in Malawi",
    caption: "Access to learning and tools for the next generation",
  },
  imageSide: "right",
};

export const seedsMalawiRows: SeedsSplitRow[] = [
  {
    id: "malawi",
    eyebrow: "Malawi",
    headline: "A known community with existing vision.",
    lead: "Seeds of Promise is not an abstract beneficiary. The relationship, the computer-centre vision, and the appetite for practical technology are already there.",
    bullets: [
      "Matthew visited in October 2025 and delivered an introductory AI coaching session",
      "Strong local appetite, with feedback that content needs deeper local adaptation",
      "Partnership with Links and trusted community leadership already in place",
      "The next step is validating the delivery model, not whether the community cares",
    ],
    image: {
      src: "/seeds-of-promise/malawi-community-event.png",
      alt: "Community event at Seeds of Promise with local leaders and youth",
      caption: "Seeds of Promise community gathering",
    },
    imageSide: "left",
  },
  {
    id: "malawi-proof",
    eyebrow: "Proof on the ground",
    headline: "Already more than an idea.",
    lead: "This work has started. What comes next is a focused pilot: connect, equip, capture context, build the first agents, train champions, and document the playbook.",
    bullets: [
      "Coaching sessions rooted in local setting, language, and community needs",
      "Training materials shared for continued use",
      "Computer-centre vision and leadership ready for the infrastructure layer",
      "A model that could travel through Links-connected partners if the pilot works",
    ],
    image: {
      src: "/seeds-of-promise/proof-community-group.png",
      alt: "Large group photo of Seeds of Promise community members and visitors",
      caption: "Seeds of Promise - October 2025",
    },
    imageSide: "right",
  },
];

export const seedsAsk = {
  id: "ask",
  eyebrow: "The ask",
  headline: "Fund the three layers: access, context, agents.",
  lead: 'This is not "fund AI in Africa." It is a concrete, relationship-rooted pilot at Seeds of Promise:',
  quote:
    "Help connect and equip a specific community in Malawi, then build the context-aware agent toolkit that supports education, farming, fundraising, local enterprise, and community leadership.",
  fundingItems: [
    "Starlink or local connectivity",
    "Solar or power resilience",
    "Laptops, tablets, routers, and supporting equipment",
    "Local context capture and champion training",
    "First agent toolkit design, testing, and handover",
    "Documentation, filming, and a repeatable playbook",
  ],
  closing:
    "Seeds of Promise x AstraJax is a living proof point for the bigger belief: AI becomes useful when it is grounded in real context, narrow enough to trust, and placed in the hands of people who already have the vision.",
  ctaPrimary: "Fund the pilot",
  ctaSecondary: "Back to AstraJax",
  gallery: [
    {
      src: "/seeds-of-promise/proof-team.png",
      alt: "Seeds of Promise team with laptop and camera equipment",
    },
    {
      src: "/seeds-of-promise/coaching-outdoors.png",
      alt: "Matthew Hopkinson and a community leader during an outdoor coaching session",
    },
    {
      src: "/seeds-of-promise/malawi-grove-session.png",
      alt: "Community members gathered under trees for a coaching session",
    },
  ],
};

export type ParallelLayer = {
  layer: string;
  title: string;
  body: string;
};

export const seedsParallelComparison = {
  id: "parallel",
  eyebrow: "Same method, different foundation",
  headline: "Three layers in parallel.",
  summary:
    "The foundation changes. The principle does not. AstraJax and Seeds of Promise both move from access to context to bounded agents.",
  principle:
    "Structure the work. Structure the context. Then let agents use both.",
  columns: [
    {
      title: "AstraJax",
      subtitle: "Commercial operating systems",
      layers: [
        {
          layer: "Layer 1",
          title: "The boring layer",
          body: "Clean data, clear workflows, trusted numbers, and role-scoped interfaces that turn messy operations into a system people can rely on.",
        },
        {
          layer: "Layer 2",
          title: "Context governance",
          body: "Clive keeps the operational context current: what the business does, how decisions are made, who approves what, and what agents are allowed to touch.",
        },
        {
          layer: "Layer 3",
          title: "Bounded agents",
          body: "Narrow agents propose, humans approve, and work executes with an audit trail. Useful AI on top of a foundation the team already trusts.",
        },
      ],
    },
    {
      title: "Seeds of Promise",
      subtitle: "Community pilot, Malawi",
      layers: [
        {
          layer: "Layer 1",
          title: "Infrastructure",
          body: "Connectivity, power, devices, and a usable computer centre with clear local ownership - the access layer that makes everything else possible.",
        },
        {
          layer: "Layer 2",
          title: "Local context",
          body: "Language, constraints, resources, community goals, and trained local champions - the reality a generic tool will never arrive with.",
        },
        {
          layer: "Layer 3",
          title: "Agentic support",
          body: "Narrow, context-aware agents for learning, farming, fundraising, enterprise, and leadership - specialist support packaged for the people who live there.",
        },
      ],
    },
  ],
};
