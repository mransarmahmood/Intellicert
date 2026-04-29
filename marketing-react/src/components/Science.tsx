import SectionHead from './SectionHead';
import Reveal from './Reveal';

const stats = [
  { num: '2×', label: 'Long-term recall vs. passive re-reading — Karpicke & Roediger, 2008' },
  { num: '50%', label: 'Less study time needed with spaced repetition vs. massed practice' },
  { num: '261', label: 'Expert-verified flashcards across all 7 CSP exam domains' },
  { num: '100%', label: 'Pass guarantee — free extension if you complete the course' },
];

export default function Science() {
  return (
    <section id="science" className="relative py-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-slate-200/60" />
      <div className="mx-auto w-full max-w-[1320px] px-6 sm:px-10">
        <SectionHead
          eyebrow="Why It Works"
          title="Cognitive science, not cram sessions."
          desc="Every feature is designed using proven learning science and aligned with how professionals prepare for high-stakes certifications like CSP — combining memory retention, active practice, and real-world application."
        />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal key={s.num} delay={i * 0.06}>
              <div className="card card-hover relative h-full overflow-hidden p-7">
                <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-brand-400/15 blur-2xl" />
                <div className="font-display text-5xl font-extrabold tracking-tight text-brand-700">
                  {s.num}
                </div>
                <p className="mt-4 text-[14px] leading-relaxed text-ink-body">{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
