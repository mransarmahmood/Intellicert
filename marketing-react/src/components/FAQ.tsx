import { motion } from 'framer-motion';
import { HelpCircle } from 'lucide-react';
import Accordion, { AccordionItem } from './ui/Accordion';
import Badge from './ui/Badge';
import { fadeUp, inViewOnce } from '../lib/motion';

const faqs = [
  {
    id: 'q1',
    q: 'How is this different from Quizlet or Anki?',
    a: "Those store information. We engineer retention. Every card schedules itself, every gap triggers a custom explanation, every diagram becomes a recall test.",
  },
  {
    id: 'q2',
    q: "How long until I'm exam-ready?",
    a: '3–6 months for most. The system spaces and tests you so you study less total — and remember more. The 6-month plan is sized for a comfortable run-up.',
  },
  {
    id: 'q3',
    q: "What if I don't pass?",
    a: "We extend your access free, until you do. Complete the curriculum and we stand behind the result.",
  },
  {
    id: 'q4',
    q: 'Which certifications?',
    a: 'CSP, ASP, OHST, CHST, CIH. Pro covers CSP. Pro+ Mastery unlocks all five.',
  },
  {
    id: 'q5',
    q: 'Cancel anytime?',
    a: 'One click from your dashboard. No retention calls. 7-day money-back on any paid plan.',
  },
  {
    id: 'q6',
    q: 'Mobile and offline?',
    a: 'Yes — phone, tablet, desktop. Install to home screen for offline flashcards. Voice Mode is built for commutes.',
  },
  {
    id: 'q7',
    q: 'Who writes the content?',
    a: 'Practicing CSPs, reviewed against the BCSP CSP11 blueprint. Every formula and number cites OSHA, NIOSH, ACGIH, or ANSI sources.',
  },
  {
    id: 'q8',
    q: 'Is my data private?',
    a: "Yours. We never sell or share. Voice runs on-device where possible. No third-party tracking on the marketing site.",
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
