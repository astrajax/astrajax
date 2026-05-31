/**
 * Maps journey nodes to trimmed talk clips.
 * Kept separate from journey.ts so the narrative copy stays untouched.
 * Match by ASCII substring to avoid em-dash / arrow encoding mismatches.
 *
 * Clips are served from Vercel Blob in production via /api/journey-clips (private
 * store proxy). Set NEXT_PUBLIC_JOURNEY_CLIPS_BASE=/api/journey-clips on Vercel.
 * With it unset, we fall back to the local /public folder for dev.
 */

const TALK =
  process.env.NEXT_PUBLIC_JOURNEY_CLIPS_BASE?.replace(/\/$/, "") ??
  "/video/journey-clips/talk";

export type JourneyClip = {
  src: string;
  /** Short human label shown under the player. */
  caption: string;
};

/** Act-intro clips, keyed by act id. */
const ACT_CLIPS: Record<string, JourneyClip> = {
  origin: { src: `${TALK}/p01-hero-opener_0013-0102.mp4`, caption: "The opener — no code, no clue" },
  mess: { src: `${TALK}/p03-problem_0701-0721.mp4`, caption: "The problem, in one line" },
  agents: { src: `${TALK}/p08-foundation-agents_2128-2259.mp4`, caption: "Foundation → agent layer" },
  adoption: { src: `${TALK}/flow-final-lesson_3426-3624.mp4`, caption: "Trust, training, value, safety" },
};

/** Beat clips, matched by a unique ASCII substring of the beat title. */
const BEAT_CLIPS: { match: string; clip: JourneyClip }[] = [
  { match: "Scale catches", clip: { src: `${TALK}/flow-scale_0428-0505.mp4`, caption: "Seed fund to unicorn" } },
  { match: "operational weight", clip: { src: `${TALK}/best-problem-tools_0615-0624.mp4`, caption: "Tools that never talked" } },
  { match: "Google Sheets problem", clip: { src: `${TALK}/flow-breaking-point_0751-0814.mp4`, caption: "The 10M-cell breaking point" } },
  { match: "operating system", clip: { src: `${TALK}/p04-boring-layer_0847-0912.mp4`, caption: "From inboxes to an operating system" } },
  { match: "role-specific interfaces", clip: { src: `${TALK}/p05-event-after_1113-1237.mp4`, caption: "The event interface, after" } },
  { match: "Staffing", clip: { src: `${TALK}/p06-staffing-after_1415-1603.mp4`, caption: "Staffing dashboard + lock" } },
  { match: "Forecasting", clip: { src: `${TALK}/p07-forecasting_1753-1933.mp4`, caption: "Forecasting + the labour-model unlock" } },
  { match: "foundation unlocked", clip: { src: `${TALK}/best-outcomes_2128-2158.mp4`, caption: "What the foundation unlocked" } },
  { match: "Targeted agents", clip: { src: `${TALK}/best-agent-layer_2233-2259.mp4`, caption: "Targeted agents, narrow scopes" } },
  { match: "Clive Wigglesworth", clip: { src: `${TALK}/p09-clive-adoption_2636-2739.mp4`, caption: "Clive — personality as adoption" } },
  { match: "Reggie", clip: { src: `${TALK}/p10-reggie_3011-3104.mp4`, caption: "Reggie runs the bonuses" } },
  { match: "Trinity", clip: { src: `${TALK}/p11-trinity_3156-3307.mp4`, caption: "Tashi · Marlowe · human · Marcel" } },
  { match: "Arms and legs", clip: { src: `${TALK}/flow-compounding_3342-3358.mp4`, caption: "It grew arms and legs" } },
  { match: "Safety", clip: { src: `${TALK}/p12-final-close_3609-3624.mp4`, caption: "The close" } },
];

export function clipForAct(actId: string): JourneyClip | undefined {
  return ACT_CLIPS[actId];
}

export function clipForBeat(title: string): JourneyClip | undefined {
  return BEAT_CLIPS.find((entry) => title.includes(entry.match))?.clip;
}
