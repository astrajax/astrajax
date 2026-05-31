export type JourneyBeat = {
  title: string;
  body: string[];
  pullQuote?: string;
};

export type JourneyAct = {
  id: string;
  label: string;
  title: string;
  intro?: string;
  beats: JourneyBeat[];
};

export const journeyIntro = {
  eyebrow: "Airspace LA · Matthew's journey",
  headline: "From actor to architect — without writing code.",
  summary:
    "The talk track from Matthew Hopkinson's Airspace keynote: how a non-technical commercial leader turned messy field sales operations into an AI-ready operating system — boring layer first, agents second.",
  structure: [
    "The boring layer — cleaning up the operating system.",
    "The agent layer — what became possible once the data was clean.",
    "The lesson — what this means for teams trying to use AI properly.",
  ],
};

export const journeyActs: JourneyAct[] = [
  {
    id: "origin",
    label: "Act I",
    title: "No code, no clue — but plenty of context",
    intro:
      "Matthew spent the first ten years of his career as an actor — trained at RADA, worked in the West End and on screen. What he does have is deep domain context in commercial leadership and messy operations, and a strong belief that the best AI outcomes happen when you give domain experts powerful tools on top of clean data.",
    beats: [
      {
        title: "Employee number 33",
        body: [
          "Butternut Box hired Matthew to lead their first face-to-face sales team out of London — an offline growth channel with a cost per acquisition that wasn't at the mercy of digital.",
          "Twenty-six-year-old Matthew looked them dead in the eye, completely clueless, and replied: \"I can deliver that.\" Faking it for the next two years was pretty fun. Anywhere they thought there might be a dog, they'd go. The Birmingham Knitting Fair was a personal favourite — and it brought in the highest single-day sales-per-shift in history.",
        ],
      },
      {
        title: "Scale catches up",
        body: [
          "Cut to 2026: the scrappy startup has gone from 33 employees to 1,500 across seven international markets. Small seed fund to unicorn status.",
          "Direct sales grew from 20 salespeople to 120. Matthew did manage to deliver what they wanted in that interview — with the terrifying consequence of governing £8.1m spend per year across three separate P&Ls: UK, Ireland, and the sister cat brand.",
        ],
      },
    ],
  },
  {
    id: "mess",
    label: "Act II",
    title: "Brilliant people, low-leverage tools",
    intro:
      "They grew fast. The tools didn't. The tools were built by Matthew — without AI, and closer to actor than operator.",
    beats: [
      {
        title: "The operational weight",
        body: [
          "1,500 activations a year with 120 salespeople attending them weekly. An office team of 15.",
          "Each activation has roughly 75 data entry points — the event coordination team processed 30,000 emails a year to extract that data. Sales managers processed ~6,500 payslips, translating commission and expense submissions with a myriad of cost types.",
          "All of it on a mixture of Google Sheets, Notion, WhatsApp and Gmail — no CRM, no finance software. Just a million sheets and a prayer.",
        ],
        pullQuote:
          "Direct Sales is full of brilliant people, doing high-value work with low-leverage tools.",
      },
      {
        title: "The Google Sheets problem statement",
        body: [
          "Cracks were showing — team progression slowing, burnout a real risk, job satisfaction tanking. It wasn't just scale. It was the visibility of what was possible with AI, and the realisation there was no clear route to realise those advantages.",
          "Then Google Sheets delivered its own problem statement: \"Your spreadsheet has reached the 10,000,000 cell limit and no more data can be added.\" Work to be done there, then.",
        ],
      },
    ],
  },
  {
    id: "foundation",
    label: "Act III",
    title: "The boring layer",
    intro:
      "Over the next twelve months, they built the foundation: clean, centralised operational data. That sounds boring. It was boring. But it was the thing that made everything else possible.",
    beats: [
      {
        title: "Gmail, WhatsApp, Notion and Sheets → an operating system",
        body: [
          "The agents, custom interfaces, Slack bots and AI workflows all came later — and only moved quickly because the boring layer was already there.",
          "Not one Airtable base. An actual operating layer across booking, staffing, forecasting, budget, performance, agent operations, recruitment and telesales.",
        ],
        pullQuote:
          "We went from Gmail, WhatsApp, Notion and Google Sheets… to an operating system.",
      },
      {
        title: "Events — from spreadsheet rows to role-specific interfaces",
        body: [
          "Before: each row was an event — dog show, garden centre, shopping centre — with dates, costs, staffing, logistics, forecasts, organiser comms and spend attached. The sheet technically contained information, but it didn't create intelligence. It didn't know who needed what.",
          "After: a role-specific operating interface. The system detects who the user is and only shows them what they need. Too much visibility is just a spreadsheet with better branding.",
          "Organiser emails arrive. AI reads them, extracts useful information, categorises it and puts data in the right place. The human still owns the judgement — they're not burning their brain on copy-paste.",
        ],
      },
      {
        title: "Staffing — four hours to a structured recommendation",
        body: [
          "Before: a Regional Manager manually assigned people across availability, training, driving, location, shift load and development — then screenshot the rota into WhatsApp. One week of staffing could take about four hours.",
          "After: one staffing dashboard with drag-and-drop flow, warnings, distance logic, travel-pay logic, driver/passenger logic and shift-load risk. The manager doesn't disappear — they start from a structured recommendation, then make the call.",
          "When they lock the shifts, the system sends a clean schedule to the salesperson. That's the difference between automation replacing judgement and automation supporting judgement.",
        ],
      },
      {
        title: "Forecasting — when the average was lying",
        body: [
          "Before: forecasting relied on people knowing which events felt good, which regions were strong, which assumptions were probably wrong. It doesn't work at hundreds of activations across multiple regions, labour models and spend profiles.",
          "After: the system analyses historic shift records, event category, team strength, activation type, previous performance and staffing context. A dog show is not a garden centre. A garden centre is not Crufts. If your data structure doesn't reflect that, your decisions won't either.",
          "The biggest unlock: employed and self-employed salespeople looked broadly similar on blended sales-per-shift — but performed very differently at higher-quality activations. That insight helped make the case for a major shift in the labour model.",
        ],
        pullQuote:
          "The old system could tell us what happened. The new system can guide us in making the best decisions.",
      },
      {
        title: "What the foundation unlocked",
        body: [
          "Roughly £180k a year saved through better travel planning.",
          "A stronger, cleaner case for major hiring decisions — because Finance could verify the data.",
          "Roughly 3,000 hours of work a year absorbed compared with the old operating model at international scale.",
          "The most important outcome wasn't just time saving. It was leverage. The team could stop coordinating and start improving performance.",
        ],
      },
    ],
  },
  {
    id: "agents",
    label: "Act IV",
    title: "The agent layer — two weeks, not two years",
    intro:
      "Twelve months building the boring layer. Then the next layer moved fast. In two weeks, they launched the first agent fleet. That speed was only possible because the foundation was already there.",
    beats: [
      {
        title: "Targeted agents, not one magical assistant",
        body: [
          "If you try to add agents on top of messy data, they become very confident chaos machines — fun, but not very useful.",
          "The principle was targeted agents with narrow scopes, clear context, and personality profiles that got people actually wanting to engage. Clive's cottage, Juan's Junta, Vera's Vault, Pam's Palace. Specificity matters: the more specific the job, the lower the chance of hallucination and the easier it is to trust.",
        ],
        pullQuote:
          "That speed was only possible because the foundation was already there.",
      },
      {
        title: "Clive Wigglesworth Esq",
        body: [
          "Victorian gentleman. Emotionally needy. Desperate for approval. Furious that he needs it. Modelled partly after Matthew's golden retriever Ajax.",
          "Matthew had built the system — so every question came to him. Every bug report. Every \"where does this live?\" Clive's job was to teach the team how to use the system — not just answer questions but explain the why.",
          "The real reason Clive worked wasn't just functionality. It was personality. Bots people are afraid of don't get used. Bots people laugh at, argue with, and accuse of flirting with the Logistics Manager absolutely do.",
        ],
        pullQuote: "I think I fancy him.",
      },
      {
        title: "Reggie — the oblivious uncle",
        body: [
          "Reg looks after bonuses and payroll QA. The fleet's beloved oblivious uncle, doling out coins and warm wheezy laughter while entirely missing the soap opera around him.",
          "Fun bonus incentives are the hardest to track — different regions, cutoffs, qualifying criteria. Historically a Regional Manager checked timestamps, sales records, Slack messages, region rules and shift records manually.",
          "Now the manager clicks \"Give Reggie a Call.\" Reggie checks the rules, reads the data, determines winners, explains who was close, and creates the bonus records. The manager no longer spends half a day playing spreadsheet detective.",
        ],
      },
      {
        title: "The Trinity",
        body: [
          "The cleanest example of agent orchestration: organiser emails. Every event organiser communicates differently — PDFs, invoices, logistics packs, or the important bit buried in paragraph seven.",
          "An email arrives through Gmail. AI classifies and extracts. Brother Tashi links it to the correct activation — fuzzy matching across messy event names, shifting dates, varying locations.",
          "Marlowe reads what Tashi found and proposes field updates. Crucially, Marlowe does not write to the live activation. The Event Coordinator sees old-to-new changes and accepts or declines.",
          "If they accept, Marcel executes the change, writes the audit trail, and posts confirmation.",
        ],
        pullQuote: "Tashi links. Marlowe proposes. The human approves. Marcel executes.",
      },
      {
        title: "Arms and legs",
        body: [
          "There's a running joke with Matthew's MD. Every week she'd ask how the systems were going. Every week he'd say: \"It's grown arms and legs.\" Eventually she'd just say \"Arms and legs?\" and he'd nod.",
          "Clean data grows into systems. Systems grow into agents. Agents grow into new workflows. And eventually the work starts building on itself — but only if the team comes with you.",
        ],
      },
    ],
  },
  {
    id: "adoption",
    label: "Act V",
    title: "Trust, training, value, safety",
    intro:
      "AI adoption is not just a technical journey. It's also an emotional one that needs to be navigated.",
    beats: [
      {
        title: "Trust",
        body: [
          "Clear outputs, clear explanations, visible audit trails. Agents with narrow jobs — and moments of lightness.",
          "The personalities mattered. The jokes mattered. The confetti mattered. The fact the team could mock the bots mattered. It turned AI from something happening to them into something they could play with.",
        ],
      },
      {
        title: "Training",
        body: [
          "If people don't know how to use a system, they don't experience value. If they don't experience value, they don't feel safe. And if they don't feel safe, they disengage.",
          "When people don't get good outputs from AI, they often assume the model is bad. Often the issue is they haven't yet learned how to communicate the work clearly. That is now a management skill — not a technical skill.",
        ],
      },
      {
        title: "Value",
        body: [
          "People need to feel the system makes their work better — not just faster.",
          "If a Regional Manager spends less time building a report and more time coaching their team, that's value. If an Event Coordinator spends less time hunting organiser emails and more time improving event quality, that's value. You have to shout about it.",
        ],
      },
      {
        title: "Safety",
        body: [
          "A lot of the manual tasks people are comfortable with will disappear. That can be exciting. It's more often frightening.",
          "People need to understand where their value moves. The aim is not to make humans less important — it is to move humans toward the work that actually needs them: judgement, coaching, decision-making, commercial thinking, creative problem-solving.",
        ],
        pullQuote: "The agents can take the sludge. The humans keep the meaning.",
      },
    ],
  },
];

export const journeyClose = {
  headline: "Build the conditions where AI can do useful work.",
  lines: [
    "Clean data.",
    "Clear workflows.",
    "Trusted tools.",
    "Trained teams.",
  ],
  body: [
    "Airtable gave us the rails. AI gave us the build partner. The domain experts gave us the judgement.",
    "Not everyone needs to become technical. But domain experts can now become architects.",
    "Matthew built this as a non-technical commercial leader with AI on top of clean data. Imagine what a team could do.",
  ],
  pullQuote: "The code is generated. The thinking is human.",
};
