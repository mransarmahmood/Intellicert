import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import SectionHead from './SectionHead';

const faqs = [
  {
    q: 'How is this different from Quizlet or a textbook?',
    a: 'Traditional resources provide information. IntelliCert provides a structured learning system that combines explanation, practice, and memory reinforcement — helping you understand concepts and apply them in exam scenarios.',
  },
  {
    q: 'How long does it take to prepare for the CSP?',
    a: "Most candidates study 3–6 months. Because IntelliCert is built on spaced repetition, you'll spend less total time and retain more. The 6-month plan is sized for a comfortable, complete preparation with room to spare.",
  },
  {
    q: 'What happens if I fail the exam?',
    a: "You get free access until you pass — no questions asked. If you've completed the curriculum and didn't pass, we extend your account at no cost. We built this platform to get you to a pass, and we stand behind it.",
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel from your dashboard in one click. No retention calls, no dark patterns. Your access continues until the end of your current billing period.',
  },
  {
    q: 'Does it work on mobile?',
    a: 'Yes — IntelliCert is a responsive web app that works on phone, tablet, and desktop. Install it to your home screen for an app-like experience with offline flashcards.',
  },
  {
    q: 'Who writes the content?',
    a: 'Content is curated and verified by practicing CSPs and reviewed against the BCSP exam blueprint. Every formula, regulation, and calculation is source-checked to eliminate the kinds of errors that plague free resources.',
  },
  {
    q: 'What does a strong CSP preparation system include?',
    a: 'Effective CSP preparation typically includes structured study content, practice questions, review tools, and progress tracking. IntelliCert integrates all of these into one platform with additional learning optimization features.',
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="relative py-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-slate-200/60" />
      <div className="mx-auto w-full max-w-[1320px] px-6 sm:px-10">
        <SectionHead eyebrow="FAQ" title="Questions, answered." />
        <div className="mx-auto max-w-3xl space-y-3">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div
                key={f.q}
                className={`overflow-hidden rounded-2xl border bg-white shadow-card transition-colors ${
                  isOpen ? 'border-brand-500/30' : 'border-ink-line hover:border-slate-300'
                }`}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left text-[15px] font-semibold text-ink"
                >
                  {f.q}
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-brand-600 transition-transform duration-300 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="px-6 pb-5 text-[14px] leading-relaxed text-ink-body">{f.a}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
