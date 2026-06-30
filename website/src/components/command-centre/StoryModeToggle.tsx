"use client";

import { useStoryMode } from "@/components/command-centre/StoryModeProvider";
import { STORY_MODE_LABELS, type StoryMode } from "@/lib/command-centre/story-mode";

const MODES: StoryMode[] = ["full", "light", "no-story"];

type StoryModeToggleProps = {
  className?: string;
  compact?: boolean;
};

export function StoryModeToggle({ className = "", compact = false }: StoryModeToggleProps) {
  const { mode, setMode } = useStoryMode();

  return (
    <div
      className={`story-mode-toggle ${className}`.trim()}
      role="group"
      aria-label="Story mode"
    >
      {!compact ? (
        <span className="story-mode-toggle__label section-label">Story mode</span>
      ) : null}
      <div className="story-mode-toggle__options">
        {MODES.map((option) => (
          <button
            key={option}
            type="button"
            className={`story-mode-toggle__btn ${
              mode === option ? "story-mode-toggle__btn--active" : ""
            }`}
            aria-pressed={mode === option}
            onClick={() => setMode(option)}
          >
            {STORY_MODE_LABELS[option]}
          </button>
        ))}
      </div>
    </div>
  );
}
