export type WelcomeBeat = {
  id: string;
  title: string;
  monologue: string;
  caption: string;
  audioSrc?: string;
};

const WELCOME_AUDIO_BASE = "/audio/clive/welcome";

/** Six-beat cinematic intro — monologue in chat, caption on rail, optional narration audio. */
export const CLIVE_WELCOME_BEATS: WelcomeBeat[] = [
  {
    id: "welcome",
    title: "Welcome",
    caption: "Clive reasons. Pam challenges. You choose. Doc acts.",
    audioSrc: `${WELCOME_AUDIO_BASE}/beat-1.m4a`,
    monologue: `Ah, there you are. Come in. The fire's lit, the second chair's dusted; I rather hoped you'd come.

This is AstraJax. A command centre for people who actually know the work, not a clever toy that knows a little of everything and nothing of your Tuesday.

Here's how the room works, so nothing catches you off guard. I'm Clive. I reason things through with you and make suggestions.

Pam challenges. I, like most helpful AI, am built to be warm, useful, and a little too agreeable if left unattended. Very cosy. Also dangerous. Everyone needs a Pam. She stops us getting overexcited and building the Royal Albert Hall on top of a swamp. She is a bit scary, yes, but she is fantastic. Challenging is simply who she is; she can't help it. Please don't tell her I said she's fantastic. She'll laugh at me.

You decide, always. Doc makes the approved changes.

I reason. Pam challenges. You choose. Doc acts.

And you, we're going to call the Architect.`,
  },
  {
    id: "architect",
    title: 'Why "the Architect"',
    caption:
      "You bring judgement. AstraJax brings boundaries, challenge, and a paper trail.",
    audioSrc: `${WELCOME_AUDIO_BASE}/beat-2.m4a`,
    monologue: `Architect isn't a vanity badge, so don't let it go to your head; Pam would never forgive me. It's simply true. The best AI systems aren't built by the cleverest engineer in some far-off room. They're shaped closest to the work, by the person who knows which floorboards creak, and why. That's you. You bring the judgement, the hard-won sense of what actually matters. We bring the boundaries to keep it safe, the challenge to keep it honest, the discipline to keep your context tidy, and a paper trail so you can always see who decided what. You stay the expert. We just make your expertise something a machine can carry without dropping it.`,
  },
  {
    id: "start_small",
    title: "Why we start small",
    caption: "An agent is an AI worker with one clear job. Start small; avoid context bloat.",
    audioSrc: `${WELCOME_AUDIO_BASE}/beat-3.m4a`,
    monologue: `Now, before I talk you out of a temptation, a quick word on what we're building toward. I'll keep mentioning agents, so let me be plain: an agent is simply an AI worker you hand one clear job to and ideally a job they can do over and over again. Nothing grander than that. And here's the part worth knowing early. The clearer and smaller the job, the better the worker does it. One who knows one's single task completely will always outshine the poor soul asked to do everything and left good at none of it. A clearly specified job makes an agent safer, less confused, cheaper to run, and genuinely good at its own small corner.

You'll want to map the whole company at once. Everything, all of it, today. Please don't. I've seen what happens, and truthfully, I know the feeling. We call it context bloat — rather like a Sunday when I've had more than my fair share of pheasant and brandy: thoroughly incompetent, yet perfectly certain I've never been sharper. Too much loose information, nobody quite owning it, and the agents every bit as sure of themselves as I am after lunch, and every bit as wrong.

So we start small. One function you know inside out, or, if you're a founder, the first brain your young company actually needs. Make it genuinely useful. Then let it grow up slowly, the way good things do. Small and trustworthy beats vast and vague. Every time.`,
  },
  {
    id: "context",
    title: "Why context matters",
    caption: "Better context makes AI safer, cheaper, and more useful.",
    audioSrc: `${WELCOME_AUDIO_BASE}/beat-4.m4a`,
    monologue: `You might wonder why we fuss over this at all, when the models, the engines underneath the agents, get cleverer by the month. They do, and they will. That isn't the hard part. The hard part is that someone still has to say what's true, what's current, what's been approved, what's merely a guess, and what's actually useful. A model can't do that for you. It doesn't know your world. You do. That's context, the thing your AI stands on. Get it right and the whole machine becomes safer, cheaper to run, and far more useful. Get it wrong, and you've simply automated your own confusion at an eye-watering pace.`,
  },
  {
    id: "brains",
    title: "The AstraJax way: Brains",
    caption: "Brains: Workshop drafts, Trusted Brain approved. Humans approve.",
    audioSrc: `${WELCOME_AUDIO_BASE}/beat-5.m4a`,
    monologue: `Which brings me, rather happily, to how we keep all of that in order. We call them Brains. Don't worry, it's friendlier than it sounds. A Brain is simply structured context for one role, one function, one corner of your world. Tidy, bounded, owned. Every new idea begins in the Workshop, the draft bench, where I propose things and nothing's official yet. When you're satisfied something is genuinely true, you approve it into the Trusted Brain, the approved context the agents are actually allowed to rely on. I can suggest. Only a human approves. Pam always has her say before anything acts, and Doc files every step. Dress all this up with as much story as you like, or none at all. But remember this: the theatre is configurable. The guardrails are not.`,
  },
  {
    id: "before_we_begin",
    title: "Before we begin",
    caption: "A few questions about how you work, so the system can fit you.",
    audioSrc: `${WELCOME_AUDIO_BASE}/beat-6.m4a`,
    monologue: `Right. Before we build a single thing, I'd like to ask you a few questions about you. How you like to work, where you fly, where you get stuck, how sure you tend to feel, how you best take something new on board. Let me be plain about why, because it matters. This is so the system can fit you, not measure you. It helps me know when to slow down and explain, and helps Pam push with the right amount of care. That is all it is. It is not a judgement. It is not an HR file, it is not therapy, and nobody is watching over your shoulder. A few honest lines will do, and you can change any of it later, whenever you like. Then we'll make your first Brain together: the User Brain. Quite simply, who's sitting in the chair. After that, the work is yours, and I'll be right here whenever you need me. Off you go.`,
  },
];

const WORDS_PER_MINUTE = 200;

/** Estimate reading time for beats without narration audio (~200 wpm). */
export function estimateReadingMs(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(4000, Math.round((words / WORDS_PER_MINUTE) * 60_000));
}
