const cols = [
  {
    title: 'Product',
    links: [
      { label: 'How It Works', href: '#flow' },
      { label: 'Features', href: '#features' },
      { label: 'Domains', href: '#domains' },
      { label: 'Pricing', href: '#pricing' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Contact', href: '#' },
      { label: 'Careers', href: '#' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '#' },
      { label: 'Terms', href: '#' },
      { label: 'Refunds', href: '#' },
      { label: 'Pass Guarantee', href: '#' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-ink-line bg-white py-16">
      <div className="wrap">
        <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <a href="#" className="inline-flex">
              <div className="flex items-center gap-3">
                <img
                  src="/icons/icon-512.png"
                  alt="IntelliCert"
                  className="h-12 w-12 rounded-2xl shadow-sm"
                />
                <span className="font-display text-xl font-extrabold tracking-tight text-ink">IntelliCert</span>
              </div>
            </a>
            <p className="mt-4 max-w-xs text-[13.5px] leading-relaxed text-ink-body">
              The CSP exam prep platform built on memory science. Study less. Remember more. Pass with confidence.
            </p>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <h5 className="font-display text-[13px] font-bold uppercase tracking-wider text-ink">{c.title}</h5>
              <ul className="mt-4 space-y-2.5">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="text-[13.5px] text-ink-body transition-colors hover:text-brand-600">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-ink-line pt-7 text-[12px] text-ink-dim sm:flex-row">
          <div>© 2026 IntelliCert. All rights reserved.</div>
          <div>Not affiliated with the Board of Certified Safety Professionals.</div>
        </div>
      </div>
    </footer>
  );
}
