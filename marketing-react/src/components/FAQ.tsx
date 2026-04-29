import { motion } from 'framer-motion';
import { HelpCircle } from 'lucide-react';
import Accordion, { AccordionItem } from './ui/Accordion';
import Badge from './ui/Badge';
import { fadeUp, inViewOnce } from '../lib/motion';

const faqs = [
  {
    id: 'q1',
    q: 'How is this different from Quizlet, Anki, or a textbook?',
    a: 'Traditional resources provide information. IntelliCert provides a structured retrieval system: every fact you encounter enters a spaced-repetition schedule, every weak node gets a custom AI explanation, and every diagram becomes an image-occlusion card. Information is the input — retention is the output.',
  },
  {
    id: 'q2',
    q: 'How long does it take to prepare for the CSP?',
    a: 'Most candidates study 3–6 months. Because IntelliCert is built on spaced repetition, you spend less total time and retain more. The 6-month plan is sized for a comfortable, complete preparation with buffer for review.',
  },
  {
    id: 'q3',
    q: "What happens if I don't pass the exam?",
    a: "You get free access until you pass — no questions asked. If you complete the curriculum and don't clear the exam, we extend your account at no cost. We built this platform to deliver a pass and we stand behind it.",
  },
  {
    id: 'q4',
    q: 'Which certifications are covered?',
    a: 'CSP (primary focus), ASP, OHST, CHST, and CIH share content under the BCSP and ABIH blueprints. The Pro+ Mastery tier unlocks all five certifications. Pro tier covers CSP only.',
  },
  {
    id: 'q5',
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel from your dashboard in one click. No retention calls, no dark patterns. Your access continues until the end of your current billing period — and the 7-day money-back applies if you change your mind in the first week.',
  },
  {
    id: 'q6',
    q: 'Does it work on mobile and offline?',
    a: 'Yes — responsive on phone, tablet, and desktop. Install it to your home screen for an app-like experience. Voice Mode is designed specifically for commute use.',
  },
  {
    id: 'q7',
    q: 'Who writes and reviews the content?',
    a: 'Content is curated by practicing CSPs and reviewed against the BCSP exam blueprint (CSP11). Every formula, regulation, and calculation is verified against the cited primary source — OSHA 29 CFR, NIOSH, ACGIH TLVs, ANSI/ASSP standards. Mastery topics carry an additional 12-point defensibility checklist.',
  },
  {
    id: 'q8',
    q: 'Is my data private?',
    a: 'Your study data is yours. We never sell or share learner data. Voice transcriptions are processed with on-device speech recognition where possible and never stored. Authentication is token-based; no third-party tracking on the marketing site.',
  },
];

export default function FAQ() {
  return (
    <section id="faq" className="relative py-24 sm:py-32">
      <div className="wrap">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={inViewOnce}
          className="mx-auto max-w-2xl text-center"
        >
          <Badge variant="brand" icon={<HelpCircle size={11} aria-hidden="true" />}>
            FAQ
          </Badge>
          <h2 className="mt-4 font-display text-5xl font-extrabold text-ink">
            Questions, answered{' '}
            <span className="editorial text-brand-600">honestly.</span>
          </h2>
          <p className="mt-5 text-lg text-ink-body">
            If your question isn't here, write to{' '}
            <a href="mailto:hello@intellicert.co.uk" className="font-semibold text-brand-600 underline-offset-2 hover:underline">
              hello@intellicert.co.uk
            </a>
            . We respond within one business day.
          </p>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={inViewOnce}
          className="mx-auto mt-12 max-w-3xl"
        >
          <Accordion type="single" defaultValue="q1">
            {faqs.map((f) => (
              <AccordionItem key={f.id} id={f.id} question={f.q}>
                <p>{f.a}</p>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
