import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import SectionHead from './SectionHead';
import { IMAGES } from '../assets/images';

type Testimonial = {
  name: string;
  role: string;
  cert: string;
  rating: number;
  quote: string;
  image: string;
};

const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Marcus Reeves',
    role: 'EHS Manager · Energy sector',
    cert: 'CSP',
    rating: 5,
    quote:
      'The spaced repetition engine flagged my weakest domain three weeks before my exam. I went from 62% to 89% on Domain 6 practice and passed on the first try.',
    image: IMAGES.PERSON_1,
  },
  {
    name: 'Priya Natarajan',
    role: 'Safety Coordinator · Construction',
    cert: 'CHST',
    rating: 5,
    quote:
      'The jobsite-specific scenarios were worth the subscription alone. Nothing else matched the realism of the practice questions — I felt like I had already taken the test when I walked in.',
    image: IMAGES.PERSON_2,
  },
  {
    name: 'David Ortega',
    role: 'Industrial Hygienist · Manufacturing',
    cert: 'CIH',
    rating: 5,
    quote:
      'Exposure calculations finally clicked with the worked-example walkthroughs. The Feynman teach-back loops forced me to explain concepts I thought I understood but didn\'t.',
    image: IMAGES.PERSON_3,
  },
  {
    name: 'Sarah Kim',
    role: 'HSE Supervisor · Oil & Gas',
    cert: 'ASP',
    rating: 5,
    quote:
      'Passed the ASP after 6 weeks of focused study. The domain-weighted mock exams mirrored the real test almost perfectly — I knew exactly where I stood every step of the way.',
    image: IMAGES.PERSON_4,
  },
  {
    name: 'Jonathan Alvarez',
    role: 'Safety Director · Utilities',
    cert: 'SMS',
    rating: 5,
    quote:
      'The SMS path fit my schedule — I studied 45 min a day for 9 weeks. The active-recall flashcards make long commutes productive. Cleared it on the first attempt with confidence.',
    image: IMAGES.PERSON_5,
  },
  {
    name: 'Ellen Moreau',
    role: 'Health & Safety Technician · Pharma',
    cert: 'OHST',
    rating: 5,
    quote:
      'Coming from a lab-tech background I was nervous about hygiene math. The formula walkthroughs and toxicology visuals made it click. Finally a prep platform that teaches, not just tests.',
    image: IMAGES.PERSON_6,
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="relative py-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-slate-200/50" />
      <div className="relative mx-auto w-full max-w-[1320px] px-6 sm:px-10">
        <SectionHead
          eyebrow="Success Stories"
          title="Certified safety professionals who trusted IntelliCert"
          desc="Real outcomes from practitioners who prepared, practiced, and passed using the same brain-based system you're about to start."
        />

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.55, delay: (i % 3) * 0.08 }}
              className="card card-hover relative flex h-full flex-col p-6"
            >
              <Quote className="absolute right-5 top-5 h-7 w-7 text-brand-500/15" />

              <div className="mb-4 flex items-center gap-3.5">
                <img
                  src={t.image}
                  alt={t.name}
                  loading="lazy"
                  className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-brand-500/20"
                />
                <div className="min-w-0">
                  <div className="truncate font-display text-[15px] font-bold text-ink">{t.name}</div>
                  <div className="truncate text-[12px] text-ink-dim">{t.role}</div>
                </div>
                <span className="ml-auto rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-brand-600">
                  {t.cert}
                </span>
              </div>

              <div className="mb-3 flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} size={14} className="fill-brand-500 text-brand-500" />
                ))}
              </div>

              <p className="text-[13.5px] leading-relaxed text-ink-body">"{t.quote}"</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
