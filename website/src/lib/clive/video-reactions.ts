/**
 * Clive study reaction clips — short loops that start and end on a similar
 * neutral seated pose. Files live under `public/agent-cast/clive-wigglesworth/animations/`.
 */

export type CliveReaction = "idle" | "listen" | "think" | "pleased" | "sigh" | "glance";

const CLIVE_ANIMATIONS_BASE = "/agent-cast/clive-wigglesworth/animations";

/** Ambient idle playlist — cycled during the welcome cinematic and default idle reel. */
export const CLIVE_IDLE_REEL: readonly string[] = [
  `${CLIVE_ANIMATIONS_BASE}/idle-blinking.mp4`,
  `${CLIVE_ANIMATIONS_BASE}/idle.mp4`,
  `${CLIVE_ANIMATIONS_BASE}/head-move.mp4`,
  `${CLIVE_ANIMATIONS_BASE}/looking-up.mp4`,
  `${CLIVE_ANIMATIONS_BASE}/look-up-left.mp4`,
  `${CLIVE_ANIMATIONS_BASE}/look-left-and-right.mp4`,
  `${CLIVE_ANIMATIONS_BASE}/plays-with-ears.mp4`,
  `${CLIVE_ANIMATIONS_BASE}/lean-back-proud.mp4`,
  `${CLIVE_ANIMATIONS_BASE}/clive-look-away.mp4`,
];

/** Maps chat/study reactions to public video URLs. */
export const CLIVE_REACTION_CLIPS: Record<CliveReaction, string> = {
  /** Default ambient loop when idle reel is not active. */
  idle: "/agent-cast/clive-wigglesworth/hero.mp4",
  listen: `${CLIVE_ANIMATIONS_BASE}/head-move.mp4`,
  think: `${CLIVE_ANIMATIONS_BASE}/looking-up.mp4`,
  pleased: `${CLIVE_ANIMATIONS_BASE}/lean-back-proud.mp4`,
  sigh: `${CLIVE_ANIMATIONS_BASE}/clive-look-away.mp4`,
  glance: `${CLIVE_ANIMATIONS_BASE}/look-left-and-right.mp4`,
};

export const CLIVE_VIDEO_CROSSFADE_MS = 200;
