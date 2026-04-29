import SectionHead from './SectionHead';
import Reveal from './Reveal';
import { CheckCircle2 } from 'lucide-react';

const points = [
  'Structured lessons and study guidance',
  'Practice questions with explanations',
  'Flexible self-paced learning',
  'Performance tracking and improvement focus',
];

export default function PrepMethods() {
  return (
    <section className="relative py-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-slate-200/60" />
      <div className="mx-auto w-full max-w-[1320px] px-6 sm:px-10">
        <SectionHead
          eyebrow="Preparation Framework"
          title="Built on what works in the best CSP prep systems"
          desc="Top CSP preparation providers emphasize structured study materials, practice problems, guided learning, and flexible access. IntelliCert builds on these proven methods and enhances them with memory science, adaptive learning, and modern digital tools."
        />
        <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
          {points.map((point, i) => (
            <Reveal key={point} delay={i * 0.05}>
              <div className="card p-5">
                <p className="flex items-start gap-3 text-[15px] text-ink-body">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-brand-600" />
                  {point}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
