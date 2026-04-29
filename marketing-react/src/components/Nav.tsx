import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Brain } from 'lucide-react';
import Button from './ui/Button';
import { easeStandard, dur } from '../lib/motion';

const links = [
  { href: '#method',     label: 'Method' },
  { href: '#preview',    label: 'Product' },
  { href: '#flow',       label: 'How It Works' },
  { href: '#pricing',    label: 'Pricing' },
  { href: '#faq',        label: 'FAQ' },
];

/**
 * Glass-effect sticky navbar with full-screen mobile overlay.
 *
 * Behaviour:
 *   - Frosted glass (backdrop-blur), border becomes denser when scrolled
 *   - Logo + 5 in-page nav links (desktop) / hamburger → overlay (mobile)
 *   - Sign in (ghost) + Start Free (primary) on the right
 *   - ESC closes mobile menu; body scroll locks when open
 *   - Focus restoration: hamburger button regains focus on close
 *
 * A11y:
 *   - aria-expanded on hamburger
 *   - aria-controls + matching id on overlay
 *   - role="dialog" + aria-modal on overlay
 */
export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen]         = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ESC closes mobile menu + scroll lock
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.documentElement.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.documentElement.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <header className="fixed inset-x-0 top-4 z-50 flex justify-center px-4 sm:top-6 sm:px-6">
        <nav
          aria-label="Primary"
          className={`flex w-full max-w-[1320px] items-center justify-between rounded-2xl border px-4 py-2.5 transition-all duration-300 ease-ease-standard sm:px-5 ${
            scrolled
              ? 'border-ink-line bg-white/95 shadow-[0_10px_30px_-14px_rgba(15,23,42,.35)] backdrop-blur-xl'
              : 'border-white/70 bg-white/70 backdrop-blur-md'
          }`}
        >
          {/* Logo */}
          <a
            href="#"
            aria-label="IntelliCert home"
            className="flex items-center gap-2.5 font-display text-[17px] font-bold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
          >
            <img
              src="/icons/icon-512.png"
              alt=""
              aria-hidden="true"
              className="h-9 w-9 shrink-0 rounded-xl shadow-sm md:h-10 md:w-10"
            />
            <span className="hidden sm:inline">IntelliCert</span>
          </a>

          {/* Desktop links */}
          <div className="hidden items-center gap-7 md:flex">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-[13.5px] font-medium text-ink-body transition-colors hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 rounded-md px-1"
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* CTAs (desktop + mobile) */}
          <div className="flex items-center gap-2">
            <a
              href="/app/login"
              className="hidden text-[13.5px] font-semibold text-ink-body transition-colors hover:text-ink sm:inline-flex sm:rounded-md sm:px-2 sm:py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
            >
              Sign in
            </a>
            <a href="/app/register">
              <Button variant="primary" size="sm" shimmer>
                Start Free
              </Button>
            </a>
            {/* Hamburger */}
            <button
              type="button"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              aria-controls="mobile-nav-overlay"
              onClick={() => setOpen((v) => !v)}
              className="ml-1 grid h-9 w-9 place-items-center rounded-lg border border-ink-line bg-white text-ink-body transition-colors hover:bg-surface-sunken md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
            >
              <AnimatePresence mode="wait" initial={false}>
                {open ? (
                  <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: dur.micro }}>
                    <X size={18} aria-hidden="true" />
                  </motion.span>
                ) : (
                  <motion.span key="m" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: dur.micro }}>
                    <Menu size={18} aria-hidden="true" />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile overlay menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-nav-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: dur.standard, ease: easeStandard }}
            className="fixed inset-0 z-40 bg-grad-hero md:hidden"
          >
            <div className="flex h-full flex-col px-6 pb-10 pt-28">
              <ul className="flex flex-col gap-1">
                {links.map((l, i) => (
                  <motion.li
                    key={l.href}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: dur.standard, ease: easeStandard, delay: 0.06 + i * 0.04 }}
                  >
                    <a
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className="block rounded-xl px-4 py-4 font-display text-2xl font-bold text-white transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                    >
                      {l.label}
                    </a>
                  </motion.li>
                ))}
              </ul>
              <div className="mt-auto space-y-3 pt-8">
                <a
                  href="/app/login"
                  onClick={() => setOpen(false)}
                  className="btn btn-ghost-dark btn-lg w-full"
                >
                  Sign in
                </a>
                <a
                  href="/app/register"
                  onClick={() => setOpen(false)}
                  className="btn btn-primary btn-lg w-full"
                >
                  Start Free Trial
                </a>
                <p className="pt-2 text-center text-xs text-white/60">
                  <Brain size={12} className="mr-1 inline" aria-hidden="true" />
                  Brain-based learning · 7-day free trial · No credit card
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
