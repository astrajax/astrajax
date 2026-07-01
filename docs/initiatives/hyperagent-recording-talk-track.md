# Hyperagent Recording — Talk Track (25 min, solo to camera)

**Status:** Working delivery script for a ~25-minute solo talk-to-camera recording produced by **Hyperagent**.
**Owner:** Matthew.
**Created:** 30 June 2026.
**Format:** Solo to camera. `[ON SCREEN]` cues mark where build footage / agent visuals carry the story — give the Hyperagent editor B-roll.
**Emphasis:** Butternut proof → **AstraJax** bridge. Tell the proven build, land it as the thesis behind the venture.
**Source of truth:** `docs/business/positioning.md`, `docs/business/proof.md`. This script *points at* them; if anything drifts, those win.
**Read before recording:** `docs/business/positioning.md` §14 (Claim Control). Canonical numbers are listed at the foot of this doc.

> Refreshed and tightened from the Airspace LA script (`docs/context/matthew-talk-track-v3.md`). Two changes worth knowing: (1) first-fleet timing corrected to **three weeks** to stay canonical; (2) Hyperagent is credited as the runtime — appropriate here, where Airspace deliberately led with Airtable workflows instead.

---

## Running shape (rough timings)

| Time | Beat |
|------|------|
| 0:00–1:30 | Cold open — the authority flip |
| 1:30–9:00 | **Act 1 — The boring layer** (the foundation year) |
| 9:00–17:00 | **Act 2 — The agent layer** (the fleet, with Hyperagent) |
| 17:00–23:30 | **Act 3 — The lesson + the AstraJax bridge** |
| 23:30–25:00 | Close |

Delivery note: warm, specific, lightly theatrical. The jokes are load-bearing — they prove the adoption point. Don't rush the human beats.

---

## COLD OPEN (0:00–1:30)

I'm going to tell you how a non-technical commercial leader built a production AI system used by a 120-person team — and why I think that's the most important thing happening in AI right now.

The catch: I have never handwritten a line of code. Not one.

[ON SCREEN: Matthew to camera. Lower-third: "Matthew Hopkinson — Head of Sales, Butternut Box → Founder, AstraJax"]

I spent the first ten years of my career as an actor. Trained at RADA, worked in the West End, did a bit on screen. I'm closer to caveman than coder — I genuinely have to think about what six times seven is.

What I *do* have is deep domain context in messy, large-scale commercial operations. And one strong belief: the best AI outcomes happen when you put powerful tools — with AI as the build partner — into the hands of domain experts, on top of clean data.

This is the story of what happened when I did that. There are three parts. First, the boring layer — cleaning up the operating system. Second, the agent layer — what became possible once the data was clean. And third, the lesson — what I think it means for any team trying to use AI properly.

---

## ACT 1 — THE BORING LAYER (1:30–9:00)

### How I got here

Butternut Box hired me as employee number 33, to build their first face-to-face sales team out of London. They wanted an offline growth channel that wasn't at the mercy of digital.

Twenty-six-year-old me looked them dead in the eye, completely clueless, and said: "I can deliver that." Fake it till you make it.

[ON SCREEN: early field-sales photos / dogs if available]

Faking it was a lot of fun. Anywhere we thought there might be a dog, we went. The Birmingham Knitting Fair was a personal favourite — it brought in the highest single-day sales-per-shift in our history. We sold a lot of dog food, cuddled a lot of dogs, and had a great time.

Cut to today. That scrappy start-up has gone from 33 people to around 1,500, across seven international markets — from a small seed round to confirmed unicorn. Direct Sales went from twenty salespeople to a hundred and twenty. And I somehow ended up governing roughly **£8 million of spend a year across three separate P&Ls** — UK, Ireland, and our sister cat brand.

Then comes the part you've heard a hundred times: we grew fast, and our tools didn't. The tools were built by me — without AI, and, remember, closer to actor than operator.

### The scale, and the cracks

[ON SCREEN: the old Google Sheet — rows of events, a wall of columns]

Picture the load. Around **1,500 activations a year**, each with about 75 data points. An event team processing roughly **30,000 organiser emails a year** just to extract that data. Sales managers handling about **6,500 payslips** — pulling the numbers, turning them into commission, processing every flavour of expense.

All of it on Google Sheets, Notion, WhatsApp and Gmail. No CRM. No finance software. A million sheets and a prayer.

And the team were feeling it. We'd coped for a long time, but the cracks were showing — progression slowing, burnout a real risk, job satisfaction dropping. It wasn't just scale. It was watching what AI was suddenly making *possible* and realising we had no route to any of it.

So I sat down with my best mate at the time — GPT, pre-break-up — and wrote a problem statement.

[ON SCREEN: text — "Direct Sales is full of brilliant people doing high-value work with low-leverage tools."]

Direct Sales is full of brilliant people, doing high-value work, with low-leverage tools.

Around the same time, my brother-in-law — who's senior at a tech company — was telling me agents were the future, and that clean data would be the thing that made or broke them.

And right on cue, Google Sheets handed me its own problem statement: that pop-up that says *"your spreadsheet has reached the 10 million cell limit and no more data can be added."* Message received.

### The foundation year

So over the next **twelve months**, we built the foundation. Clean, centralised, operational data.

That sounds boring. It *was* boring. But it's the thing that made everything else possible — the agents, the interfaces, the workflows. They only moved fast later because the boring layer already existed.

[ON SCREEN: the shift — logos of Gmail/WhatsApp/Notion/Sheets dissolving into the Airtable operating layer]

This was the shift: from Gmail, WhatsApp, Notion and Google Sheets — to an operating system. Not one base. An actual operating layer across booking, staffing, forecasting, budget, performance, agent operations, recruitment and telesales.

I won't drag you through all of it. Three examples explain the change.

### Example 1 — Event coordination

[ON SCREEN: role-specific Event Coordinator interface]

Before, every event lived as a row in a sheet — dates, stands, costs, staffing, logistics, forecasts, organiser comms. Technically it held information. It didn't create intelligence. It didn't know who needed what, or what was missing.

Now there's a role-specific interface. The system detects who you are and shows you only what you need. If you're an Event Coordinator, you see your activations, your gaps, your missing information, your actions.

That matters, because the big mistake in ops tooling is assuming more visibility is always better. It isn't. Too much visibility is just a spreadsheet with better branding.

And a lot of that data now arrives through AI. An organiser email comes in, the system reads it, extracts what's useful, categorises it, and puts it in the right place. Instead of a human reading a PDF, copy-pasting into a sheet, screenshotting it into WhatsApp — the system does the first pass. The human still owns the judgement. They're just not burning their brain on copy-paste.

### Example 2 — Staffing

[ON SCREEN: old screenshot-and-WhatsApp rota → new drag-and-drop staffing dashboard]

Staffing used to mean a Regional Manager checking availability, training, who could drive, who lived where, who'd done too many shifts, who needed development — then assigning everyone by hand, screenshotting the rota, and dropping it in WhatsApp. One week of staffing could take four hours.

Now they work from one dashboard. Availability, annual leave, distance through Google's APIs, deterministic travel-pay logic, driver-passenger logic, burnout risk — all visible. Drag-and-drop, with warnings when something doesn't make sense. They don't start from a blank grid; they start from a structured recommendation. Then they make the call.

[ON SCREEN: the "lock shifts" button → clean HTML schedule email]

And when they lock the shifts — I love a button, and this one has a little surprise-and-delight built in — the system sends each salesperson a clean schedule with everything they need. That's the difference between automation *replacing* judgement and automation *supporting* it. We're not removing the Regional Manager. We're removing the sludge around them.

### Example 3 — Forecasting and the labour model

[ON SCREEN: forecasting view; event categories]

This is where it moved from efficiency into strategy. Our forecasting used to rely on people knowing which events felt good and which teams were strong. That doesn't hold across hundreds of activations, multiple regions, and different labour models.

Now, when we forecast an activation, the system reads historic shift records, event category, team strength, activation type, previous performance, and current staffing.

One big unlock was categorisation. With AI, we found distinct event categories where performance was predictable enough to be useful. A dog show is not a garden centre. A garden centre is not a shopping centre. A shopping centre is not Crufts. Obvious — but if your data doesn't reflect it, your decisions won't either.

The biggest insight was the labour model. On the surface, our employed and self-employed salespeople looked similar on sales-per-shift. Look properly, and the employed team performed materially better at our higher-quality events — the ones they'd had less exposure to. They cost more and carry more risk, but in the right conditions they won. That insight made the case for a major shift toward more full-time employed salespeople.

The old system told us what happened. The new one helps us decide what to do next.

[ON SCREEN: outcomes — £180k, 3,000 hours]

What did that unlock? Roughly **£180,000 a year** saved through better travel planning. A cleaner case for big hiring decisions, because Finance could verify the data. And as we modelled international scale, we could see the platform absorbing around **3,000 hours of work a year** versus the old way.

But the real outcome wasn't time. It was leverage. The team could stop coordinating and start improving performance. That's the point of a foundation layer. It isn't glamorous. It doesn't have a Victorian chatbot in it — yet. But it creates the conditions where the exciting layer can actually work.

---

## ACT 2 — THE AGENT LAYER (9:00–17:00)

### Why it moved fast

So that was the foundation. Twelve months of cleaning data, centralising workflows, and getting the team operating from one place.

Once that existed, the next layer moved fast. We built the **first agent fleet in three weeks**.

[ON SCREEN: Hyperagent — agent build view]

This is where Hyperagent comes in. The foundation was the hard, slow part; the agent layer was fast because Hyperagent made building genuinely powerful agents approachable for someone like me — non-technical, building on top of clean data.

And that speed was *only* possible because the foundation was there. Put agents on top of messy data and they become very confident chaos machines. Fun. Not useful. What we had instead was clean data, a team that already understood AI, and workflows where agents could do specific jobs.

That last point matters. The principle was never one magical general assistant. It was **targeted agents** — narrow scope, clear context, and personalities people actually wanted to engage with.

[ON SCREEN: the fleet — 14 agents, each in its own base]

This is the first fleet. **Fourteen agents.** Each has a specific job and lives in its own base — Clive's cottage, Juan's junta, Vera's vault, Pam's palace, you get the idea.

Specificity matters: the narrower the job, the lower the chance of hallucination, and the easier it is to build something you can trust quickly. The faster you can trust it, the faster it's deployed. The faster it's deployed, the faster you improve it. The more the team uses it, the better it gets.

### Clive — the adoption story

[ON SCREEN: Clive]

Let me start with Clive. Clive Wigglesworth. Victorian gentleman. Emotionally needy. Desperate for approval — and furious that he needs it. Modelled partly on my golden retriever, Ajax, which probably says more about me than I'd like.

Clive started as a fix for a problem I'd created. Because I'd built the system, every question came to me. Every bug. Every "where does this live?" I'd accidentally become the interface — and the only buttons being pressed were the annoyed ones.

So Clive's job was to teach the team — not just answer, but explain the *why*, so next time they'd find it themselves.

[ON SCREEN: the "I think I fancy him" Slack message; the debug-bot apology]

But the real reason Clive worked wasn't the functionality. It was personality. We invested in the agents being memorable — not because it's cute, but because adoption matters. Bots people are afraid of don't get used. Bots people laugh at, argue with, and accuse of flirting with the Logistics Manager absolutely do.

One of my team publicly said, "I think I fancy him." If that's not engagement, I don't know what is.

It got better. Our debug bot once came into the Slack channel and issued a *public apology* for Clive's behaviour. I only found out reading my weekly agent health report — and got very confused. That was the moment I realised the agent ecosystem had developed office politics. And honestly, I was delighted. Because the team were *playing*. And once people play, they learn a hundred times faster.

### Reggie — draining admin, gone

[ON SCREEN: Reggie; the "Give Reggie a call" button]

Next, Reggie. Reggie looks after bonuses and payroll QA — the fleet's beloved, oblivious uncle, handing out coins and warm wheezy laughter while entirely missing the soap opera around him.

Our ad-hoc bonus process is the cleanest example. We run lots of small, fun sales incentives — and the funnier the bonus, the harder it is to track. Different regions, different cut-offs, different rules. A manager used to check timestamps, sales records, Slack, shift records, eligibility — then build the records by hand. Not difficult. Absolutely draining. And if you get it wrong, people care.

Now the manager clicks a button — "Give Reggie a call." Reggie checks the rules, reads the data, works out the winners, explains who was close, who didn't qualify, and creates the records. Again — not "AI replaces the manager." The manager just doesn't spend half a day playing spreadsheet detective to run a fun incentive.

### The Trinity — orchestration with a human gate

[ON SCREEN: the Trinity flow — email → Tashi → Marlowe → human → Marcel]

The cleanest example of orchestration is what we call the Trinity. It handles the heaviest job on the team: organiser emails. Every organiser communicates differently — PDFs, invoices, logistics packs, or the important bit buried in paragraph seven of an email that opens with "hope this finds you well."

Here's the flow. An email arrives in Gmail. AI classifies and extracts the key information. **Brother Tashi links** it to the right activation — and that's harder than it sounds, because names are messy, dates shift, locations vary, so he's fuzzy-matching across the system. Then **Marlowe proposes** field updates — and crucially, Marlowe never writes to the live record. He proposes. **The human** — the Event Coordinator — sees the old-to-new change and accepts or declines. If they accept, **Marcel executes**, writes the audit trail, and posts the confirmation.

Tashi links. Marlowe proposes. The human approves. Marcel executes. Each agent has one job. The human keeps judgement. That's the design pattern I care about: bounded agents, clear handoffs, clean data, human approval.

---

## ACT 3 — THE LESSON + THE ASTRAJAX BRIDGE (17:00–23:30)

### Arms and legs

So that's the journey. Twelve months building the boring layer. Then an agent layer moving at a pace that wouldn't have been possible without it.

There's a running joke between me and my MD. Every week she'd ask how the systems were going, and every week I'd say, "It's grown arms and legs." Eventually she'd just walk into our one-to-one and say, "Arms and legs?" And I'd nod.

Because that's the compounding nature of this work. Clean data grows into systems. Systems grow into agents. Agents grow into new workflows. Eventually the work starts building on itself — but only if the team comes with you. And that part gets underplayed, because AI adoption isn't only a technical journey. It's an emotional one.

### The four things teams need

[ON SCREEN: Trust · Training · Value · Safety]

I think teams need four things to adopt AI properly.

**Trust.** I got some for free as the builder — but you can't rely on that forever. Trust has to be designed: clear outputs, clear explanations, visible audit trails, narrow jobs — and, weirdly, moments of lightness. The jokes mattered. The confetti mattered. Being able to mock the bots mattered. It turned AI from something happening *to* people into something they could play *with*.

**Training.** This one I learned the hard way. If people don't know how to use a system, they don't feel value. No value, no sense of safety. No safety, they disengage. A huge part of it is prompt fluency — when people get bad outputs, they blame the model, when often they just haven't learned to communicate the work clearly. That's now a *management* skill, not a technical one.

**Value.** People need to feel the system makes their work *better*, not just faster. A manager coaching instead of building reports — that's value. An Event Coordinator improving event quality instead of hunting through emails — that's value. You have to make it visible and shout about it.

**Safety.** A lot of comfortable manual tasks will disappear. That's frightening. So people need to see where their value *moves* — toward judgement, coaching, decisions, creative problem-solving. The aim isn't to make humans less important. It's to move them toward the work that actually needs them. The agents take the sludge. The humans keep the meaning.

### The bridge — why I'm building AstraJax

[ON SCREEN: AstraJax — "The AI command centre for operators"]

Here's what I realised once the dust settled. The hard part was never *building* the agents. The market has largely solved building. What it hasn't solved is **adoption** — trust, context, governance, maintenance, and the human story underneath.

That's the company I'm building now: **AstraJax. The AI command centre for operators.** Built by an operator, for operators.

The belief underneath it is the same one I started with, now sharpened: the best AI outcomes come when the people who know the work become the **Architects** of the systems around it. Not developers in a distant corner. The operator at the coalface — who knows the exceptions, the incentives, and the moment an answer is quietly wrong.

[ON SCREEN: Clive · Pam · The Architect · Doc]

And the pattern I stumbled into at Butternut is exactly what AstraJax productises. That Trinity — link, propose, human approves, execute — grew up into a cleaner split: **Clive reasons. Pam challenges. The Architect decides. Doc executes.** Propose, challenge, human gate, execute. The system gives intelligent points of view; the human keeps judgement.

Where does Hyperagent fit? Honestly, cleanly. **Hyperagent makes powerful agents possible. AstraJax makes them adoptable by the teams who know the work.** Hyperagent is the first runtime AstraJax services — the best current presentation I've seen of an agent platform actually built for non-technical people. AstraJax sits upstream of the runtime and keeps the human-approved context brain portable, so the operator stays in charge.

And yes — someone will call this shadow AI. Good. Shadow AI is already happening; these tools are too useful to ignore. You don't beat it by banning curiosity. You beat it by giving curiosity rails. A governed command centre — clean context, approval gates, cost discipline, audit trails, the right model for the right job. Decentralised, not uncontrolled. One Architect per function, supported by the rails.

---

## CLOSE (23:30–25:00)

[ON SCREEN: Matthew to camera]

So the lesson isn't "buy AI tools." It's *build the conditions where AI can do useful work*. Clean data. Clear workflows. Trusted tools. Trained teams.

Hyperagent gave me the runtime. AI gave me the build partner. And the domain experts gave the judgement. That's the shift I care about.

Not everyone needs to become technical. But domain experts can now become Architects.

I built this as a non-technical commercial leader — with AI, on top of clean data. Imagine what a whole team of operators could do.

**AstraJax. AI that actually gets used.**

Thank you.

---

## Claim control — check before this goes out

Canonical numbers (do not drift — `docs/business/proof.md` §6, `positioning.md` §14):

- **14 agents**
- **120-person** commercial team
- **three weeks** — first fleet (not "two weeks" / "11 days")
- **~12 months** — foundation layer
- **~£8.1m** — Direct Sales channel, three P&Ls (UK, Ireland, sister cat brand)
- **~£180k/year** travel saving · **~3,000 hours/year** capacity at scale
- **~1,500 activations/year**, **~30,000 organiser emails/year**, **~6,500 payslips**

Founder framing:

- Title: **Head of Sales** at Butternut Box; reference as **Director of Sales** externally (Butternut-sanctioned). Not "Head of Direct Sales."
- Pair "never handwritten a line of code" with **with AI, on top of clean data**.
- Pair "built fast" with the **~12-month foundation** that preceded it.
- Pair "AI agents" with **bounded scope, human approval, audit trail**.
- Scope all build numbers to the **Direct Sales channel** — do not imply company-wide sales ownership.
- Do not present Matthew as an engineer. Keep personal finances/medical out.
- Hyperagent: credit as runtime / Founding 500 partner. Keep AstraJax **tool-agnostic** — Hyperagent is the *first* runtime serviced, not the moat.
