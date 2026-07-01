"use client";

import Image from "next/image";
import type { HubBookId } from "@/lib/chapter1/hub-books";

export type { HubBookId };

const HUB_IMAGE_SRC = "/agent-cast/clive-wigglesworth/clive-study-hub.png";

type BookHotspot = {
  id: HubBookId;
  ariaLabel: string;
  left: string;
  width: string;
  top: string;
  height: string;
};

const BOOK_HOTSPOTS: BookHotspot[] = [
  {
    id: "welcome",
    ariaLabel: "Welcome — start Clive's welcome sequence",
    left: "8%",
    width: "14%",
    top: "35%",
    height: "50%",
  },
  {
    id: "reason",
    ariaLabel: "Reasoning with Clive — ask Clive about context and judgement",
    left: "26%",
    width: "22%",
    top: "35%",
    height: "50%",
  },
  {
    id: "architect",
    ariaLabel: "The Architect Journal — map your user brain and build the loop",
    left: "52%",
    width: "20%",
    top: "35%",
    height: "50%",
  },
  {
    id: "brain-building",
    ariaLabel: "Brain Building — learn how governed brains work",
    left: "76%",
    width: "19%",
    top: "35%",
    height: "50%",
  },
];

type CliveStudyHubProps = {
  onSelectBook: (book: HubBookId) => void;
};

export function CliveStudyHub({ onSelectBook }: CliveStudyHubProps) {
  return (
    <div className="clive-study-hub">
      <header className="clive-study-hub__header">
        <p className="clive-study-hub__label">Clive&apos;s study</p>
        <p className="clive-study-hub__subtitle">Chapter 1 — choose a book on the desk</p>
      </header>

      <div className="clive-study-hub__desk">
        <div className="clive-study-hub__surface">
          <Image
            src={HUB_IMAGE_SRC}
            alt="Bird's-eye view of Clive's desk with four leather-bound books: Welcome, Reasoning with Clive, The Architect Journal, and Brain Building"
            fill
            priority
            sizes="100vw"
            className="clive-study-hub__image"
          />
          {BOOK_HOTSPOTS.map((book) => (
            <button
              key={book.id}
              type="button"
              className="clive-study-hub__book"
              style={{
                left: book.left,
                width: book.width,
                top: book.top,
                height: book.height,
              }}
              aria-label={book.ariaLabel}
              onClick={() => onSelectBook(book.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
