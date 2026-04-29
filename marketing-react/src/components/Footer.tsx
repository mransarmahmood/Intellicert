import { useState } from 'react';
import { Linkedin, Twitter, Youtube, Mail, ArrowRight, Check } from 'lucide-react';
import Button from './ui/Button';

const cols = [
  {
    title: 'Product',
    links: [
      { label: 'Method',         href: '#method' },
      { label: 'Inside the App', href: '#preview' },
      { label: 'How It Works',   href: '#flow' },
      { label: 'Pricing',        href: '#pricing' },
      { label: 'FAQ',            href: '#faq' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'CSP Domain Guide', href: '#' },
      { label: 'Free Diagnostic',  href: '/app/register' },
      { label: 'Blog',             href: '#' },
      { label: 'Method Cards',     href: '#' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About',     href: '#' },
      { label: 'Contact',   href: 'mailto:hello@intellicert.co.uk' },
      { label: 'Careers',   href: '#' },
      { label: 'Press kit', href: '#' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy',       href: '#' },
      { label: 'Terms',         href: '#' },
      { label: 'Refunds',       href: '#' },
      { label: 'Pass Guarantee', href: '#' },
    ],
  },
];

export default function Footer() {
  const [email, setEmail]   = useState('');
  const [done, setDone]     = useState(false);
  const [error, setError]   = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }
    // Backend wiring happens in a later phase — for now, optimistically accept.
    setDone(true);
  }

  return (
    <footer className="border-t border-ink-line bg-white">
      {/* Newsletter strip */}
      <div className="border-b border-ink-line bg-surface-alt py-12">
        <div className="wrap grid items-center gap-6 lg:grid-cols-[1.4fr,1fr]">
          <div>
            <h3 className="font-display text-2xl font-bold text-ink">
              CSP exam tips, every other Tuesday.
            </h3>
            <p className="mt-2 max-w-xl text-sm text-ink-body">
              One short email. The most-tested concept this week, the trick that
              gets it right, and the worked example that makes it stick. No spam.
              Unsubscribe in one click.
            </p>
          </div>
          <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-start" noValidate>
            <div className="flex flex-1 items-center gap-2 rounded-pill border border-ink-line bg-white px-3 py-1 transition-colors focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20">
              <Mail size={14} className="text-ink-muted" aria-hidden="true" />
              <input
                type="email"
                name="email"
                placeholder="you@company.com"
                aria-label="Email address"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); setDone(false); }}
                className="w-full bg-transparent py-2 text-sm text-ink outline-none placeholder:text-ink-muted"
                required
              />
            </div>
            <Button
              variant={done ? 'ghost' : 'primary'}
              size="md"
              type="submit"
              trailingIcon={done ? <Check size={14} aria-hidden="true" /> : <ArrowRight size={14} aria-hidden="true" />}
            >
              {done ? 'Subscribed' : 'Subscribe'}
            </Button>
          </form>
        </div>
        {(error || done) && (
          <div className="wrap mt-2 text-sm">
            {error && <span role="alert" className="text-red-600">{error}</span>}
            {done && !error && <span className="text-success-500">Thanks — check your inbox to confirm.</span>}
          </div>
        )}
      </div>

      {/* Main footer */}
      <div className="wrap py-16">
        <div className="grid gap-10 lg:grid-cols-[1.5fr,1fr,1fr,1fr,1fr]">
          {/* Brand column */}
          <div>
            <a href="#" className="inline-flex items-center gap-3">
              <img src="/icons/icon-512.png" alt="" aria-hidden="true" className="h-11 w-11 rounded-xl shadow-sm" />
              <span className="font-display text-xl font-extrabold tracking-tight text-ink">IntelliCert</span>
            </a>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-body">
              The CSP exam prep platform built on memory science. Study less,
              remember more, pass with confidence.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {[
                { Icon: Linkedin, href: '#', label: 'LinkedIn' },
                { Icon: Twitter,  href: '#', label: 'X / Twitter' },
                { Icon: Youtube,  href: '#', label: 'YouTube' },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-ink-line bg-white text-ink-dim transition-colors hover:border-brand-500/40 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
                >
                  <Icon size={15} aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {cols.map((c) => (
            <div key={c.title}>
              <h5 className="font-display text-2xs font-bold uppercase tracking-wider text-ink">
                {c.title}
              </h5>
              <ul className="mt-4 space-y-2.5">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-sm text-ink-body transition-colors hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 rounded-md"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-ink-line pt-7 text-xs text-ink-dim sm:flex-row">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>© 2026 IntelliCert by Nexara.</span>
            <span aria-hidden="true">·</span>
            <span>Made with cognitive science.</span>
          </div>
          <div className="text-center sm:text-right">
            Not affiliated with the Board of Certified Safety Professionals.
          </div>
        </div>
      </div>
    </footer>
  );
}
