/**
 * Safe assistant-Markdown renderer for the Living Folio.
 *
 * The assistant's copy arrives with light Markdown structure (`**bold**`,
 * `*em*`, `---` thematic breaks, `- ` bullets / `1. ` ordered items, and
 * inline links). Until now it was printed as a raw string, so the markup
 * leaked to the page. This renders the supported structure as semantic
 * live HTML — paragraphs, strong/em, ul/ol, hr, a — BEFORE the folio ink
 * classes apply, so the ink presets inherit onto real elements.
 *
 * SAFETY MODEL: this builds React elements, never a HTML string, and never
 * uses dangerouslySetInnerHTML. There is no path for arbitrary HTML or
 * scripts to reach the DOM — any raw `<tag>` in the source is treated as
 * literal text and escaped by React. Sanitisation is structural, not a
 * filter. Links are constrained to http(s) and same-site relative hrefs;
 * anything else renders as plain text.
 *
 * No dependency added — deliberately small and house-owned.
 */
import type { ReactNode } from "react";

type InlineToken =
  | { kind: "text"; text: string }
  | { kind: "strong"; text: string }
  | { kind: "em"; text: string }
  | { kind: "link"; text: string; href: string };

const STRONG = /\*\*([^*]+)\*\*/g;
const EM = /(^|[^*])\*([^*\n]+)\*(?!\*)/g;
const LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g;

function safeHref(href: string): string | null {
  const h = href.trim();
  if (/^https?:\/\//i.test(h)) return h;
  if (h.startsWith("/") && !h.startsWith("//")) return h;
  return null;
}

/** Parse inline Markdown (strong, em, links) into React nodes. */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  // strong/em within a plain-text chunk
  const richText = (chunk: string, base: string): ReactNode[] => {
    const out: ReactNode[] = [];
    const em = (sub: string, subBase: string) => {
      let ei = 0;
      let m: RegExpExecArray | null;
      const re = new RegExp(EM.source, "g");
      let k = 0;
      while ((m = re.exec(sub))) {
        if (m.index > ei) out.push(sub.slice(ei, m.index + (m[1] ? 1 : 0)));
        out.push(<em key={`${subBase}-em${k++}`}>{m[2]}</em>);
        ei = re.lastIndex;
      }
      if (ei < sub.length) out.push(sub.slice(ei));
    };
    let li = 0;
    let m: RegExpExecArray | null;
    const re = new RegExp(STRONG.source, "g");
    let k = 0;
    while ((m = re.exec(chunk))) {
      if (m.index > li) em(chunk.slice(li, m.index), `${base}-t${k}`);
      out.push(<strong key={`${base}-s${k++}`}>{m[1]}</strong>);
      li = re.lastIndex;
    }
    if (li < chunk.length) em(chunk.slice(li), `${base}-t${k}`);
    return out;
  };

  const nodes: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  const re = new RegExp(LINK.source, "g");
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) nodes.push(...richText(text.slice(last, m.index), `${keyPrefix}-p${k}`));
    const href = safeHref(m[2]);
    if (href) {
      const external = /^https?:\/\//i.test(href);
      nodes.push(
        <a
          key={`${keyPrefix}-a${k++}`}
          href={href}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {m[1]}
        </a>,
      );
    } else {
      nodes.push(...richText(m[1], `${keyPrefix}-x${k++}`));
    }
    last = re.lastIndex;
  }
  if (last < text.length) nodes.push(...richText(text.slice(last), `${keyPrefix}-p${k}`));

  return nodes.filter((n) => n !== "" && n != null);
}

type Block =
  | { kind: "para"; text: string }
  | { kind: "hr" }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] };

function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  const lines = text.split("\n");
  let para: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flushPara = () => {
    const t = para.join(" ").trim();
    if (t) blocks.push({ kind: "para", text: t });
    para = [];
  };
  const flushList = () => {
    if (list && list.items.length) {
      blocks.push(list.ordered ? { kind: "ol", items: list.items } : { kind: "ul", items: list.items });
    }
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const trimmed = line.trim();

    // Thematic break: ---  ***  ___  (3+ of the same)
    if (/^\s*([-*_])\s*(\1\s*){2,}$/.test(trimmed)) {
      flushPara();
      flushList();
      blocks.push({ kind: "hr" });
      continue;
    }

    // Unordered list item
    const ul = /^[-*•]\s+(.+)$/.exec(trimmed);
    if (ul) {
      flushPara();
      if (!list || list.ordered) {
        flushList();
        list = { ordered: false, items: [] };
      }
      list.items.push(ul[1]);
      continue;
    }

    // Ordered list item
    const ol = /^\d+[.)]\s+(.+)$/.exec(trimmed);
    if (ol) {
      flushPara();
      if (!list || !list.ordered) {
        flushList();
        list = { ordered: true, items: [] };
      }
      list.items.push(ol[1]);
      continue;
    }

    // Blank line: paragraph boundary
    if (!trimmed) {
      flushPara();
      flushList();
      continue;
    }

    // Continuation of a list (indented) — treat as part of current item
    if (list && /^\s{2,}\S/.test(line)) {
      list.items[list.items.length - 1] += " " + trimmed;
      continue;
    }

    flushList();
    para.push(trimmed);
  }
  flushPara();
  flushList();
  return blocks;
}

export type StudyMarkdownProps = {
  content: string;
  /** Class applied to each paragraph (the folio body ink preset). */
  paragraphClassName?: string;
};

/**
 * Render supported assistant Markdown as semantic live HTML. Returns a
 * fragment of <p>/<ul>/<ol>/<hr> nodes with inline strong/em/a.
 */
export function StudyMarkdown({ content, paragraphClassName }: StudyMarkdownProps) {
  const blocks = parseBlocks(content);
  return (
    <>
      {blocks.map((block, i) => {
        const key = `md-${i}`;
        if (block.kind === "hr") {
          return <hr key={key} className="clive-chat__hr" />;
        }
        if (block.kind === "ul") {
          return (
            <ul key={key} className="clive-chat__list">
              {block.items.map((item, j) => (
                <li key={`${key}-${j}`}>{renderInline(item, `${key}-${j}`)}</li>
              ))}
            </ul>
          );
        }
        if (block.kind === "ol") {
          return (
            <ol key={key} className="clive-chat__list clive-chat__list--ordered">
              {block.items.map((item, j) => (
                <li key={`${key}-${j}`}>{renderInline(item, `${key}-${j}`)}</li>
              ))}
            </ol>
          );
        }
        return (
          <p key={key} className={paragraphClassName}>
            {renderInline(block.text, key)}
          </p>
        );
      })}
    </>
  );
}
