import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Command, ArrowRight, BookOpen, Users, Library, Layers, HelpCircle,
  Tag, CreditCard, BarChart3, Settings, Activity, Wand2, LayoutDashboard, Hash,
  ShieldCheck, Zap,
} from 'lucide-react';
import { api } from '../lib/api';

type Cmd = {
  id: string;
  group: 'jump' | 'topic' | 'user' | 'content' | 'action';
  label: string;
  hint?: string;
  to?: string;
  onRun?: () => void;
  Icon: typeof Search;
};

const ROUTES: Cmd[] = [
  { id: 'r:dashboard',     group: 'jump', label: 'Dashboard',         to: '/dashboard',    Icon: LayoutDashboard },
  { id: 'r:users',         group: 'jump', label: 'Users',             to: '/users',        Icon: Users },
  { id: 'r:topics',        group: 'jump', label: 'Topics',            to: '/topics',       Icon: BookOpen },
  { id: 'r:topics-new',    group: 'jump', label: 'Add Topic (AI)',    to: '/topics/new',   Icon: Wand2 },
  { id: 'r:completeness',  group: 'jump', label: 'Topic Completeness',to: '/topics/health',Icon: Activity, hint: 'See content gaps' },
  { id: 'r:content',       group: 'jump', label: 'Content Library',   to: '/content',      Icon: Library },
  { id: 'r:flashcards',    group: 'jump', label: 'Flashcards',        to: '/flashcards',   Icon: Layers },
  { id: 'r:quizzes',       group: 'jump', label: 'Quizzes',           to: '/quizzes',      Icon: HelpCircle },
  { id: 'r:coupons',       group: 'jump', label: 'Coupons',           to: '/coupons',      Icon: Tag },
  { id: 'r:subs',          group: 'jump', label: 'Subscriptions',     to: '/subscriptions',Icon: CreditCard },
  { id: 'r:analytics',     group: 'jump', label: 'Analytics',         to: '/analytics',    Icon: BarChart3 },
  { id: 'r:settings',      group: 'jump', label: 'Settings',          to: '/settings',     Icon: Settings },
  { id: 'r:activity',      group: 'jump', label: 'Activity Log',      to: '/activity',     Icon: ShieldCheck },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Open on Cmd/Ctrl+K (or just /)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQ('');
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Live data sources (only when palette open)
  const topicsQ = useQuery({
    queryKey: ['cmdk-topics'],
    queryFn: () => api<{ topics: any[] }>('/topics'),
    enabled: open,
    staleTime: 60_000,
  });
  const usersQ = useQuery({
    queryKey: ['cmdk-users'],
    queryFn: () => api<{ users: any[] }>('/admin/users?limit=50'),
    enabled: open,
    staleTime: 60_000,
  });
  const contentQ = useQuery({
    queryKey: ['cmdk-content'],
    queryFn: () => api<{ items: any[] }>('/admin/content'),
    enabled: open,
    staleTime: 60_000,
  });

  const allCommands: Cmd[] = useMemo(() => {
    const topics: Cmd[] = (topicsQ.data?.topics || []).map((t: any) => ({
      id: `t:${t.id}`,
      group: 'topic',
      label: t.name,
      hint: t.domain_id,
      to: `/topics/${t.id}`,
      Icon: BookOpen,
    }));
    const users: Cmd[] = (usersQ.data?.users || []).map((u: any) => ({
      id: `u:${u.id}`,
      group: 'user',
      label: u.name || u.email,
      hint: u.email,
      to: '/users',
      Icon: Users,
    }));
    const content: Cmd[] = (contentQ.data?.items || []).map((c: any) => ({
      id: `c:${c.id}`,
      group: 'content',
      label: c.title,
      hint: c.original_filename,
      to: '/content',
      Icon: Library,
    }));
    return [...ROUTES, ...topics, ...users, ...content];
  }, [topicsQ.data, usersQ.data, contentQ.data]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return allCommands.filter((c) => c.group === 'jump').slice(0, 12);
    return allCommands
      .filter((c) =>
        c.label.toLowerCase().includes(needle) ||
        (c.hint || '').toLowerCase().includes(needle)
      )
      .slice(0, 24);
  }, [q, allCommands]);

  // Reset cursor when filter changes
  useEffect(() => { setActive(0); }, [q]);

  const run = (cmd: Cmd) => {
    setOpen(false);
    if (cmd.to) navigate(cmd.to);
    else if (cmd.onRun) cmd.onRun();
  };

  // Keyboard navigation in list
  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[active]) run(filtered[active]);
    }
  };

  // Group filtered list for rendering
  const groups: Record<string, Cmd[]> = {};
  filtered.forEach((c) => {
    (groups[c.group] = groups[c.group] || []).push(c);
  });
  const groupOrder: Cmd['group'][] = ['jump', 'topic', 'user', 'content', 'action'];
  const groupTitle: Record<Cmd['group'], string> = {
    jump: 'Jump to',
    topic: 'Topics',
    user: 'Users',
    content: 'Content Library',
    action: 'Actions',
  };

  let cursor = 0;

  return (
    <>
      {/* Floating launcher (visible on every page) */}
      <button
        onClick={() => setOpen(true)}
        title="Open command palette (Ctrl/Cmd+K)"
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full border border-ink-line bg-white px-4 py-2.5 shadow-card hover:shadow-cardHover hover:border-slate-300"
      >
        <Search size={14} className="text-ink-dim" />
        <span className="text-[12px] font-semibold text-ink">Search</span>
        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-ink-muted">
          <kbd className="rounded border border-ink-line bg-surface px-1 py-0.5 font-sans">Ctrl</kbd>
          <kbd className="rounded border border-ink-line bg-surface px-1 py-0.5 font-sans">K</kbd>
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-start justify-center bg-slate-900/45 backdrop-blur-sm pt-[10vh] px-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.97, y: -10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.97, y: -10 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="card w-full max-w-xl overflow-hidden"
            >
              <div className="flex items-center gap-2 border-b border-ink-line px-4 py-3">
                <Command size={16} className="text-ink-dim" />
                <input
                  ref={inputRef}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={onInputKey}
                  placeholder="Search topics, users, content, jump to a page…"
                  className="flex-1 bg-transparent text-[14px] text-ink placeholder:text-ink-muted outline-none"
                />
                <span className="rounded border border-ink-line bg-surface px-1.5 py-0.5 text-[10px] font-bold text-ink-muted">ESC</span>
              </div>

              <div className="max-h-[55vh] overflow-y-auto p-2">
                {filtered.length === 0 ? (
                  <div className="grid place-items-center py-10 text-[13px] text-ink-dim">
                    <Zap className="mb-1 opacity-40" size={20} />
                    No matches for "{q}"
                  </div>
                ) : (
                  groupOrder.filter((g) => groups[g]?.length).map((g) => (
                    <div key={g} className="mb-1.5">
                      <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                        {groupTitle[g]}
                      </div>
                      {groups[g].map((cmd) => {
                        const idx = cursor++;
                        const isActive = idx === active;
                        return (
                          <button
                            key={cmd.id}
                            onMouseEnter={() => setActive(idx)}
                            onClick={() => run(cmd)}
                            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                              isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-body hover:bg-slate-50'
                            }`}
                          >
                            <cmd.Icon size={15} className="shrink-0" />
                            <span className="flex-1 truncate text-[13.5px] font-semibold">{cmd.label}</span>
                            {cmd.hint && (
                              <span className="text-[11px] text-ink-muted truncate max-w-[180px]">{cmd.hint}</span>
                            )}
                            <ArrowRight size={13} className={isActive ? 'text-brand-600' : 'text-ink-muted'} />
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-ink-line bg-surface px-4 py-2 text-[11px] text-ink-dim">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1"><Hash size={11} /> {filtered.length}</span>
                  <span className="inline-flex items-center gap-1">↑↓ navigate</span>
                  <span className="inline-flex items-center gap-1">↵ open</span>
                </div>
                <div className="font-display font-bold text-brand-600">⌘K</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
