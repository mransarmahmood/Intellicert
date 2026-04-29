import { useEffect, useState } from 'react';

const links = [
  { href: '#science', label: 'Science' },
  { href: '#flow', label: 'How It Works' },
  { href: '#features', label: 'Features' },
  { href: '#domains', label: 'Domains' },
  { href: '#pricing', label: 'Pricing' },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-12 z-50 flex justify-center px-4 sm:px-6">
      <nav
        className={`flex w-full max-w-[1320px] items-center justify-between rounded-2xl border px-5 py-2.5 transition-all duration-300 ${
          scrolled
            ? 'border-ink-line bg-white/90 shadow-[0_10px_30px_-14px_rgba(15,23,42,.35)] backdrop-blur-xl'
            : 'border-white/70 bg-white/65 backdrop-blur-md'
        }`}
      >
        <a href="#" className="flex items-center gap-2.5 font-display text-[17px] font-bold text-ink">
          <img
            src="/icons/icon-512.png"
            alt="IntelliCert"
            className="h-10 w-10 shrink-0 rounded-xl shadow-sm md:h-11 md:w-11"
          />
          <span className="hidden sm:inline">IntelliCert</span>
        </a>
        <div className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[13.5px] font-medium text-ink-body transition-colors hover:text-brand-600"
            >
              {l.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <a href="/app/login" className="btn btn-ghost btn-sm hidden sm:inline-flex">
            Sign in
          </a>
          <a href="/app/login" className="btn btn-primary btn-sm">
            Open App
          </a>
        </div>
      </nav>
    </header>
  );
}
