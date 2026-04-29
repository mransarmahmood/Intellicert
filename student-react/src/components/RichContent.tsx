// Parses a long description string into visual blocks:
//  - intro paragraph
//  - numbered procedure steps (1) ... 2) ... 3) ...) → visual step flow
//  - "Example:" / "Real-world Example:" → callout card
//  - "Important:" / "Key:" / "Note:" → highlighted note
//  - remaining prose
//
// Used by TopicPage concept cards so each individual concept gets its own
// mini flowchart / action steps when the source data has them embedded inline.

import { Lightbulb, ListOrdered, AlertTriangle, ArrowRight } from 'lucide-react';

type Block =
  | { kind: 'paragraph'; text: string }
  | { kind: 'steps'; items: string[]; intro?: string }
  | { kind: 'example'; text: string }
  | { kind: 'note'; text: string };

export function parseRichContent(raw: string): Block[] {
  if (!raw) return [];
  const blocks: Block[] = [];

  // Split off "Example: ..." or "Real-world Example: ..." (everything to end of paragraph)
  // We'll find the first occurrence and pull it out, repeat for "Important:" / "Key:" / "Note:"
  let working = raw;

  // Pull out "Example:" callouts (case-insensitive, supports "Real-world Example:" too)
  const exampleRe = /(?:^|\s)((?:real-world\s+)?example:)\s*([^]*?)(?=(?:\.\s+[A-Z]|\.$|$))/i;
  const exMatch = working.match(exampleRe);
  let exampleText: string | null = null;
  if (exMatch) {
    exampleText = exMatch[2].trim().replace(/\s+/g, ' ');
    if (exampleText.length > 0 && !exampleText.endsWith('.')) exampleText += '.';
    working = working.replace(exMatch[0], ' ').replace(/\s+/g, ' ');
  }

  // Pull out "Important:" / "Key:" / "Note:" callouts
  const noteRe = /(?:^|\s)(important|key|note)\s*[:\-]\s*([^]*?)(?=(?:\.\s+[A-Z]|\.$|$))/i;
  const noteMatch = working.match(noteRe);
  let noteText: string | null = null;
  if (noteMatch) {
    noteText = noteMatch[2].trim().replace(/\s+/g, ' ');
    if (noteText.length > 0 && !noteText.endsWith('.')) noteText += '.';
    working = working.replace(noteMatch[0], ' ').replace(/\s+/g, ' ');
  }

  // Detect numbered procedure inside the working text:
  //  - "1) Foo. 2) Bar. 3) Baz."  OR  "(1) Foo (2) Bar (3) Baz"
  // Strategy: find all "(N)" / "N)" markers and split between them
  const stepRe = /\(?(\d+)\)\s+/g;
  const matches = [...working.matchAll(stepRe)];
  if (matches.length >= 3) {
    // Take everything before the first marker as the intro
    const firstStart = matches[0].index ?? 0;
    const intro = working.slice(0, firstStart).trim().replace(/[:\s]+$/, '');
    const items: string[] = [];
    for (let i = 0; i < matches.length; i++) {
      const start = (matches[i].index ?? 0) + matches[i][0].length;
      const end = i + 1 < matches.length ? matches[i + 1].index ?? working.length : working.length;
      let chunk = working.slice(start, end).trim();
      // strip trailing list-separator characters and excessive periods
      chunk = chunk.replace(/[;,]\s*$/, '').replace(/\s{2,}/g, ' ');
      if (chunk.length > 0) items.push(chunk);
    }

    if (intro) blocks.push({ kind: 'paragraph', text: intro });
    blocks.push({ kind: 'steps', items });
  } else if (working.trim()) {
    blocks.push({ kind: 'paragraph', text: working.trim() });
  }

  if (noteText)    blocks.push({ kind: 'note',    text: noteText });
  if (exampleText) blocks.push({ kind: 'example', text: exampleText });

  return blocks;
}

// ────────────────────────────────────────────────────────────

export default function RichContent({ text, accent = '#EA580C' }: { text: string; accent?: string }) {
  const blocks = parseRichContent(text);
  if (blocks.length === 0) return null;
  return (
    <div className="space-y-3">
      {blocks.map((b, i) => {
        if (b.kind === 'paragraph') {
          return (
            <p key={i} className="whitespace-pre-line text-[13.5px] leading-relaxed text-ink-body">
              {b.text}
            </p>
          );
        }
        if (b.kind === 'steps') {
          return <StepFlow key={i} items={b.items} accent={accent} />;
        }
        if (b.kind === 'example') {
          return (
            <div key={i} className="rounded-xl border border-blue-200 bg-blue-50/60 p-3.5">
              <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                <Lightbulb size={11} /> Example
              </div>
              <p className="text-[13px] leading-relaxed text-ink-body">{b.text}</p>
            </div>
          );
        }
        if (b.kind === 'note') {
          return (
            <div key={i} className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5">
              <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                <AlertTriangle size={11} /> Important
              </div>
              <p className="text-[13px] leading-relaxed text-ink-body">{b.text}</p>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}

// ────────────────────────────────────────────────────────────

function StepFlow({ items, accent }: { items: string[]; accent: string }) {
  return (
    <div className="rounded-xl border border-ink-line bg-surface/60 p-4">
      <div className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-dim">
        <ListOrdered size={11} /> {items.length} action steps
      </div>
      <ol className="space-y-2.5">
        {items.map((step, i) => (
          <li key={i} className="flex items-start gap-3">
            <span
              className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg font-display text-[12px] font-bold text-white shadow-sm"
              style={{ background: `linear-gradient(135deg, ${accent}, ${accent}CC)` }}
            >
              {i + 1}
            </span>
            <span className="flex-1 text-[13px] leading-relaxed text-ink-body">
              {step}
              {i < items.length - 1 && <ArrowRight size={11} className="ml-1.5 inline text-ink-muted opacity-50" />}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ────────────────────────────────────────────────────────────

/** Renders a mnemonic acronym as colorful letter tiles */
export function MnemonicTiles({ text }: { text: string; accent?: string }) {
  // Extract uppercase letters or letter-dash sequences from the title
  // e.g. "ESEAP — Hierarchy of Controls"  →  E S E A P
  // e.g. "M-S-M-S — Inherently Safer Design Strategies"  →  M S M S
  const head = text.split(/[—\-:]/)[0]?.trim() ?? text;
  const letters = head.replace(/[^A-Z]/g, '').split('');
  if (letters.length < 2 || letters.length > 8) return null;

  const colors = ['#EA580C', '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899'];
  return (
    <div className="mb-3 flex flex-wrap gap-1.5">
      {letters.map((l, i) => {
        const c = colors[i % colors.length];
        return (
          <div
            key={i}
            className="grid h-10 w-10 place-items-center rounded-xl font-display text-[18px] font-extrabold text-white shadow-sm"
            style={{ background: `linear-gradient(135deg, ${c}, ${c}CC)` }}
          >
            {l}
          </div>
        );
      })}
    </div>
  );
}
