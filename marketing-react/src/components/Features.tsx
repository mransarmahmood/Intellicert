import SectionHead from './SectionHead';
import Reveal from './Reveal';
import {
  RefreshCw,
  HelpCircle,
  GraduationCap,
  Brain,
  Compass,
  FileText,
  Gauge,
  Workflow,
  Trophy,
  ClipboardCheck,
} from 'lucide-react';

const features = [
  {
    icon: RefreshCw,
    title: 'Spaced Repetition Engine',
    desc: "SM-2 algorithm schedules every concept for review exactly when you're about to forget it. No more wasted study on things you already know.",
  },
  {
    icon: HelpCircle,
    title: 'Try Before You Learn',
    desc: 'Every topic opens with a 60-second warm-up quiz that activates prior knowledge — proven to double retention from the reading that follows.',
  },
  {
    icon: GraduationCap,
    title: 'Feynman Teach-Back Mode',
    desc: 'Explain a concept in your own words; the platform flags the gaps and routes you back to exactly what you need to review.',
  },
  {
    icon: Brain,
    title: 'Focus Mode & Memory Anchors',
    desc: 'A 60-second guided breathing and visualization ritual encodes upcoming concepts emotionally — an NLP-backed encoding boost.',
  },
  {
    icon: Compass,
    title: 'Personal Learning Coach',
    desc: "Dashboard surfaces your 3 highest-impact actions: what's due, where you're weakest, which concepts you're confusing.",
  },
  {
    icon: FileText,
    title: 'Workbook PDF Export',
    desc: 'Turn any domain into a printable workbook with answer keys, QR codes back to the app, and filterable difficulty levels.',
  },
  {
    icon: Gauge,
    title: 'Adaptive Difficulty Quizzes',
    desc: 'Questions adjust in real time to your mastery level — never too easy to bore you, never too hard to frustrate you.',
  },
  {
    icon: Workflow,
    title: 'Confusion Map',
    desc: 'Tracks which concepts you mix up and gives you side-by-side visual comparisons to finally lock in the difference.',
  },
  {
    icon: Trophy,
    title: 'Gamified Progress',
    desc: "XP, levels, streaks, and 15 unlockable badges keep your momentum going on days when motivation alone isn't enough.",
  },
  {
    icon: ClipboardCheck,
    title: 'Exam Simulation Mode',
    desc: 'Experience real CSP exam conditions with full-length mock exams, timed sessions, and performance breakdown across domains.',
  },
];

export default function Features() {
  return (
    <section id="features" className="relative py-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-slate-200/60" />
      <div className="mx-auto w-full max-w-[1320px] px-6 sm:px-10">
        <SectionHead
          eyebrow="Everything You Need"
          title="A complete CSP preparation system — built for real understanding"
          desc="Inspired by leading CSP preparation platforms, IntelliCert combines structured learning, guided practice, and intelligent feedback into one modern system designed for deeper understanding and faster results."
        />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 0.06}>
              <div className="card card-hover group relative h-full overflow-hidden p-7">
                <div className="pointer-events-none absolute -right-16 -top-16 h-32 w-32 rounded-full bg-brand-300/10 blur-3xl transition-all duration-300 group-hover:bg-brand-400/20" />
                <div className="mb-5 grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-500/15 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <f.icon size={22} />
                </div>
                <h3 className="font-display text-[18px] font-bold text-ink">{f.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-ink-body">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
