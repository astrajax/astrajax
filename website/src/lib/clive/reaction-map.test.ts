import { describe, expect, it } from "vitest";
import {
  assistantReplyReaction,
  BEAT_ENTRY_REACTIONS,
  DECISION_REACTIONS,
  thinkingReaction,
  userMessageReaction,
} from "./reaction-map";
import {
  CLIVE_AMBIENT_PLAYBACK_RATE,
  CLIVE_LISTEN_PLAYBACK_RATE,
  CLIVE_REACTION_CLIPS,
  reactionPlaybackRate,
} from "./video-reactions";

describe("Clive reaction dramaturgy", () => {
  it("reserves pleased for decision moments only", () => {
    expect(Object.values(DECISION_REACTIONS).every((r) => r === "pleased")).toBe(true);
    expect(Object.values(BEAT_ENTRY_REACTIONS)).not.toContain("pleased");
    expect(assistantReplyReaction("clive")).toBeNull();
    expect(assistantReplyReaction("pam", "welcome")).toBeNull();
  });

  it("gives Clive listen/think cues and stays silent for Pam", () => {
    expect(userMessageReaction("clive")).toBe("listen");
    expect(thinkingReaction("clive")).toBe("think");
    expect(userMessageReaction("pam")).toBeNull();
    expect(thinkingReaction("pam")).toBeNull();
  });

  it("keeps Pam-challenge / truth-approval body language on beat entry", () => {
    expect(BEAT_ENTRY_REACTIONS.pam_challenge).toBe("glance");
    expect(BEAT_ENTRY_REACTIONS.truth_approval).toBe("sigh");
  });

  it("slows listen relative to ambient and maps every reaction to a clip", () => {
    expect(reactionPlaybackRate("listen")).toBe(CLIVE_LISTEN_PLAYBACK_RATE);
    expect(reactionPlaybackRate("idle")).toBe(CLIVE_AMBIENT_PLAYBACK_RATE);
    expect(reactionPlaybackRate("glance")).toBe(CLIVE_AMBIENT_PLAYBACK_RATE);
    for (const reaction of Object.keys(CLIVE_REACTION_CLIPS) as Array<
      keyof typeof CLIVE_REACTION_CLIPS
    >) {
      expect(CLIVE_REACTION_CLIPS[reaction]).toMatch(
        /^\/agent-cast\/clive-wigglesworth\/animations\/.+\.mp4$/,
      );
    }
  });
});
