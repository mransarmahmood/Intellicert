import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { StickyNote, X, Save, CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

type Note = {
  id: number;
  ref_type: string;
  ref_id: string;
  body: string;
  meta: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

type Props = {
  refType: 'topic' | 'concept' | 'flashcard' | 'quiz' | 'formula' | 'regulation';
  refId: string;
  /** What this note is attached to — shown in header for context */
  label?: string;
};

/**
 * Floating note panel — pinned bottom-right. Auto-saves the note 1.2s after
 * the user stops typing. Reuses /api/notes (PUT upserts, DELETE clears).
 *
 * Usage:
 *   <NotesPanel refType="topic" refId="ptd" label="Prevention through Design" />
 */
export default function NotesPanel({ refType, refId, label }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState('');
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const debounceRef = useRef<number | null>(null);

  const noteQ = useQuery({
    queryKey: ['note', refType, refId],
    queryFn: () => api<{ notes: Note[] }>('/notes', { params: { ref_type: refType, ref_id: refId } }),
    enabled: !!refId,
    staleTime: 60_000,
  });

  // Hydrate input from server response
  useEffect(() => {
    if (noteQ.data && !hydrated) {
      setBody(noteQ.data.notes?.[0]?.body || '');
      setHydrated(true);
    }
  }, [noteQ.data, hydrated]);

  const saveMut = useMutation({
    mutationFn: (text: string) => api('/notes', {
      method: 'PUT',
      body: JSON.stringify({ ref_type: refType, ref_id: refId, body: text }),
    }),
    onSuccess: () => {
      setSavedAt(Date.now());
      qc.invalidateQueries({ queryKey: ['note', refType, refId] });
    },
  });

  // Debounced auto-save
  useEffect(() => {
    if (!hydrated) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      saveMut.mutate(body);
    }, 1200);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [body, hydrated]);

  const charCount = body.length;
  const lastSavedAgoSec = savedAt ? Math.floor((Date.now() - savedAt) / 1000) : null;
  const hasNote = (noteQ.data?.notes?.[0]?.body?.length ?? 0) > 0 || charCount > 0;

  return (
    <>
      {/* Floating launcher (bottom-right) */}
      <button
        onClick={() => setOpen(true)}
        title="My notes (auto-saved)"
        className={`fixed bottom-5 right-5 z-30 inline-flex items-center gap-2 rounded-full border border-ink-line px-4 py-2.5 shadow-card hover:shadow-cardHover transition-all ${
          hasNote ? 'bg-amber-50 text-amber-900 border-amber-300' : 'bg-white text-ink'
        }`}
      >
        <StickyNote size={14} className={hasNote ? 'text-amber-600' : 'text-ink-dim'} />
        <span className="text-[12.5px] font-semibold">{hasNote ? 'My notes' : 'Add note'}</span>
        {charCount > 0 && (
          <span className="rounded-full bg-amber-200 px-1.5 py-0.5 text-[10px] font-bold text-amber-900 tabular-nums">
            {charCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ x: 360 }} animate={{ x: 0 }} exit={{ x: 360 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="ml-auto h-full w-full max-w-md bg-white shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-ink-line px-5 py-4 bg-amber-50/40">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-700">
                    <StickyNote size={12} /> My notes
                  </div>
                  <div className="font-display text-[16px] font-extrabold text-ink mt-0.5 truncate max-w-[280px]">
                    {label || `${refType} ${refId}`}
                  </div>
                  <div className="text-[11px] text-ink-dim mt-0.5">Private — only you can see this.</div>
                </div>
                <button onClick={() => setOpen(false)} className="text-ink-muted hover:text-ink p-1"><X size={18} /></button>
              </div>

              {/* Status bar */}
              <div className="flex items-center justify-between border-b border-ink-line bg-surface px-5 py-1.5 text-[11px]">
                <div>
                  {saveMut.isPending ? (
                    <span className="inline-flex items-center gap-1 text-blue-600"><Loader2 size={11} className="animate-spin" /> Saving…</span>
                  ) : savedAt ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600"><CheckCircle2 size={11} /> Saved {lastSavedAgoSec! > 4 ? `${lastSavedAgoSec}s ago` : 'now'}</span>
                  ) : noteQ.isLoading ? (
                    <span className="text-ink-dim">Loading…</span>
                  ) : (
                    <span className="text-ink-muted">Auto-saves as you type</span>
                  )}
                </div>
                <span className="text-ink-muted tabular-nums">{charCount.toLocaleString()} chars</span>
              </div>

              {/* Editor */}
              <div className="flex-1 overflow-hidden">
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={`Type your notes about this ${refType} here…\n\n• Anything you write is auto-saved.\n• Notes are personal — admins cannot see them.\n• Empty the box and tab away to delete.`}
                  className="h-full w-full resize-none border-0 bg-white p-5 text-[14px] leading-relaxed text-ink outline-none focus:ring-0"
                />
              </div>

              {/* Footer hint */}
              <div className="border-t border-ink-line bg-surface px-5 py-2.5 flex items-center justify-between text-[11.5px] text-ink-dim">
                <span>Press <kbd className="rounded border border-ink-line bg-white px-1 py-0.5 font-sans font-bold text-[10px]">ESC</kbd> to close</span>
                <button
                  onClick={() => saveMut.mutate(body)}
                  disabled={saveMut.isPending}
                  className="inline-flex items-center gap-1 rounded-md bg-ink px-2.5 py-1 text-[11px] font-bold text-white hover:bg-ink/90 disabled:opacity-50"
                >
                  <Save size={11} /> Save now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
