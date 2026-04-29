// AI-powered "Smart Study Tools" card with 5 actions wired to /api/ai/explain.
// Result renders inline below the buttons in a markdown-like presentation.

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, MessageSquare, Layers, HelpCircle, Lightbulb, Image as ImageIcon, Loader2, X } from 'lucide-react';
import { api } from '../lib/api';
import AudioListener from './AudioListener';

type Mode = 'discuss' | 'three-layer' | 'quiz' | 'simple' | 'illustration' | 'tutor';

const ACTIONS: { mode: Mode; label: string; icon: any; tone: string }[] = [
  { mode: 'tutor',        label: 'AI Tutor',              icon: Bot,           tone: 'from-indigo-500 to-indigo-700' },
  { mode: 'discuss',      label: 'Discuss this topic',    icon: MessageSquare, tone: 'from-purple-500 to-purple-700' },
  { mode: 'three-layer',  label: '3-Layer Detail Understanding',       icon: Layers,        tone: 'from-blue-500 to-blue-700' },
  { mode: 'quiz',         label: 'Generate quiz questions', icon: HelpCircle,  tone: 'from-emerald-500 to-emerald-700' },
  { mode: 'simple',       label: 'Simple Detail Understanding',        icon: Lightbulb,     tone: 'from-amber-500 to-orange-600' },
  { mode: 'illustration', label: 'Generate illustration', icon: ImageIcon,     tone: 'from-cyan-500 to-blue-600' },
];

type Phase = { title: string; body: string };

function parseThreeLayer(raw: string): Phase[] {
  const text = (raw || '').trim();
  if (!text) {
    return [
      { title: 'Phase 1 - Detail Understanding Steps', body: 'No content returned yet.' },
      { title: 'Phase 2 - Visual Breakdown', body: 'No visual details returned yet.' },
      { title: 'Phase 3 - Applied Check', body: 'No applied check returned yet.' },
    ];
  }

  // Try to parse headings like:
  // "Layer 1 - ...", "## Layer 2: ...", "Phase 3 — ..."
  const headingRx = /(?:^|\n)\s*(?:#{1,6}\s*)?(?:Layer|Phase)\s*([123])\s*[-:—]?\s*([^\n]*)/gi;
  const matches: { idx: number; num: number; title: string }[] = [];
  let m: RegExpExecArray | null = null;
  while ((m = headingRx.exec(text))) {
    matches.push({ idx: m.index, num: Number(m[1]), title: m[2].trim() });
  }

  if (matches.length >= 2) {
    const phases: Phase[] = [];
    for (let i = 0; i < matches.length; i++) {
      const cur = matches[i];
      const nextIdx = i + 1 < matches.length ? matches[i + 1].idx : text.length;
      const chunk = text.slice(cur.idx, nextIdx).trim();
      const body = chunk.replace(/^\s*(?:#{1,6}\s*)?(?:Layer|Phase)\s*[123]\s*[-:—]?\s*[^\n]*\n?/i, '').trim();
      const fallback = cur.num === 1
        ? 'Detail Understanding Steps'
        : cur.num === 2
          ? 'Visual Breakdown'
          : 'Applied Check';
      phases.push({ title: `Phase ${cur.num} - ${cur.title || fallback}`, body: body || 'No details provided.' });
    }
    // Normalize to exactly 3 phases
    const out = [1, 2, 3].map((n) => phases.find((p) => p.title.startsWith(`Phase ${n}`)) ?? null);
    return out.map((p, i) => p ?? {
      title: `Phase ${i + 1} - ${i === 0 ? 'Detail Understanding Steps' : i === 1 ? 'Visual Breakdown' : 'Applied Check'}`,
      body: 'No details provided for this phase.',
    });
  }

  // Fallback: split text into 3 chunks by paragraphs.
  const parts = text.split(/\n\s*\n/).filter(Boolean);
  const take = Math.max(1, Math.ceil(parts.length / 3));
  const p1 = parts.slice(0, take).join('\n\n').trim();
  const p2 = parts.slice(take, take * 2).join('\n\n').trim();
  const p3 = parts.slice(take * 2).join('\n\n').trim();
  return [
    { title: 'Phase 1 - Detail Understanding Steps', body: p1 || 'No details provided yet.' },
    { title: 'Phase 2 - Visual Breakdown', body: p2 || 'No visual details provided.' },
    { title: 'Phase 3 - Applied Check', body: p3 || 'No applied check provided.' },
  ];
}

export default function SmartStudyTools({ topicId }: { topicId: number }) {
  const [activeMode, setActiveMode] = useState<Mode | null>(null);
  const [content, setContent] = useState<string>('');
  const [err, setErr] = useState<string>('');

  const m = useMutation({
    mutationFn: (mode: Mode) =>
      api<{ content: string }>('/ai/explain', {
        method: 'POST',
        body: JSON.stringify({ topic_id: topicId, mode }),
      }),
    onSuccess: (r) => { setContent(r.content); setErr(''); },
    onError: (e: Error) => { setErr(e.message); setContent(''); },
  });

  const run = (mode: Mode) => {
    setActiveMode(mode);
    setContent('');
    m.mutate(mode);
  };

  const close = () => {
    setActiveMode(null);
    setContent('');
    setErr('');
  };

  const activeAction = ACTIONS.find((a) => a.mode === activeMode);

  return (
    <div className="card mt-8 overflow-hidden">
      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 text-white shadow-sm">
            <Bot size={18} />
          </div>
          <div>
            <h3 className="font-display text-[16px] font-bold text-ink">Smart Study Tools</h3>
            <div className="text-[11.5px] text-ink-dim">AI-powered ways to explore this topic</div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap gap-2 border-t border-ink-line bg-surface/40 px-5 py-4">
        {ACTIONS.map((a) => {
          const Icon = a.icon;
          const isActive = activeMode === a.mode;
          return (
            <button
              key={a.mode}
              onClick={() => run(a.mode)}
              disabled={m.isPending}
              className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition ${
                isActive
                  ? `border-transparent text-white bg-gradient-to-r ${a.tone}`
                  : 'border-ink-line bg-white text-ink-body hover:border-slate-300 hover:bg-white'
              } ${m.isPending && !isActive ? 'opacity-60' : ''}`}
            >
              <Icon size={13} /> {a.label}
            </button>
          );
        })}
      </div>

      {/* Result */}
      <AnimatePresence>
        {(m.isPending || content || err) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden border-t border-ink-line"
          >
            <div className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-[11px] font-bold uppercase tracking-wider text-ink-dim">
                  {activeAction?.label}
                </div>
                <div className="flex items-center gap-2">
                  {content && <AudioListener text={content} label="Listen" />}
                  <button onClick={close} className="grid h-7 w-7 place-items-center rounded-full text-ink-muted hover:bg-slate-100">
                    <X size={14} />
                  </button>
                </div>
              </div>
              {m.isPending && (
                <div className="flex items-center gap-2 py-8 text-[13px] text-ink-dim">
                  <Loader2 className="animate-spin" size={15} /> Generating with AI...
                </div>
              )}
              {err && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-700">{err}</div>
              )}
              {content && (
                activeMode === 'three-layer' ? (
                  <div className="space-y-3">
                    {parseThreeLayer(content).map((phase, i) => (
                      <div key={i} className="rounded-xl border border-ink-line bg-surface px-4 py-3">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-brand-700">{phase.title}</div>
                        <div className="mt-1 whitespace-pre-line text-[13.5px] leading-relaxed text-ink-body">
                          {phase.body}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="whitespace-pre-line text-[13.5px] leading-relaxed text-ink-body">
                    {content}
                  </div>
                )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
