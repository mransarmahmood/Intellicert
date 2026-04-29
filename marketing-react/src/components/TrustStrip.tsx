import { Brain, Repeat, GraduationCap, Layers } from 'lucide-react';

const items = [
  { icon: Brain, label: 'Spaced Repetition (SM-2)' },
  { icon: Repeat, label: 'Active Recall' },
  { icon: GraduationCap, label: 'Feynman Technique' },
  { icon: Layers, label: "Bloom's Taxonomy" },
];

export default function TrustStrip() {
  return (
    <section className="border-y border-white/5 bg-navy-950/40 py-10 backdrop-blur">
      <div className="wrap">
        <div className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
          Built on proven cognitive science
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {items.map((it) => (
            <div key={it.label} className="flex items-center gap-2 text-[14px] font-medium text-ink-dim">
              <it.icon size={16} className="text-brand-400" />
              {it.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
