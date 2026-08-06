"use client";

import { useMemo } from "react";
import { StudyMarkdown } from "@/components/chapter1/StudyMarkdown";

const SENTENCE_SPLIT = /(?<=[.!?…])\s+(?=[A-Z"'“(])/;

/** Split assistant copy into reveal chunks (sentences or line breaks). */
export function splitIntoRevealLines(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const lines: string[] = [];

  for (const paragraph of trimmed.split(/\n{2,}/)) {
    for (const segment of paragraph.split(/\n/)) {
      const chunk = segment.trim();
      if (!chunk) continue;

      const sentences = chunk.split(SENTENCE_SPLIT).map((s) => s.trim()).filter(Boolean);
      if (sentences.length > 1) {
        lines.push(...sentences);
      } else {
        lines.push(chunk);
      }
    }
  }

  return lines.length > 0 ? lines : [trimmed];
}

const STAGGER_MS = 100;
const MAX_TOTAL_STAGGER_MS = 1200;

function staggerDelay(index: number): number {
  const cappedIndex = Math.min(index, Math.floor(MAX_TOTAL_STAGGER_MS / STAGGER_MS));
  return cappedIndex * STAGGER_MS;
}

type StudyAssistantTextProps = {
  content: string;
  /** When true, new assistant copy fades in line by line. */
  animate?: boolean;
};

export function StudyAssistantText({ content, animate = false }: StudyAssistantTextProps) {
  const lines = useMemo(() => splitIntoRevealLines(content), [content]);

  if (!animate) {
    // Render assistant Markdown structure as semantic live HTML, then let
    // the folio ink presets inherit onto the real elements — never print
    // raw `**`/`---` to the page.
    return (
      <div className="clive-chat__prompt-text clive-chat__prompt-text--md">
        <StudyMarkdown content={content} paragraphClassName="clive-chat__md-para" />
      </div>
    );
  }

  return (
    <div className="clive-chat__prompt-text clive-chat__prompt-text--revealing clive-chat__prompt-text--md">
      {lines.map((line, index) => (
        // A line may render block Markdown (p/ul/ol/hr), so the animated
        // wrapper must be a valid BLOCK element — never a <span>, which
        // cannot legally contain block children. div + the prompt-line
        // animation class keeps the staggered reveal on valid DOM.
        <div
          key={`${index}-${line.slice(0, 24)}`}
          className="clive-chat__prompt-line"
          style={{ animationDelay: `${staggerDelay(index)}ms` }}
        >
          <StudyMarkdown content={line} paragraphClassName="clive-chat__md-para" />
        </div>
      ))}
    </div>
  );
}
