import { motion } from 'framer-motion';
import { ArrowRight, Award, Shield, HardHat, Microscope, Wrench, ClipboardCheck, Construction, type LucideIcon } from 'lucide-react';
import SectionHead from './SectionHead';
import { IMAGES } from '../assets/images';

type Cert = {
  id: string;
  short: string;
  name: string;
  tagline: string;
  blurb: string;
  questions: string;
  duration: string;
  image: string;
  icon: LucideIcon;
  badgeColor: string;
};

const CERTS: Cert[] = [
  {
    id: 'csp',
    short: 'CSP',
    name: 'Certified Safety Professional',
    tagline: 'The gold standard',
    blurb: 'Senior-level BCSP credential covering safety principles, management, risk, and applied science across 7 domains.',
    questions: '200 questions',
    duration: '5.5 hours',
    image: IMAGES.CERT_CSP,
    icon: Shield,
    badgeColor: 'bg-brand-500/95',
  },
  {
    id: 'asp',
    short: 'ASP',
    name: 'Associate Safety Professional',
    tagline: 'Pathway to CSP',
    blurb: 'Entry BCSP credential for early-career safety practitioners moving toward CSP designation.',
    questions: '200 questions',
    duration: '5 hours',
    image: IMAGES.CERT_ASP,
    icon: Award,
    badgeColor: 'bg-blue-600/95',
  },
  {
    id: 'ohst',
    short: 'OHST',
    name: 'Occupational Hygiene & Safety Technician',
    tagline: 'Field-focused',
    blurb: 'Technician credential covering IH, exposure monitoring, and applied workplace safety for practitioners.',
    questions: '150 questions',
    duration: '4 hours',
    image: IMAGES.CERT_OHST,
    icon: HardHat,
    badgeColor: 'bg-emerald-600/95',
  },
  {
    id: 'chst',
    short: 'CHST',
    name: 'Construction Health & Safety Technician',
    tagline: 'Construction sector',
    blurb: 'Specialised for construction safety supervisors, foremen, and HSE specialists on active jobsites.',
    questions: '150 questions',
    duration: '4 hours',
    image: IMAGES.CERT_CHST,
    icon: Construction,
    badgeColor: 'bg-amber-600/95',
  },
  {
    id: 'cih',
    short: 'CIH',
    name: 'Certified Industrial Hygienist',
    tagline: 'Exposure & toxicology',
    blurb: 'ABIH flagship credential for industrial hygienists — deep exposure science, toxicology, and controls.',
    questions: '180 questions',
    duration: '6 hours',
    image: IMAGES.CERT_CIH,
    icon: Microscope,
    badgeColor: 'bg-violet-600/95',
  },
  {
    id: 'sms',
    short: 'SMS',
    name: 'Safety Management Specialist',
    tagline: 'Leadership & systems',
    blurb: 'BCSP credential for safety managers building, leading, and measuring safety management systems.',
    questions: '150 questions',
    duration: '4 hours',
    image: IMAGES.CERT_SMS,
    icon: ClipboardCheck,
    badgeColor: 'bg-sky-600/95',
  },
  {
    id: 'sts',
    short: 'STS',
    name: 'Safety Trained Supervisor',
    tagline: 'Supervisor entry',
    blurb: 'Entry-level BCSP credential establishing core safety competency for frontline supervisors.',
    questions: '100 questions',
    duration: '3 hours',
    image: IMAGES.CERT_STS,
    icon: Wrench,
    badgeColor: 'bg-rose-600/95',
  },
];

export default function Certifications() {
  return (
    <section id="certifications" className="relative py-28">
      <div className="mx-auto w-full max-w-[1320px] px-6 sm:px-10">
        <SectionHead
          eyebrow="7 Certifications"
          title="Choose your certification path"
          desc="Full preparation coverage for every BCSP and ABIH credential — from supervisor-entry STS through the senior CSP and CIH flagships."
        />

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {CERTS.map((c, i) => (
            <motion.a
              key={c.id}
              href={`/app/login`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, delay: (i % 3) * 0.08 }}
              className="card card-hover group relative flex flex-col overflow-hidden"
            >
              {/* cover photo */}
              <div className="relative h-44 w-full overflow-hidden">
                <img
                  src={c.image}
                  alt={c.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      'linear-gradient(to top, rgba(15,23,42,0.85), rgba(15,23,42,0.3) 50%, transparent)',
                  }}
                />
                {/* badge */}
                <div className={`absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-lg ${c.badgeColor} px-2.5 py-1 font-display text-[11px] font-bold uppercase tracking-wider text-white shadow-lg`}>
                  <c.icon size={13} />
                  {c.short}
                </div>
                {/* floating tagline */}
                <div className="absolute bottom-3 left-4 right-4 text-[11px] font-semibold uppercase tracking-wider text-white/90">
                  {c.tagline}
                </div>
              </div>

              {/* body */}
              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-display text-[17px] font-bold text-ink">{c.name}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-body">{c.blurb}</p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-surface-sunken px-2.5 py-0.5 text-[11px] font-semibold text-ink-body">
                    {c.questions}
                  </span>
                  <span className="rounded-full bg-surface-sunken px-2.5 py-0.5 text-[11px] font-semibold text-ink-body">
                    {c.duration}
                  </span>
                </div>

                <div className="mt-5 flex items-center justify-between pt-4 border-t border-ink-line">
                  <span className="text-[12px] font-semibold text-ink-dim">View prep materials</span>
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-brand-600 transition-all group-hover:bg-brand-600 group-hover:text-white">
                    <ArrowRight size={13} />
                  </span>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
