/**
 * Clive study reaction clips — short loops that start and end on a similar
 * neutral seated pose. Files live under `public/agent-cast/clive-wigglesworth/animations/`.
 */

export type CliveReaction = "idle" | "listen" | "think" | "pleased" | "sigh" | "glance";

const CLIVE_ANIMATIONS_BASE = "/agent-cast/clive-wigglesworth/animations";

/** Beat 1 welcome — warm welcome gesture (kept for reference / alternate staging). */
export const CLIVE_WELCOME_BEAT_1_TALKING = `${CLIVE_ANIMATIONS_BASE}/gesture-warm-welcome.mp4`;

/** Beat 1 welcome — full welcome transition; plays once, holds last frame. */
export const CLIVE_WELCOME_BEAT_1_STITCHED = `${CLIVE_ANIMATIONS_BASE}/welcome-transition.mp4`;

/** Ambient idle playlist — cycled during the welcome cinematic and default idle reel. */
export const CLIVE_IDLE_REEL: readonly string[] = [
  `${CLIVE_ANIMATIONS_BASE}/gesture-smiling-warmly.mp4`,
  `${CLIVE_ANIMATIONS_BASE}/hero-loop-reading.mp4`,
  `${CLIVE_ANIMATIONS_BASE}/gesture-looking-up-thought.mp4`,
  `${CLIVE_ANIMATIONS_BASE}/gesture-happy.mp4`,
  `${CLIVE_ANIMATIONS_BASE}/gesture-laughing.mp4`,
  `${CLIVE_ANIMATIONS_BASE}/gesture-lean-in.mp4`,
  `${CLIVE_ANIMATIONS_BASE}/gesture-advising-caution.mp4`,
  `${CLIVE_ANIMATIONS_BASE}/gesture-warm-welcome.mp4`,
];

/** Maps chat/study reactions to public video URLs. */
export const CLIVE_REACTION_CLIPS: Record<CliveReaction, string> = {
  /** Default ambient loop when idle reel is not active — study uses animation clips, not homepage hero. */
  idle: `${CLIVE_ANIMATIONS_BASE}/gesture-smiling-warmly.mp4`,
  /** User enters a chat turn — warm welcome at a slightly slowed pace. */
  listen: `${CLIVE_ANIMATIONS_BASE}/gesture-warm-welcome.mp4`,
  think: `${CLIVE_ANIMATIONS_BASE}/gesture-looking-up-thought.mp4`,
  pleased: `${CLIVE_ANIMATIONS_BASE}/gesture-happy.mp4`,
  sigh: `${CLIVE_ANIMATIONS_BASE}/gesture-sad.mp4`,
  /** Pam-challenge beat — caution reads cleaner than a side-glance on the new set. */
  glance: `${CLIVE_ANIMATIONS_BASE}/gesture-advising-caution.mp4`,
};

/** Ambient / default clip speed — slightly under real-time. */
export const CLIVE_AMBIENT_PLAYBACK_RATE = 0.72;

/** Chat-entry welcome gesture — 80% speed. */
export const CLIVE_LISTEN_PLAYBACK_RATE = 0.8;

export function reactionPlaybackRate(reaction: CliveReaction): number {
  return reaction === "listen" ? CLIVE_LISTEN_PLAYBACK_RATE : CLIVE_AMBIENT_PLAYBACK_RATE;
}
