"use client";

/**
 * Living Folio ink-system example (dev-only visual reference).
 *
 * NOT a product route — a story/example page for judging the ink material:
 * body, heading, small label, bold, italic and link text on the live folio
 * parchment, beside an engraved brass plate (a separate material). Exists
 * so Kathryn/TL and Matthew can eyeball the treatment at 1x and 2x DPR, in
 * Chromium and Safari, without walking the whole chapter.
 *
 * Everything on the page is live text — no distressed/pre-rendered assets.
 */
import { CliveStudyStage } from "@/components/chapter1/CliveStudyStage";

export default function FolioInkExamplePage() {
  return (
    <CliveStudyStage onReset={() => {}} label="Folio ink example" subtitle="Dev reference">
      <div className="chapter1-conversation">
        <div className="clive-chat clive-chat--study">
          <p className="clive-chat__prompt-label">Clive Wigglesworth</p>

          <h2 className="clive-welcome-caption" style={{ textTransform: "none", letterSpacing: "0.02em" }}>
            The ink belongs to the page
          </h2>

          <p className="clive-chat__prompt-text">
            Body copy sits in normal readable ink absorption — live, selectable,
            searchable, and pressed faintly into the parchment rather than laid
            on top of it. It reflows, it zooms to two hundred percent, and the
            browser's find-in-page sees every word of it.
          </p>

          <p className="clive-chat__prompt-text">
            <strong>Bold carries a slightly denser impression</strong> — the
            same ink pressed a shade harder — while <em>italic keeps the body
            impression</em>. A{" "}
            <a href="#folio-ink-example">live link</a> inherits the same
            material and keeps its underline.
          </p>

          <p className="clive-chat__prompt-text clive-chat__prompt-text--user">
            A user message reads as the same ink, only a touch quieter — muted
            ink, never a grey bubble.
          </p>

          <p className="study-doc-card__note study-doc-card__note--muted">
            Small label note — least texture, highest edge clarity.
          </p>

          <div className="chapter1-conversation__nav" style={{ marginTop: "1rem" }}>
            <button type="button" className="btn-primary">
              Engraved primary
            </button>
            <button type="button" className="btn-secondary">
              Engraved secondary
            </button>
            <button type="button" className="study-stage__ghost-btn">
              Ghost plate
            </button>
          </div>

          <p className="study-doc-card__note" style={{ marginTop: "1rem" }}>
            The engraved plates above are a separate material — crisp recessed
            lettering, not the paper-ink texture. Status seals/marks are SVG
            assets and never take body texture.
          </p>
        </div>
      </div>
    </CliveStudyStage>
  );
}
