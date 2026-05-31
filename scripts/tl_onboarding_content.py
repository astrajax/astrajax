"""HTML modules for TL Onboarding table — distilled from positioning + ops brief.

AI-first note: AstraJax is AI-first in everything. Several modules teach Tara not
just *what* AstraJax is, but *how* to work the AstraJax way — asking "could AI do
this quicker or better?" before doing anything by hand.
"""

MODULES = [
    {
        "title": "Start here",
        "sort_order": 1,
        "section": "Start Here",
        "summary": "How to use this guide, the AI-first rule, and when to ask Matthew.",
        "read_time": 4,
        "essential": True,
        "html": """
<p class="lead">Welcome, Tara. This is your working handbook for AstraJax — not a memory dump. Read it in order once, then come back to any page when you need it.</p>

<h2>You are not here to become technical</h2>
<p>You will never have to write code or build databases. Your job is to make AstraJax's story <strong>clear, accurate, and safe to publish</strong> — and to do it the AstraJax way: with AI doing the heavy lifting wherever it can.</p>

<h2>The one rule that defines us: AI-first</h2>
<p>AstraJax is <strong>AI-first in everything</strong>. Before you do any task by hand, stop and ask:</p>
<blockquote><strong>"Could AI do this quicker or better?"</strong></blockquote>
<p>Most of the time the answer is yes — drafting, restructuring, summarising, comparing, formatting, first-pass research. Your value is in the judgement: the brief, the check, the taste, the "is this true and on-message?" Not the typing.</p>
<p>If you ever spot a faster or smarter way to do something, <strong>capture it</strong>: click <strong>Log an idea</strong> (bottom-right of this screen, always there). It saves straight to our AI Idea Log for Matthew to see. No idea is too small.</p>

<h2>How this guide works</h2>
<ul>
  <li>Pages marked <strong>★ Essential</strong> are the ones to read before you touch anything client-facing.</li>
  <li>Each page is short — 3–8 minutes. For a beginner, take your time; understanding beats speed.</li>
  <li>New to AI terms? Read <strong>AI in plain English</strong> early, and keep the <strong>Glossary</strong> (in Reference) open.</li>
  <li>Every page has a <strong>notes</strong> box and a <strong>Question for Matthew</strong> box at the bottom — use them freely.</li>
</ul>

<h2>When to ask Matthew (always fine to)</h2>
<ul>
  <li>Final positioning, pricing, or commercial strategy</li>
  <li>A public claim you're not sure is safe (numbers, founder story, technical scope)</li>
  <li>Anything that drifts toward "AI consultancy" or "Airtable build shop" language</li>
  <li>Anything that would need building (databases, automations, agents) — that's not your job</li>
</ul>

<blockquote><strong>Default rule:</strong> if you're smoothing over uncertainty, stop and ask. Clarity beats comfort, and asking is encouraged — not a sign you're behind.</blockquote>
""",
    },
    {
        "title": "Quick finder",
        "sort_order": 2,
        "section": "Start Here",
        "summary": "Which page to open when you're working on something specific.",
        "read_time": 3,
        "essential": True,
        "html": """
<p class="lead">Use the menu on the left like a handbook. Open the page that matches what you're doing right now.</p>

<p>Matthew keeps longer notes elsewhere. <strong>What you need for launch work is all here.</strong> If something important changes, he'll update these pages and tell you.</p>

<table>
  <thead><tr><th>I'm working on…</th><th>Open this page</th></tr></thead>
  <tbody>
    <tr><td>Getting comfortable with AI words and ideas</td><td><strong>AI in plain English</strong>, then the <strong>Glossary</strong></td></tr>
    <tr><td>Understanding the business and Matthew's story</td><td><strong>What AstraJax is</strong></td></tr>
    <tr><td>Offers, who we sell to, how we work</td><td><strong>What we sell</strong>, <strong>Who we help</strong>, <strong>The AstraJax method</strong></td></tr>
    <tr><td>The Butternut case study or proof numbers</td><td><strong>Butternut Box proof</strong> (Airspace talk first; town hall is optional — earlier and shorter)</td></tr>
    <tr><td>Checking whether a claim is safe to publish</td><td><strong>Claim control</strong></td></tr>
    <tr><td>Using AI well (and what never to trust it with)</td><td><strong>Using AI in your work</strong></td></tr>
    <tr><td>Building the website narrative</td><td><strong>Website narrative brief</strong></td></tr>
    <tr><td>Writing the Butternut case study</td><td><strong>Case study blueprint</strong></td></tr>
    <tr><td>Drafting the audit one-pager</td><td><strong>Commercial OS Audit one-pager</strong></td></tr>
    <tr><td>Wording something well</td><td><strong>Copy patterns — good vs bad</strong></td></tr>
    <tr><td>Colours, tone, or a final check before something goes live</td><td><strong>Brand voice and QA</strong></td></tr>
  </tbody>
</table>

<p><strong>Stuck or missing context?</strong> Use <em>Question for Matthew</em> at the bottom of any page — don't guess. And if you spot a faster way, <strong>Log an idea</strong>.</p>

<h2>The line to keep in mind</h2>
<blockquote>AstraJax helps commercial teams turn domain expertise into AI-ready operating systems. Clive maintains the context environment those systems and agents rely on.</blockquote>

<h2>What AstraJax is not</h2>
<p>Not a generic AI consultancy, lead-gen agency, Airtable build shop, CRM installer, chatbot vendor, or "buy more AI tools" advisor.</p>
""",
    },
    {
        "title": "AI in plain English",
        "sort_order": 3,
        "section": "Start Here",
        "summary": "The AI words and ideas you'll meet here — explained simply, no jargon.",
        "read_time": 8,
        "essential": True,
        "html": """
<p class="lead">You're smart and curious about AI but new to using it properly. This page gives you the mental model and vocabulary so nothing else in this guide feels like code.</p>

<h2>What an AI model actually does</h2>
<p>A large language model (like ChatGPT or Claude) is, at heart, a very powerful <strong>pattern-matcher</strong>. It learned from a huge amount of text and predicts the most likely next words for whatever you give it. It isn't "looking things up" or "thinking" like a person — it's recognising patterns and continuing them, often with surprising creativity.</p>
<p>Two things follow from that, and they matter for your job:</p>
<ul>
  <li><strong>It can be confidently wrong.</strong> Its process is based on probability, not facts. It can invent a number or a source that looks perfectly real. This is why we <em>always double-check</em>.</li>
  <li><strong>The quality of what you get out depends on what you put in.</strong> Good context in → good answer out. Vague in → vague out.</li>
</ul>

<h2>The CRAFT prompt — your everyday tool</h2>
<p>The difference between a useless answer and a great one is usually the prompt. Use <strong>CRAFT</strong>:</p>
<table>
  <thead><tr><th>Letter</th><th>Means</th><th>Example</th></tr></thead>
  <tbody>
    <tr><td><strong>C</strong>ontext</td><td>Facts the AI needs</td><td>"AstraJax helps commercial teams turn domain expertise into AI-ready operating systems."</td></tr>
    <tr><td><strong>R</strong>ole</td><td>Who it should act as</td><td>"You are a sharp B2B copywriter."</td></tr>
    <tr><td><strong>A</strong>ction</td><td>The task</td><td>"Draft three homepage hero lines."</td></tr>
    <tr><td><strong>F</strong>ormat</td><td>How to lay it out</td><td>"A bullet list, each under 12 words."</td></tr>
    <tr><td><strong>T</strong>one</td><td>The voice</td><td>"Confident, warm, not corporate."</td></tr>
  </tbody>
</table>
<p>Handy tricks: ask <em>"What context should I give you to do this better?"</em> before the real task; say <em>"Give me specific sources for anything factual"</em>; and use strong words ("never", "exactly", "it is really important that…").</p>

<h2>Words you'll see in this guide</h2>
<ul>
  <li><strong>Boring layer</strong> — the unglamorous foundation: clean data and clear workflows. AstraJax's whole point is that this comes <em>before</em> clever AI.</li>
  <li><strong>AI-ready operating system</strong> — a business's work organised cleanly enough that AI can actually help with it.</li>
  <li><strong>Agent</strong> — an AI set up to do a specific job with limited, defined scope (not a chatbot you chat with).</li>
  <li><strong>Bounded</strong> — kept to a narrow, safe scope. We never let an agent loose on everything.</li>
  <li><strong>Human-in-the-loop</strong> — a person approves before anything important happens. AI proposes; a human decides.</li>
  <li><strong>Context</strong> — the background information AI needs to be useful. <strong>Clive</strong> is our product for keeping that context clean.</li>
  <li><strong>Trinity pattern</strong> — how our agents work: <em>link → propose → human approves → execute</em>.</li>
</ul>

<blockquote>You don't need to build any of this. You need to <strong>describe it accurately</strong> — and that's exactly what this guide trains you to do.</blockquote>

<h2>Training deck — AI × Seeds of Promise</h2>
<p>Example training deck on how AI got here, how models work, and how to use them well (CRAFT, context, double-checking). <strong>Not AstraJax-specific</strong> — general literacy that pairs with this page. Scroll through below, or open full screen in a new tab.</p>
<div class="tl-slides"></div>
""",
    },
    {
        "title": "What AstraJax is",
        "sort_order": 4,
        "section": "The Business",
        "summary": "Core thesis, problem, and why Matthew is the proof.",
        "read_time": 6,
        "essential": True,
        "html": """
<h2>Core thesis</h2>
<p class="lead"><strong>Stop running high-value work through low-leverage tools.</strong></p>
<p>AstraJax helps commercial teams turn messy workflows, scattered data, manual admin, and trapped know-how into <strong>AI-ready operating systems</strong> — built with the people who understand the work best.</p>
<p class="tl-resource-note">Plain version: we help businesses tidy up how they work so that AI can actually be useful to them — and we build it <em>with</em> their own experts, not over their heads.</p>
<blockquote>Domain experts do not need to become technical. With AI, they can become architects.</blockquote>

<h2>The problem we solve</h2>
<ul>
  <li>Work lives across Sheets, Slack, Gmail, WhatsApp, Notion — or people's heads</li>
  <li>Operators copy, chase, reconcile, and report instead of doing high-value work</li>
  <li>AI experiments fail because the data and workflows underneath aren't ready</li>
  <li>Heroic people hold the business together; the systems don't</li>
</ul>

<h2>Why AstraJax (the unfair advantage)</h2>
<p><strong>The founder is the case study.</strong> Matthew is a non-technical commercial leader (ex-actor, RADA; then Head of Direct Sales for a ~£8.1m channel). He has <strong>never handwritten a line of code</strong>. Working entirely with AI on top of clean data, he built a production operating system at scale.</p>
<blockquote>A non-technical commercial leader did this with AI, on top of clean data — so your domain experts can too.</blockquote>

<h2>Four hard-to-copy advantages</h2>
<ol>
  <li><strong>Operator credibility</strong> — he owned the P&amp;L the system served</li>
  <li><strong>Domain-expert architecture</strong> — real judgement turned into systems</li>
  <li><strong>Adoption culture</strong> — engineered, not hoped for</li>
  <li><strong>Maintainability</strong> — handover and feedback loops built in</li>
</ol>
""",
    },
    {
        "title": "What we sell",
        "sort_order": 5,
        "section": "The Business",
        "summary": "The hero offer, the Clive product layer, and a simple offer table.",
        "read_time": 5,
        "essential": True,
        "html": """
<h2>Two layers</h2>
<p><strong>AstraJax Consulting</strong> is the hero offer. <strong>Clive</strong> is the scalable product layer for teams already using AI agents (or who get there through AstraJax).</p>
<blockquote>AstraJax structures the work. Clive structures the context. Agents use both.</blockquote>

<h2>The offers at a glance</h2>
<table>
  <thead><tr><th>Offer</th><th>Who it's for</th><th>In one sentence</th></tr></thead>
  <tbody>
    <tr><td><strong>Commercial OS Audit</strong></td><td>Teams who sense they're losing time but don't know where</td><td>A diagnostic of where the team loses time, visibility, and leverage — with a roadmap.</td></tr>
    <tr><td><strong>Commercial OS Sprint</strong></td><td>Teams ready to build their first AI-ready layer</td><td>A done-<em>with</em>-you build of the first clean operating layer, with trained owners.</td></tr>
    <tr><td><strong>Domain Architect Enablement</strong></td><td>Teams whose experts want AI fluency</td><td>Coaching <em>inside</em> delivery so their people can shape and safely use AI.</td></tr>
    <tr><td><strong>Clive</strong></td><td>Teams already running agents</td><td>Keeps the context agents rely on clean, current, and trustworthy.</td></tr>
  </tbody>
</table>

<p class="tl-resource-note">You won't sell these. You'll describe them in assets. If a deliverable needs you to choose <em>which</em> offer to feature, that's a Matthew call.</p>

<h2>Clive naming</h2>
<p>Externally: <strong>Clive</strong>. Internally you may see "Clive 3.0" — same product, evolved from Matthew's internal ops assistant.</p>
""",
    },
    {
        "title": "Who we help",
        "sort_order": 6,
        "section": "The Business",
        "summary": "Buyers, pain signals, and strong-fit clients.",
        "read_time": 4,
        "essential": False,
        "html": """
<h2>Best-fit clients</h2>
<p>Commercial or operations-heavy teams where valuable work is trapped in messy systems.</p>

<h2>Typical buyers</h2>
<ul>
  <li>CEO / founder, COO, Managing Director</li>
  <li>Commercial / Sales Director, Head of Operations</li>
  <li>Revenue, transformation, or innovation lead</li>
</ul>

<h2>Strong-fit signals</h2>
<ul>
  <li>Company grew faster than its tools</li>
  <li>One or two operators hold too much context</li>
  <li>Team wants AI but doesn't trust the data</li>
  <li>Leaders need visibility, forecasting, or performance discipline</li>
  <li>High-value work but coordination-heavy — lots of approvals and manual checks</li>
</ul>
""",
    },
    {
        "title": "The AstraJax method",
        "sort_order": 7,
        "section": "The Business",
        "summary": "Six steps from mess to maintainable operating system.",
        "read_time": 5,
        "essential": True,
        "html": """
<p class="lead">If a term here is new, check <strong>AI in plain English</strong> or the <strong>Glossary</strong> first.</p>
<ol class="method-steps">
  <li><strong>Diagnose the mess</strong> — find where high-value work is trapped in low-leverage tools.</li>
  <li><strong>Build the boring layer</strong> — clean data, clear workflows, role-specific screens. Most of the real value (and work) lives here.</li>
  <li><strong>Turn domain experts into architects</strong> — translate their judgement into records, fields, statuses, rules, and approvals.</li>
  <li><strong>Add bounded agents</strong> — narrow scope, clear handoffs, human approval, audit trail. (Agents on messy data are confident chaos machines.)</li>
  <li><strong>Engineer adoption</strong> — Trust, Training, Value, Safety. Built into delivery, not sold as separate "AI culture coaching."</li>
  <li><strong>Hand over and maintain</strong> — ownership rituals, feedback loops, and context governance (that's Clive).</li>
</ol>

<blockquote>The boring layer makes the exciting layer possible.</blockquote>
""",
    },
    {
        "title": "Butternut Box proof",
        "sort_order": 8,
        "section": "Proof and Claims",
        "summary": "Flagship case study — numbers, sequencing, patterns, and Matthew's talks.",
        "read_time": 7,
        "essential": True,
        "video_url": "https://drive.google.com/file/d/1vegoNC4InDpXImLf8ocihm55ta_Qrq-I/view?usp=sharing",
        "html": """
<p class="lead">From Gmail, WhatsApp, Notion, and Google Sheets to an operating system.</p>

<h2>Airspace LA — live session (primary reference)</h2>
<p>Matthew's Butternut story at Airtable Airspace (LA) — about a year <em>after</em> the town hall below. This is the fuller narrative: boring layer, build, agents, outcomes. Use this as the <strong>main reference when shaping the case study</strong>.</p>
<p class="tl-resource-note">Delivery note (internal): Matthew was jetlagged and out of his depth on stage — the story is more complete than the performance.</p>
<div class="tl-youtube" data-id="CYiUcwwT7xw" data-title="Airspace LA — Butternut Box / Matthew Hopkinson"></div>

<h2>Butternut town hall — earlier internal recording</h2>
<p>Internal Direct Sales walkthrough from roughly <strong>two months into the build</strong> — about a year <em>before</em> Airspace, and <strong>much shorter</strong>. Not a long cut of the Airspace talk; an earlier chapter.</p>
<p>Watch if you want Matthew at his most natural as a presenter (no jetlag, not on a product stage). Useful for tone and energy — not for depth, final numbers, or case-study structure.</p>
<div class="tl-external-video" data-title="Butternut town hall — Matthew Hopkinson"></div>

<h2>Airspace slides</h2>
<div class="tl-slides" data-link-label="Open Airspace slides (PDF)"></div>

<h2>Scale (sanitised, canonical)</h2>
<ul>
  <li>~£8.1m Direct Sales channel, 3 P&amp;Ls</li>
  <li>~15 office FTE + ~90 field salespeople</li>
  <li>~64k annual acquisitions target</li>
</ul>

<h2>Sequencing (the lesson)</h2>
<ul>
  <li><strong>~12 months</strong> on the boring layer — data cleaning, system architecture (little/no code)</li>
  <li><strong>Then ~1 month:</strong> a fleet of custom screens and tools built fast</li>
  <li><strong>First agent fleet in 2 weeks</strong> — only possible because the foundation existed</li>
  <li><strong>None of it handwritten by Matthew</strong></li>
</ul>
<p class="tl-resource-note">Build detail (don't lead with this in public copy): ~9 production interface extensions, ~556 TypeScript files. It's true, but it reads as engineering bragging and pulls focus from the real point — a non-technical leader did this with AI. Mention only if someone technical asks.</p>

<h2>Measured outcomes</h2>
<ul>
  <li>~£180k/year travel savings</li>
  <li>~3,000 hours/year operational capacity at scale</li>
  <li>Labour-model shift driven by categorised data, not gut feel</li>
</ul>

<h2>Patterns that made it work</h2>
<ul>
  <li><strong>Trinity pattern:</strong> link → propose → human approves → execute</li>
  <li><strong>Adoption by design:</strong> training hub, sandboxes, leaderboards, characterful agents</li>
  <li><strong>Built to last:</strong> a governed bug → fix → ship → sign-off loop</li>
</ul>

<blockquote>Personality is not decoration — it is adoption infrastructure.</blockquote>
""",
    },
    {
        "title": "Claim control",
        "sort_order": 9,
        "section": "Proof and Claims",
        "summary": "What to say, what to pair, what never to over-claim.",
        "read_time": 6,
        "essential": True,
        "html": """
<h2>Lead with</h2>
<ul>
  <li>Matthew has never handwritten a line of code</li>
  <li>Built with AI, on top of clean data and ~12 months of foundation work</li>
  <li>The rare thing is <em>who</em>, <em>how</em>, and that it runs in production</li>
  <li>The hard part of useful AI is data, workflows, adoption, and maintenance</li>
</ul>

<h2>Always pair these</h2>
<table>
  <thead><tr><th>Say this</th><th>With this</th></tr></thead>
  <tbody>
    <tr><td>Never written a line of code</td><td>with AI, on top of clean data</td></tr>
    <tr><td>Built fast (~1 month of screens)</td><td>after ~12 months of boring-layer work</td></tr>
    <tr><td>AI agents</td><td>bounded scope, human approval, audit trail</td></tr>
  </tbody>
</table>

<h2>Do not over-claim</h2>
<ul>
  <li>Matthew is not an engineer</li>
  <li>Not novel computer science — it's a methodological win</li>
  <li>Not broad enterprise change-management or executive coaching</li>
  <li>Not an Airtable build shop or generic AI consultancy</li>
</ul>

<h2>Talk-track vs canonical numbers</h2>
<p>Rounded company-scale figures (e.g. "1,500 staff, 120 sellers, 7 markets") are fine for spoken narrative. For anything <em>written</em>, use the canonical Direct Sales numbers on the previous page.</p>

<blockquote><strong>AI + claims = danger zone.</strong> AI will happily invent a confident number. Never let an AI-drafted claim through without checking it against this page.</blockquote>
""",
    },
    {
        "title": "Your role and 60-day priorities",
        "sort_order": 10,
        "section": "Your Role",
        "summary": "What you own, what you don't, and what 'done' looks like.",
        "read_time": 6,
        "essential": True,
        "html": """
<h2>You focus on</h2>
<ul>
  <li>Organising assets and shaping the public case study</li>
  <li>Visual structure, polish, and website production support</li>
  <li>Airtable population and cleanup (within clear briefs)</li>
  <li>Research from clear briefs; formatting one-pagers and templates</li>
  <li>Draft material for Matthew to review</li>
</ul>
<p class="tl-resource-note">Remember the AI-first rule: for each of these, your first move is usually to brief an AI, not to start from a blank page.</p>

<h2>You do not own</h2>
<ul>
  <li>Final positioning, pricing, or commercial strategy</li>
  <li>Airtable architecture, automations, or AI agent design (building)</li>
  <li>Public-claims judgement or sales outreach</li>
</ul>

<h2>60-day priorities — and what "done" looks like</h2>
<table>
  <thead><tr><th>#</th><th>Priority</th><th>"Done" looks like</th><th>Escalate when…</th></tr></thead>
  <tbody>
    <tr><td>1</td><td>Positioning &amp; website narrative</td><td>A clear page-by-page draft Matthew can react to</td><td>You're unsure how bold a claim can be</td></tr>
    <tr><td>2</td><td>Butternut Box case study</td><td>A five-beat draft with checked numbers</td><td>A number or quote you can't verify</td></tr>
    <tr><td>3</td><td>Commercial OS Audit one-pager</td><td>A one-page draft a buyer could actually read</td><td>Scope/pricing/what's included</td></tr>
    <tr><td>4</td><td>AstraJax OS demo (in Airtable)</td><td>You've <em>organised/populated</em> demo content per Matthew's brief</td><td>It needs new tables/automations — that's a build, not yours</td></tr>
    <tr><td>5</td><td>Outreach &amp; ecosystem assets</td><td>Drafted, never sent without sign-off</td><td>Anything that goes to a real person</td></tr>
  </tbody>
</table>
<p class="tl-resource-note">Priority 4 note: a "demo" is a tidy, realistic example of an AstraJax operating system. You make it look good and read well — you do not architect it.</p>

<h2>Asset-specific notes</h2>
<p><strong>Website:</strong> sharper and less caveated than internal docs — it must land boring layer → AI usefulness → founder proof.</p>
<p><strong>Case study:</strong> carries narrative weight — before / boring layer / acceleration / outcomes / lesson.</p>
<p><strong>Audit one-pager:</strong> a practical diagnostic, not theoretical thought leadership.</p>
""",
    },
    {
        "title": "Using AI in your work",
        "sort_order": 11,
        "section": "Your Role",
        "summary": "The AI-first way of working — what to use AI for, and what to never trust it with.",
        "read_time": 7,
        "essential": True,
        "html": """
<p class="lead">This is the most important page for how you actually work day-to-day at AstraJax.</p>

<h2>AI-first is the default, not the exception</h2>
<p>Before any task, ask: <strong>"Could AI do this quicker or better?"</strong> If yes (it usually is), start there. You bring the brief, the judgement, and the final check. AI brings the speed.</p>
<p>This isn't about cutting corners — it's how we work, and it's literally the thing we sell. Living it makes you better at describing it.</p>

<h2>Green light — use AI freely (then check)</h2>
<ul>
  <li>First drafts of copy, sections, outlines</li>
  <li>Restructuring or tightening something you've written</li>
  <li>Tone and clarity passes ("make this warmer / sharper / simpler")</li>
  <li>Summarising Matthew's notes, videos, or briefs</li>
  <li>Comparing options, generating variations, brainstorming headlines</li>
  <li>Formatting — tables, bullets, one-pager layouts</li>
  <li>Research <em>within</em> sources Matthew has approved</li>
</ul>

<h2>Red light — never let AI decide these</h2>
<ul>
  <li><strong>Claims and numbers.</strong> AI invents confident, wrong facts. Every claim goes through <strong>Claim control</strong>.</li>
  <li><strong>Positioning and strategy.</strong> "What AstraJax is" is Matthew's call, not the model's.</li>
  <li><strong>"Make it sound more technical/impressive."</strong> That's how we drift into over-claiming.</li>
  <li><strong>Anything sent to a real person</strong> without Matthew's sign-off.</li>
</ul>

<h2>Your simple workflow</h2>
<ol>
  <li><strong>Brief it well</strong> — use CRAFT (see <em>AI in plain English</em>). Give it real context.</li>
  <li><strong>Generate</strong> — get a draft, then push it: "what's weak here?", "give me three sharper versions".</li>
  <li><strong>Check</strong> — run it past <strong>Claim control</strong> and the <strong>QA checklist</strong>.</li>
  <li><strong>Hand to Matthew</strong> — as a draft, flagging anything you're unsure about (use the Question box).</li>
</ol>

<h2>Spotted a faster or better way? Log it.</h2>
<p>Part of being AI-first is constantly noticing where AI could help. When you do, click <strong>Log an idea</strong> (bottom-right, always there) and capture it — a task AI could take over, a process to automate, a smarter prompt, anything. It goes straight to our AI Idea Log.</p>
<blockquote>Treat AI like a brilliant, fast, slightly unreliable junior: give it great instructions, use everything it produces, and never publish without checking.</blockquote>
""",
    },
    {
        "title": "Website narrative brief",
        "sort_order": 12,
        "section": "Your Role",
        "summary": "How the site should be structured, what each section does, and the tone.",
        "read_time": 6,
        "essential": True,
        "html": """
<p class="lead">Priority #1. The website has to make a stranger understand AstraJax in under a minute, and trust it.</p>

<h2>The story the site must tell, in order</h2>
<ol>
  <li><strong>Boring layer first</strong> — most AI fails because the foundation isn't ready.</li>
  <li><strong>AI becomes useful</strong> — clean data + clear workflows + bounded agents.</li>
  <li><strong>Founder proof</strong> — a non-technical leader built this in production, with AI.</li>
</ol>

<h2>A page structure to draft against</h2>
<table>
  <thead><tr><th>Section</th><th>Job of this section</th></tr></thead>
  <tbody>
    <tr><td>Hero</td><td>One line on what AstraJax does + a clear next step</td></tr>
    <tr><td>The problem</td><td>High-value work trapped in low-leverage tools</td></tr>
    <tr><td>The method</td><td>The 6 steps, simply (mess → boring layer → architects → bounded agents → adoption → maintain)</td></tr>
    <tr><td>Proof</td><td>Butternut — sequencing and outcomes (checked numbers)</td></tr>
    <tr><td>Offers</td><td>Audit / Sprint / Enablement / Clive, one line each</td></tr>
    <tr><td>Clive</td><td>The context product, in plain terms</td></tr>
    <tr><td>Close / CTA</td><td>Who it's for + how to start (usually the Audit)</td></tr>
  </tbody>
</table>

<h2>Tone rules</h2>
<ul>
  <li>Sharper and less hedged than internal docs — confident, not boastful</li>
  <li>Concrete over abstract: "turn messy spreadsheets into systems your team trusts", not "leverage AI synergies"</li>
  <li>Warm and human (Matthew's an ex-actor) — but never flippant about clients' problems</li>
</ul>

<h2>How to use AI here</h2>
<p>Brief an AI with the structure above + <em>What AstraJax is</em> + <em>Claim control</em>, and ask for draft section copy. Then check every claim, run the QA list, and bring Matthew options — not a finished site.</p>
""",
    },
    {
        "title": "Case study blueprint",
        "sort_order": 13,
        "section": "Your Role",
        "summary": "The five-beat structure for the Butternut story and how to fill it.",
        "read_time": 6,
        "essential": True,
        "html": """
<p class="lead">Priority #2. The case study carries the most narrative weight — it's the proof everything else leans on.</p>

<h2>The five beats</h2>
<ol>
  <li><strong>Before</strong> — the mess: Gmail, WhatsApp, Notion, Sheets; heroic people holding it together.</li>
  <li><strong>The boring layer</strong> — ~12 months cleaning data and designing the system (little/no code). This is the part most people skip — don't.</li>
  <li><strong>The acceleration</strong> — then it moved fast: a fleet of custom screens, first agents in 2 weeks. Fast <em>because</em> the foundation existed.</li>
  <li><strong>The outcomes</strong> — checked numbers: ~£180k/yr travel saved, ~3,000 hrs/yr capacity, labour-model shift.</li>
  <li><strong>The lesson</strong> — "the boring layer makes the exciting layer possible," and a non-technical leader did it with AI.</li>
</ol>

<h2>Where the personality fits</h2>
<p>The agent cast and adoption design (training hub, leaderboards) are <strong>proof of adoption</strong>, not decoration — "personality is adoption infrastructure." Use them to show <em>why</em> it stuck, not as a gimmick.</p>

<h2>Your sources, in priority order</h2>
<ul>
  <li><strong>Airspace LA talk</strong> (primary — fuller story)</li>
  <li><strong>Butternut town hall</strong> (earlier, shorter — tone/energy only)</li>
  <li><strong>Butternut Box proof</strong> page (canonical numbers)</li>
</ul>

<h2>How to use AI here</h2>
<p>Feed an AI the five beats + the proof page, ask it to draft each beat, then pressure-test: "which claims here need a source?" Verify every number against <strong>Claim control</strong> before it reaches Matthew.</p>
""",
    },
    {
        "title": "Commercial OS Audit one-pager",
        "sort_order": 14,
        "section": "Your Role",
        "summary": "What the audit one-pager is, its skeleton, and how it differs from Sprint/Clive.",
        "read_time": 5,
        "essential": True,
        "html": """
<p class="lead">Priority #3. The first real sales asset. It's a <strong>practical diagnostic</strong>, not thought leadership.</p>

<h2>What the Audit actually is</h2>
<p>A focused diagnostic that shows a team where they lose time, visibility, and leverage — and gives them a roadmap. It's the natural first step before any build.</p>

<h2>A skeleton to draft against</h2>
<table>
  <thead><tr><th>Section</th><th>What goes here</th></tr></thead>
  <tbody>
    <tr><td>The problem it solves</td><td>"You sense work is slow and scattered, but can't see exactly where."</td></tr>
    <tr><td>What we map</td><td>Workflows, data, tools, where knowledge is trapped, AI-readiness</td></tr>
    <tr><td>What you get</td><td>Workflow map, data/tool audit, AI-readiness assessment, prioritised roadmap, recommended sprint plan</td></tr>
    <tr><td>Who it's for</td><td>Commercial/ops-heavy teams that grew faster than their tools</td></tr>
    <tr><td>Next step</td><td>How to start, and what happens after the audit</td></tr>
  </tbody>
</table>

<h2>Don't blur the offers</h2>
<ul>
  <li><strong>Audit</strong> = diagnose &amp; plan</li>
  <li><strong>Sprint</strong> = build the first layer</li>
  <li><strong>Clive</strong> = keep the context clean once agents are running</li>
</ul>
<p>The one-pager is about the <em>Audit</em>. Mention the others only as "what comes next."</p>

<h2>How to use AI here</h2>
<p>Brief an AI with the skeleton + the offers table from <em>What we sell</em>. Get a tight draft, keep it to one page, and make sure it reads as practical and specific — not vague consultancy language. QA before Matthew sees it.</p>
""",
    },
    {
        "title": "Copy patterns — good vs bad",
        "sort_order": 15,
        "section": "Your Role",
        "summary": "Side-by-side examples so on-message wording becomes second nature.",
        "read_time": 5,
        "essential": False,
        "html": """
<p class="lead">A quick reference you can copy from. When in doubt, match the "good" column.</p>

<table>
  <thead><tr><th>Avoid</th><th>Prefer</th></tr></thead>
  <tbody>
    <tr><td>"We implement AI solutions for businesses."</td><td>"We turn domain expertise into AI-ready operating systems."</td></tr>
    <tr><td>"Matthew built 556 files of code."</td><td>"Built with AI on top of clean data — never hand-coded."</td></tr>
    <tr><td>"Leverage cutting-edge AI synergies."</td><td>"Make the data and workflows clean enough that AI is actually useful."</td></tr>
    <tr><td>"Our AI automates your business."</td><td>"Bounded agents take the sludge; your people keep the judgement."</td></tr>
    <tr><td>"Fast AI transformation in weeks."</td><td>"Months of foundation work made the fast build possible."</td></tr>
    <tr><td>"An AI consultancy."</td><td>"A partner that builds AI-ready operating systems with your experts."</td></tr>
  </tbody>
</table>

<h2>The patterns underneath</h2>
<ul>
  <li>Concrete beats abstract.</li>
  <li>Always pair speed with the foundation that earned it.</li>
  <li>Humans keep judgement; agents take the sludge.</li>
  <li>Never imply Matthew is an engineer, or that this is magic.</li>
</ul>
<p class="tl-resource-note">Great prompt to keep: "Rewrite this in AstraJax's voice — concrete, warm, confident, never over-claiming — and flag any claim that needs checking."</p>
""",
    },
    {
        "title": "Brand voice and QA",
        "sort_order": 16,
        "section": "Reference",
        "summary": "Messaging lines, colour direction, pre-publish checklist.",
        "read_time": 5,
        "essential": False,
        "html": """
<h2>Messaging principles</h2>
<ul>
  <li>The boring layer makes the exciting layer possible.</li>
  <li>Clean data first, clever agents second.</li>
  <li>Agents take the sludge; humans keep the meaning.</li>
  <li>Personality is adoption infrastructure.</li>
  <li>Adoption and maintenance are features, not afterthoughts.</li>
</ul>

<h2>Brand direction (Nocturne Orchard)</h2>
<p>Dark, warm, quietly futuristic — premium without corporate cold. Use these hex values in decks and web work:</p>
<table>
  <thead><tr><th>Colour</th><th>Hex</th><th>Use for</th></tr></thead>
  <tbody>
    <tr><td>Deep Moss</td><td><code>#202A1B</code></td><td>Primary background, hero sections</td></tr>
    <tr><td>Graphite Ink</td><td><code>#171A18</code></td><td>Nav, cards, modals, chrome</td></tr>
    <tr><td>Blueberry Black</td><td><code>#111423</code></td><td>Deep rails, footers — sparingly</td></tr>
    <tr><td>Parchment Dim</td><td><code>#E7D1AD</code></td><td>Body text on dark</td></tr>
    <tr><td>Buttermilk</td><td><code>#E4D3A3</code></td><td>Badges, key numbers, warm emphasis</td></tr>
    <tr><td>Burnt Apricot</td><td><code>#D77545</code></td><td>Human warmth, Clive/founder moments — not alerts</td></tr>
    <tr><td>Sage Signal</td><td><code>#9AA77A</code></td><td>Active, approved, live system states</td></tr>
  </tbody>
</table>
<p><strong>Avoid:</strong> neon cyan/teal, bright amber alerts, pure black/white blocks, generic AI-SaaS purple gradients.</p>

<h2>Pre-publish QA checklist</h2>
<ul>
  <li>Does it clearly say what AstraJax does?</li>
  <li>Clean data and workflows before agents?</li>
  <li>Founder proof without overclaiming engineering?</li>
  <li>Adoption and maintenance visible, not just the build?</li>
  <li>Not generic AI consultancy language?</li>
  <li>Proof numbers match the canonical list?</li>
  <li>Nothing too private, internal, or flippant?</li>
  <li>A clear next step or offer?</li>
</ul>
""",
    },
    {
        "title": "Glossary",
        "sort_order": 17,
        "section": "Reference",
        "summary": "Plain-English definitions for every term you'll meet here.",
        "read_time": 4,
        "essential": False,
        "html": """
<p class="lead">Click in here any time a word stops you. Nothing here is as complicated as it sounds.</p>

<table>
  <thead><tr><th>Term</th><th>Plain meaning</th></tr></thead>
  <tbody>
    <tr><td><strong>Agent</strong></td><td>An AI set up to do a specific, limited job — not a chatbot you converse with.</td></tr>
    <tr><td><strong>Agent fleet</strong></td><td>A group of agents, each with its own narrow job.</td></tr>
    <tr><td><strong>AI-ready operating system</strong></td><td>A business's work organised cleanly enough that AI can genuinely help.</td></tr>
    <tr><td><strong>Boring layer</strong></td><td>The unglamorous foundation — clean data and clear workflows — that everything else depends on.</td></tr>
    <tr><td><strong>Bounded</strong></td><td>Kept to a narrow, safe scope.</td></tr>
    <tr><td><strong>Clive</strong></td><td>AstraJax's product for keeping the context AI relies on clean and current.</td></tr>
    <tr><td><strong>Context</strong></td><td>The background information AI needs to give a good answer.</td></tr>
    <tr><td><strong>CRAFT</strong></td><td>A prompt recipe: Context, Role, Action, Format, Tone.</td></tr>
    <tr><td><strong>Domain expert</strong></td><td>Someone who deeply understands the actual work (sales, ops) — not necessarily technical.</td></tr>
    <tr><td><strong>Human-in-the-loop</strong></td><td>A person approves before anything important happens. AI proposes; a human decides.</td></tr>
    <tr><td><strong>Interface / screen</strong></td><td>A custom view built on top of the data so each role sees only what they need.</td></tr>
    <tr><td><strong>LLM</strong></td><td>Large Language Model — the kind of AI behind ChatGPT and Claude.</td></tr>
    <tr><td><strong>Prompt</strong></td><td>The instruction you give an AI.</td></tr>
    <tr><td><strong>Trinity pattern</strong></td><td>How our agents work: link → propose → human approves → execute.</td></tr>
    <tr><td><strong>Operating layer / OS</strong></td><td>The clean system a team runs their work on.</td></tr>
  </tbody>
</table>
""",
    },
]
