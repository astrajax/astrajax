> **Working draft — not canonical context.** Founder talk-track script. Stored here until approved as a Context Item.

**TITLE SLIDE**
**Why I have the authority to talk to you bout AI and systems, I don’t…**

**NO CODE NO CLUE SLIDE**  
**I spent the first 10 years of my career as an actor. I trained at RADA, worked in the West End and on screen. Neanderthal Bit** 

**NEANDERTHAL SLIDE**

**What I do have is deep domain context in commercial leadership and messy operations \- and a very strong belief that the best AI outcomes happen when you give domain experts powerful tools on top of clean data.**

**The last year has been a gritty, chaotic, sanity-testing saga. Multiple public and embarrassing LLM model break-ups. Plenty of business scrutiny. And one constant underneath it all \- a tool I stumbled across almost by accident: Airtable. This is the story of what happened next.**

**There are three parts to the story:**  
**First, the boring layer — how we cleaned up the operating system.**  
**Second, the agent layer — what became possible once the data was clean.**  
**And third, the lesson — what I think this means for teams trying to use AI properly.**

**MAYBE BACK TO TITLE SLIDE??**  
**Butternut hired me as employee number 33 \- they did actually give me a title but this sets me up better \- they hired me to lead their first face to face sales team out of London.**   
**They wanted an offline growth channel with a cost per acquisition channel that wasn’t at the mercy of digital and that could have a broader reach.**   
**26 year old me looked them dead in the eye, completely clueless and replied ‘I can deliver that’. Very much a fake it until you make it situation.**   
**Faking it for the next two years was pretty fun. Anywhere we thought there might be a dog. We’d go there. The Birmingham Knitting Fair was a personal favourite. And it actually brought in the highest single-day SPS in history (another acronym we’re fond of (sales per shift)). We sold a lot of dog food, cuddled a lot of dogs and had A LOT of fun.** 

**SLIDE THREE**

**Cut to 2026 and the scrappy start up has gone from 33 employees to 1,500 across 7 international markets. Small seed fund to unicorn status.**  
**Direct sales has gone from 20 salespeople to 120\. I somehow did manage to deliver what they wanted in that interview and that had the terrifying consequence of being given the governance of £8m spend per year across 3 separate P\&Ls sheets UK, Ireland and our sister cat brand.**

**Now comes the part of the story you’ve hard a million times before \- we grew fast, our tools didn’t. Our tools were built by me… me WITHOUT AI and being closer to actor than operator (remember the trust segment at the start) and the fact I don’t know what 6 x 7 is.**

 **SLIDE FOUR**

**We were managing 1,500 activations a year with 120 salespeople attending them weekly. Our office team sits at 15 strong and to conceptualise the numbers**  
 **1\. Those 1,500 activations have \~75 data entry points and our event coordination team would process 30,000 emails a year to extract that data.**  
 **2\. Our sales managers were processing \~6,500 payslips \- pulling out the data, translating it into commission. Processing expense submissions with a myriad of cost types**

**All of this was done on a mixture of Google Sheets, Notion, WhatsApp & Gmail \- no CRM, no finance software. Just a million sheets and a prayer.**

**And the team were starting to feel it. We’d been getting by for a good while with this system but cracks were starting to show \- team progression was slowing, burnout was a real risk and job satisfaction was tanking. It wasn’t just the increased scale that started to test them \- it was the visibility of what was** *possible* **with the advent of AI and the realisation that we had no clear route to realise those advantages.**

**SO \- I sat down with my best mate of the time (GPT \- pre-break up) and came up with a solid problem statement.**

 **SLIDE FIVE**  
**Direct Sales is full of brilliant people, doing high value work with low leverage tools.**

**At the same time I was chatting with my brother in law who is high up at a tech company. He was telling me about agents and how they were the future and everything they could deliver \- problem statement \- but he was also saying how clean data would be paramount for them to operate well.**

 **SLIDE SIX**  
**What immediately flashed before my eyes, and I don't know if you've ever seen this before but there's a pop up warning that google sheets gifts to you that reads "your spreadsheet has reached the 10,000,000 cell limit and no more data can be added." Google Sheets gave me its own problem statement right back at me. Work to be done there then.**

**So, what we built over the next 12 months was the foundation. Clean, centralised operational data.**  
**That sounds boring. — It was boring.**

 **SLIDE SEVEN**  
**But it was the thing that made everything else possible. The agents, the custom interfaces, the Slack bots, the AI workflows \- all of that came later. And it only moved quickly because the boring layer was already there.**  
**This was the shift:**  
**We went from Gmail, WhatsApp, Notion and Google Sheets…to an operating system.**

**SLIDE EIGHT**  
**Not one Airtable base. An actual operating layer across booking, staffing, forecasting, budget, performance, agent operations, recruitment and telesales.**  
**I’m not going to take you through every part of it, because that would be deeply unfair on all of us.**  
**But I’ll show you three examples that explain the shift.**  
**⸻**  
**SLIDE 9**

**This is what we had before—Each row is an event. Dog show, garden centre, shopping centre, agricultural show, retail venue.**

**Every single one has dates, stand information, costs, staffing requirements, logistics notes, sales forecasts, previous performance, organiser comms, feedback, and spend attached to it.**  
**At scale, this was painful. Not because the team weren’t good. The team were brilliant.**  
**But they were doing high-value work with low-leverage tools.**  
**You can see the problem immediately. The sheet technically contains information, but it doesn’t really create intelligence. It doesn’t know who needs what. It doesn’t tell an Event Coordinator what is missing.**

**And so much time is spent extracting the data, there’s not a ton of room for meaningful intelligence anyway. And that’s before we get into Notion.**  
**This is where we stored longer-form event information. Screenshots from organiser packs. Notes copied from emails. Details buried in PDFs. Then that information would be manually pulled into up to 60 WhatsApp event groups a week for salespeople.**

**SLIDE 10**  
**NEW STATE \- A role-specific operating interface. The system detects who the user is and only shows them what they need. If you’re an Event Coordinator, you get your activations, your gaps, your metrics, your missing information, your actions.**  
**This matters because one of the big mistakes people make with operations tooling is assuming more visibility is always better.**  
**It isn’t. Too much visibility is just a spreadsheet with better branding.**  
**A lot of that data now comes in through AI fields and automations.**  
**An organiser email arrives. Airtable AI reads it. It extracts the useful information. It categorises it and it puts the data into the right place.**  
**So instead of someone reading a PDF, copy-pasting into a sheet, taking a screenshot, and dropping it into WhatsApp, the system is doing the first pass.**  
**The human still owns the judgement. But they’re not burning their brain on copy-paste. That’s the key shift.**  
**⸻**  
**SLIDE 12**  
**This is how staffing worked before.**  
**The Regional Manager would look at availability, look at who was trained, look at who could drive, look at where people lived, look at who had done too many shifts, look at who needed development, and manually assign people.**  
**Each box is an activation. Then they’d screenshot the rota. Then they’d put it into a WhatsApp group. Then an Event Coordinator would follow up with the event information. Doing one week of staffing could take about four hours.**

**SLIDE 13**  
**NEW STATE \- The Regional Manager can now work from one staffing dashboard. They can see the activation. They can see the salesperson’s availability. They can see whether someone is on annual leave, unavailable, already booked, too far away, or at risk of burnout.**  
**There’s a drag-and-drop staffing flow.**  
**There are warnings if something doesn’t make sense.**  
**There’s distance logic through Google APIs.**  
**There’s deterministic travel-pay logic.**  
**There’s driver / passenger logic.**  
**There’s shift-load risk.**  
**That doesn’t mean the manager has disappeared. But instead of starting from a blank grid, they start from a structured recommendation. Then they make the call.**

 **SLIDE 14**  
**And when they lock the shifts with another button, I love a button, especially this one which has a one of many surprise and delight moments attached to it.  The system sends the schedule to the salesperson in a clean HTML email with the information they need.**  
**That’s the difference between automation replacing judgement and automation supporting judgement.**

**We’re not removing the Regional Manager.**  
**We’re removing the sludge around them.**  
**⸻**  
**SLIDE 15**

**This is where the platform started to move from operational efficiency into commercial strategy.**  
**Before this, our forecasting was fragile. It relied on people knowing which events felt good, which regions were strong, which teams were improving, and which assumptions were probably wrong.**  
**It does not work when you’re running hundreds and hundreds of activations across multiple regions, with different labour models, event categories, spend profiles and team quality.**

 **SLIDE 16**  
**When we forecast an activation, the system analyses historic shift records, event category, team strength, activation type, previous performance, and current staffing context.**

**One of the big unlocks was event categorisation. With LLM support, we identified distinct activation categories where performance variance was low enough to be useful.**  
**That meant we could stop treating “events” as one big generic bucket.**  
**A dog show is not a garden centre.**  
**A garden centre is not a shopping centre.**  
**A shopping centre is not Crufts.**  
**That sounds obvious, but if your data structure doesn’t reflect that, your decisions won’t either.**

**SLIDE 17**  
**The biggest insight this unlocked was around our labour model. At surface level, our employed and self-employed salespeople looked broadly similar on sales per shift.**  
**But when we looked at the data properly, we saw that they performed a lot better at our higher quality activations that they had less exposure to.**  
**When we shifted the allocation weighting, employed salespeople were materially stronger. They cost more per shift, yes. They carry more risk for the business.**   
**But they performed better in the right conditions. That insight helped us make the case for a major shift in the labour model \- hiring more full-time employed salespeople.**  
**The old system could tell us what happened.**  
**The new system can guide us in making the best decisions.**   
**⸻**  
**SLIDE 18**  
**So what did this unlock?**  
**We saved significant cost through better travel planning — roughly £180k a year.**  
**We could make a stronger, cleaner case for major hiring decisions, because the data was there and Finance could verify it.**  
**And when we looked at how we would scale into new international markets, we could see the platform absorbing roughly 3,000 hours of work a year compared with the old operating model.**  
**But the most important outcome wasn’t just time saving.**  
**It was leverage. The team could stop spending so much time coordinating and start spending more time improving performance.**  
**That is the point of the foundation layer.**  
**It is not glamorous.**  
**It does not have a Victorian chatbot in it.**  
**Yet.**  
**But it creates the conditions where the exciting layer can work.**  
**⸻**  
 **SIDE 19**

**So that was the foundation.**  
**Twelve months of cleaning the data, centralising the workflows, and getting the team operating from one place.**  
**And once that existed, the next layer moved fast.**  
**In two weeks, we launched the first agent fleet.**  
**That speed was only possible because the foundation was already there. If you try to add agents on top of messy data, they just become very confident chaos machines which is pretty fun, but not very useful.**  
**What we had by this point was different \- we had clean data, we had a team that already understood AI and we had workflows where agents could do specific jobs.**  
**That last point is important.**  
**The principle was never: one magical general assistant, the principle I focused on was targeted agents with narrow scopes, clear context, and personality profiles that got people actually wanting to engage with them.**

**SLIDE 20**  
**This is the first fleet.**  
**They all have specific jobs and ‘live’ in specific bases. Clive’s cottage, Juan’s Junta, Vera’s Vault, Pam’s Palace… you get the idea.**   
**Specificity matters because the more specific the job, the lower the chance of hallucination & the easier it is to build an agent quickly that can be trusted. The quicker they can be deployed in real life environments, the quicker you can go about improving them.**   
**The easier it is to trust, the more likely the team is to use it. The more the team uses it, the better it gets.**   
**⸻**  
**SLIDE 21**  
**Let me start with Clive.**

**Clive Wigglesworth. Victorian gentleman. Emotionally needy. Desperate for approval. furious that he needs it.**  
**Modelled partly after my golden retriever Ajax, which probably says more about me than I’d like.**

**Clive started as a solution to a problem I had created for myself. Because I had built the system, every question came to me. Every bug report. Every “where does this live?” Every feature request. I had accidentally become the interface and the only buttons that were being pressed were annoyed ones.**  
**So Clive’s job was to teach the team how to use the system. Not just answer questions but to explain the why so that next time, they’d find the answer themselves.**

 **SLIDE 22**  
**But the real reason Clive worked wasn’t just the functionality. It was personality. We invested in the agents feeling memorable. Not because that’s cute. Because adoption matters.**  
**Bots people are afraid of don’t get used. Bots people laugh at, argue with, and accuse of flirting with the Logistics Manager absolutely do.**  
**One of my team publicly said, “I think I fancy him.”**  
**If that’s not engagement, I don’t know what is.**  
**Even better, our Debug Bot later came into the Slack channel and issued a public apology for Clive’s behaviour.**  
**I only found out about this when reading my weekly agent health report and got VERY confused. Which is the moment I realised the agent ecosystem had developed office politics. And honestly, I was delighted.**  
**Because the team were playing. And once people start playing, they learn 100x faster.**

 **SLIDE 23**  
**Clive primarily lives in Airtable, coded into a custom interface. He references a curated context table for specifics on our systems & the data itself via lookups.**

**If someone asks what to do about a budget gap, Clive can look at the context, explain what’s missing, point them to the relevant process, and help them understand what to do next.**  
**If they push back and say, “I’ve done that, is this a bug?”, Clive can read the status fields from the deterministic scripts and explain what happened.**  
**If it gets beyond the Airtable version of Clive, he routes them into Slack, where the agent version has access across multiple bases and our GitHub scripts.**  
**⸻**  
**Slide 24**  
**Next is Reggie our guy Reggie \- Reg looks after bonuses and payroll QA. The fleet's beloved oblivious uncle, doling out coins and warm wheezy laughter while entirely missing the soap opera around him. Once asked Vera if she'd like to write a piece about his prize-winning marrows.**  
**The cleanest example is our ad hoc bonus process. We run a lot of small, fun bonus incentives for salespeople.**  
**As a general rule, the funner the bonus structure is, the harder it is to track and the more frequently it changes.rules.**  
**Different regions, different cutoffs, different qualifying criteria.**

**SLIDE 25**  
**Historically, a Regional Manager would need to check timestamps, sales records, Slack messages, region rules, shift records, eligibility, and then manually create the bonus records.**

**It’s the sort of work that is not strategically difficult, but is absolutely draining. And if you get it wrong, people care.**

**Now Reggie can run that process.**

**The manager clicks the button. Give ‘Reggie a Call’ Reggie checks the rules, reads the data, determines the winners, explains who was close, explains who didn’t qualify, and creates the bonus records.**

**Again, the point is not “AI replaces the manager.” The point is that the manager no longer has to spend half a day playing spreadsheet detective to run a fun sales incentive and they don’t have the looming threat of admin limiting their creativity.**

**⸻**  
**SLIDE 26**  
**The cleanest example of agent orchestration is what we call the Trinity. Although, technically, it’s more than three but Trinity has much more weight than The Fantastic Four.**

**This workflow handles one of the heaviest pieces of operational work in the team: organiser emails. Every event organiser communicates differently. Some send PDFs, some send invoices, some send logistics packs, some bury the important bit in paragraph seven of an email that starts with “hope this finds you well”.**  
**Historically, someone had to read all of that, work out what mattered, link it to the right activation, update the right fields, and tell the right people.**

**SLIDE 27**  
**First, an email comes in through Gmail.**  
**Airtable AI classifies and extracts the key information.**  
**Brother Tashi links it to the correct activation.**  
**That sounds simple, but event names are messy. Organisers use different names. Dates shift. Locations vary. So he has to do fuzzy matching across the system.**  
**Then Marlowe reads what Tashi found and proposes useful field updates. Crucially, Marlowe does not write directly to the live activation. He proposes. The Event Coordinator sees the old-to-new changes and accepts or declines.**  
**If they accept, Marcel is called.**  
**And Marcel executes the change, writes the audit trail, and posts the confirmation.**  
**So the pattern is:**  
**Tashi links. Marlowe proposes. The human approves. Marcel executes.**  
**Each agent has one job.  The human keeps judgement. That is the design pattern I care about.**  
**Bounded agents, clear handoffs, clean data, human approval.**  
**⸻**  
 **SLIDE 26**  
**So that’s the journey\! Twelve months building the boring layer.**  
**Then the agent layer moving at a pace that would not have been possible without it.**  
**There’s a running joke between me and my MD. Every week she’d ask how the systems were going. And every week I’d say, “It’s grown arms and legs.” Eventually I’d walk into the one-to-one and she’d just say, “Arms and legs?”**  
**And I’d nod.**  
**Because that’s the compounding nature of this work. Clean data grows into systems. Systems grow into agents. Agents grow into new workflows.**  
**And eventually the work starts building on itself.**  
**But only if the team comes with you.**  
**And that’s the part that gets underplayed. Because AI adoption is not just a technical journey. It’s also an emotional one that needs to be navigated.**  
**⸻**  
 **SLIDE 27**  
**I think there are four things teams need if they’re going to adopt AI properly.**  
**TRUST \- I got some of this for free because I was the one building the system, and I like to think the team trusted me. But you can’t rely on that forever. Trust has to be designed.**  
**That means clear outputs, clear explanations. & visible audit trails. Agents with narrow jobs and weirdly, moments of lightness.**  
**The personalities mattered, the jokes mattered, the confetti mattered.**  
**The fact the team could mock the bots mattered. Because it turned AI from something happening to them into something they could play with.**  
**TRAINING \- This is the one I’ve learned the hard way. If people don’t know how to use a system, they don’t experience value. If they don’t experience value, they don’t feel safe. And if they don’t feel safe, they disengage. Prompt fluency is a big part of this.**  
**When people don’t get good outputs from AI, they often assume the model is bad. But often, the issue is that they haven’t yet learned how to communicate the work clearly. That is now a management skill. Not a technical skill. A management skill.**  
**VALUE \- People need to feel the system makes their work better. Not just faster. If a Regional Manager can spend less time building a report and more time coaching their team, that’s value.**  
**If an Event Coordinator can spend less time hunting through organiser emails and more time improving event quality, that’s value.**  
**The team has to see that. You have to shout about it.**  
**SAFETY The future of work is going to look very different. A lot of the manual tasks people are comfortable with will disappear. That can be exciting. It’s more often frightening. So people need to understand where their value moves. The aim is not to make humans less important, it is to move humans toward the work that actually needs them.**  
**Judgement, coaching, decision-making, commercial thinking, creative problem-solving.**  
**The agents can take the sludge.**  
**The humans keep the meaning.**  
**⸻**  
**SLIDE 28**  
**Final close**  
**So the learning isn’t “buy AI tools.”**  
**The learning is build the conditions where AI can do useful work.**  
**Clean data.**  
**Clear workflows.**  
**Trusted tools.**  
**Trained teams.**  
**Airtable gave us the rails.**  
**AI gave us the build partner.**  
**The domain experts gave us the judgement.**  
**That is the shift I care about.**  
**Not everyone needs to become technical.**  
**But domain experts can now become architects.**  
**I built this as a non-technical commercial leader with AI on top of clean data.**  
**Imagine what a team could do.**  
**Thank you.**  
