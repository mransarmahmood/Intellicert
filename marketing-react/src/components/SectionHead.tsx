import Reveal from './Reveal';

export default function SectionHead({
  eyebrow,
  title,
  desc,
}: {
  eyebrow: string;
  title: string;
  desc?: string;
}) {
  return (
    <Reveal className="mx-auto mb-14 max-w-4xl text-center">
      <div className="section-head-shell">
        <div className="relative z-10">
          <span className="eyebrow">{eyebrow}</span>
          <h2 className="mt-4 font-display text-4xl font-extrabold text-ink sm:text-5xl">{title}</h2>
          {desc && <p className="mx-auto mt-4 max-w-3xl text-[16px] leading-relaxed text-ink-body">{desc}</p>}
        </div>
      </div>
    </Reveal>
  );
}
