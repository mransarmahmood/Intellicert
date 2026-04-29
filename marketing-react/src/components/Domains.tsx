import SectionHead from './SectionHead';
import Reveal from './Reveal';

const domains = [
  {
    n: '01',
    title: 'Advanced Application of Safety Principles',
    desc: 'Prevention through Design (PtD), process safety, workplace hazard controls, life safety systems, materials handling, fleet safety, and equipment safety.',
  },
  {
    n: '02',
    title: 'Program Management',
    desc: 'Safety management systems, leadership, safety culture, incident investigation, audits, management of change, financial principles, and performance measurement.',
  },
  {
    n: '03',
    title: 'Risk Management',
    desc: 'Risk assessment, hazard analysis, hierarchy of controls, risk mitigation strategies, and financial and operational risk considerations.',
  },
  {
    n: '04',
    title: 'Emergency Management',
    desc: 'Emergency response planning, fire protection, disaster preparedness, hazardous materials response, and crisis management systems.',
  },
  {
    n: '05',
    title: 'Environmental Management',
    desc: 'Environmental protection, waste management, pollution prevention, sustainability practices, and regulatory compliance.',
  },
  {
    n: '06',
    title: 'Occupational Health and Applied Science',
    desc: 'Industrial hygiene, exposure assessment, toxicology, ergonomics, human factors, and applied physics and chemistry.',
  },
  {
    n: '07',
    title: 'Training',
    desc: 'Training needs analysis, instructional design, delivery methods, competency development, and evaluation of training effectiveness.',
  },
];

export default function Domains() {
  return (
    <section id="domains" className="relative py-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-slate-200/60" />
      <div className="mx-auto w-full max-w-[1320px] px-6 sm:px-10">
        <SectionHead
          eyebrow="Full Coverage"
          title="Complete coverage of all 7 CSP11 exam domains"
          desc="Aligned with the official CSP11 Examination Blueprint — covering the full scope of professional safety practice, leadership, risk management, and applied science."
        />
        <p className="mx-auto -mt-8 mb-10 max-w-3xl text-center text-[14px] text-ink-body">
          Based on the official BCSP CSP11 blueprint used globally for Certified Safety Professional certification.
        </p>
        <div className="grid gap-4 xl:grid-cols-2">
          {domains.map((d, i) => (
            <Reveal key={d.n} delay={(i % 2) * 0.06}>
              <div className="card card-hover group relative flex items-center gap-5 overflow-hidden p-6">
                <div className="pointer-events-none absolute -right-12 -top-12 h-24 w-24 rounded-full bg-brand-400/10 blur-2xl" />
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-brand-50 font-display text-[18px] font-bold text-brand-600 ring-1 ring-brand-500/15">
                  {d.n}
                </div>
                <div className="flex-1">
                  <h4 className="font-display text-[16px] font-bold text-ink">{d.title}</h4>
                  <p className="mt-0.5 text-[13px] text-ink-body">{d.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
