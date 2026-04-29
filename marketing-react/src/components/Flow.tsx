import SectionHead from './SectionHead';
import Reveal from './Reveal';
import {
  Zap,
  HelpCircle,
  BookOpen,
  Workflow,
  Lightbulb,
  Brain,
  RotateCw,
  FlaskConical,
  GraduationCap,
  Flag,
} from 'lucide-react';

const steps = [
  { n: '01', icon: Zap, title: 'Hook', desc: 'Curiosity trigger that primes your brain to pay attention.' },
  { n: '02', icon: HelpCircle, title: 'Try First', desc: 'Attempt before you learn — even wrong guesses boost retention.' },
  { n: '03', icon: BookOpen, title: 'Core', desc: 'Chunked micro-lessons designed around working memory limits.' },
  { n: '04', icon: Workflow, title: 'Visual', desc: 'Infographics and diagrams that encode concepts dual-channel.' },
  { n: '05', icon: Lightbulb, title: 'Example', desc: 'Real-world scenarios that build transferable mental models.' },
  { n: '06', icon: Brain, title: 'Memory', desc: 'Mnemonics and anchors to lock concepts into long-term storage.' },
  { n: '07', icon: RotateCw, title: 'Recall', desc: 'Retrieval practice — the single most powerful learning tool.' },
  { n: '08', icon: FlaskConical, title: 'Apply', desc: 'Scenario-based decision trees that simulate real exam questions.' },
  { n: '09', icon: GraduationCap, title: 'Teach', desc: "Feynman-mode teach-back reveals what you don't quite know yet." },
  { n: '10', icon: Flag, title: 'Summary', desc: '3-bullet recap plus next spaced-review automatically scheduled.' },
];

export default function Flow() {
  return (
    <section id="flow" className="relative py-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-slate-200/60" />
      <div className="mx-auto w-full max-w-[1320px] px-6 sm:px-10">
        <SectionHead
          eyebrow="The Learning Flow"
          title="10 steps. One mastered concept."
          desc="Each concept is reinforced through a structured learning loop — similar to how top CSP preparation systems combine theory, practice, and application."
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={(i % 5) * 0.05}>
              <div className="group relative h-full">
                {/* Gradient border wrapper */}
                <div className="absolute -inset-px rounded-2xl bg-brand-400/20 opacity-60 blur transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative h-full overflow-hidden rounded-2xl border border-ink-line bg-white p-6 shadow-card transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-cardHover">
                  {/* Top accent bar that animates in */}
                  <div className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-brand-600 transition-transform duration-500 group-hover:scale-x-100" />

                  {/* Step number chip */}
                  <div className="absolute right-4 top-4 rounded-full bg-surface px-2.5 py-0.5 font-display text-[10px] font-bold text-ink-dim ring-1 ring-ink-line">
                    Step {s.n}
                  </div>

                  {/* Icon — gradient tile + glow */}
                  <div className="relative mb-5 inline-block">
                    <div className="absolute inset-0 rounded-2xl bg-brand-500/30 blur-xl transition-all duration-500 group-hover:bg-brand-500/50 group-hover:blur-2xl" />
                    <div className="relative grid h-14 w-14 place-items-center rounded-2xl bg-brand-600 text-white shadow-[0_10px_25px_-8px_rgba(234,88,12,.55)] ring-1 ring-white/40 transition-transform duration-500 group-hover:rotate-6 group-hover:scale-105">
                      <s.icon size={22} strokeWidth={2.25} />
                    </div>
                  </div>

                  <h4 className="font-display text-[17px] font-bold text-ink">{s.title}</h4>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-body">{s.desc}</p>

                  {/* Decorative corner gradient */}
                  <div
                    className="pointer-events-none absolute -bottom-12 -right-12 h-32 w-32 rounded-full bg-brand-500/8 blur-2xl transition-opacity duration-500 opacity-0 group-hover:opacity-100"
                  />
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
