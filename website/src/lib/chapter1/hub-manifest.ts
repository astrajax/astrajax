import type { HubBookId } from "@/lib/chapter1/hub-books";

/**
 * Scene manifest — Clive's study hub (the desk of four books).
 *
 * House convention (build pack W7): hotspot geometry and per-hotspot media
 * live as data, not in component code, so re-cutting the painting or adding
 * a fifth book is a manifest edit, not a component edit. Percentages are
 * relative to the painted desk surface.
 *
 * Route A note stands: the current painting carries baked book titles; next
 * regeneration ships blank spines with live labels laid over from this
 * manifest.
 */
export type HubHotspot = {
  id: HubBookId;
  ariaLabel: string;
  left: string;
  width: string;
  top: string;
  height: string;
  /** Alpha glow accent, cross-faded on hover/focus. */
  glow: string;
};

export type HubSceneManifest = {
  room: "clive-study-hub";
  image: string;
  imageAlt: string;
  hotspots: HubHotspot[];
};

export const HUB_SCENE_MANIFEST: HubSceneManifest = {
  room: "clive-study-hub",
  image: "/agent-cast/clive-wigglesworth/clive-study-hub.png",
  imageAlt:
    "Bird's-eye view of Clive's desk with four leather-bound books: Welcome, Reasoning with Clive, The Architect Journal, and Brain Building",
  hotspots: [
    {
      id: "welcome",
      ariaLabel: "Welcome — start Clive's welcome sequence",
      left: "8%",
      width: "14%",
      top: "35%",
      height: "50%",
      glow: "/agent-cast/clive-wigglesworth/book-glow/welcome.mp4",
    },
    {
      id: "reason",
      ariaLabel: "Reasoning with Clive — ask Clive about context and judgement",
      left: "26%",
      width: "22%",
      top: "35%",
      height: "50%",
      glow: "/agent-cast/clive-wigglesworth/book-glow/reasoning-with-clive.mp4",
    },
    {
      id: "architect",
      ariaLabel: "The Architect Journal — map your user brain and build the loop",
      left: "52%",
      width: "20%",
      top: "35%",
      height: "50%",
      glow: "/agent-cast/clive-wigglesworth/book-glow/architect-journal.mp4",
    },
    {
      id: "brain-building",
      ariaLabel: "Brain Building — learn how governed brains work",
      left: "76%",
      width: "19%",
      top: "35%",
      height: "50%",
      glow: "/agent-cast/clive-wigglesworth/book-glow/brain-building.mp4",
    },
  ],
};
