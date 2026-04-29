// Compact infographic strip showing how much content this topic has,
// with animated count-up numbers.

import { useEffect, useState } from 'react';
import { BookOpen, Sparkles, Layers, HelpCircle, Workflow, Brain, Lightbulb, Scale } from 'lucide-react';

type Stat = { label: string; value: number; icon: any; color: string };

function CountUp({ to }: { to: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (to <= 0) { setN(0); return; }
    const start = performance.now();
    const dur = 700;
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(eased * to));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <>{n}</>;
}

export default function TopicStatsStrip({
  concepts,
  diagrams,
  mnemonics,
  examTips,
  regulations,
  flashcards,
  quizzes,
  formulas,
}: {
  concepts: number;
  diagrams: number;
  mnemonics: number;
  examTips: number;
  regulations: number;
  flashcards: number;
  quizzes: number;
  formulas: number;
}) {
  const stats: Stat[] = [
    { label: 'Concepts',    value: concepts,    icon: BookOpen,   color: 'from-brand-500 to-brand-700' },
    { label: 'Visuals',     value: diagrams,    icon: Workflow,   color: 'from-purple-500 to-purple-700' },
    { label: 'Mnemonics',   value: mnemonics,   icon: Brain,      color: 'from-pink-500 to-fuchsia-600' },
    { label: 'Exam tips',   value: examTips,    icon: Lightbulb,  color: 'from-amber-500 to-orange-600' },
    { label: 'Regulations', value: regulations, icon: Scale,      color: 'from-red-500 to-red-700' },
    { label: 'Flashcards',  value: flashcards,  icon: Layers,     color: 'from-blue-500 to-blue-700' },
    { label: 'Quizzes',     value: quizzes,     icon: HelpCircle, color: 'from-emerald-500 to-emerald-700' },
    { label: 'Formulas',    value: formulas,    icon: Sparkles,   color: 'from-indigo-500 to-indigo-700' },
  ].filter((s) => s.value > 0);

  if (stats.length === 0) return null;

  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
      {stats.map((s) => (
        <div
          key={s.label}
          className="relative overflow-hidden rounded-2xl border border-ink-line bg-white p-3 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-cardHover"
        >
          <div className={`mb-2 inline-grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br ${s.color} text-white shadow-sm`}>
            <s.icon size={14} />
          </div>
          <div className="font-display text-2xl font-extrabold leading-none text-ink">
            <CountUp to={s.value} />
          </div>
          <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-ink-dim">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
