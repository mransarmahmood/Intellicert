import { Rocket, ArrowRight } from 'lucide-react';
import Reveal from './Reveal';

export default function CTA() {
  return (
    <section className="py-20">
      <div className="mx-auto w-full max-w-[1320px] px-6 sm:px-10">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl px-8 py-20 text-center sm:px-16">
            {/* bold orange accent gradient (Skywork-inspired) — inline to bypass global gradient override */}
            <div
              className="absolute inset-0"
              style={{ backgroundImage: 'linear-gradient(90deg, #C2410C 0%, #EA580C 50%, #C2410C 100%)' }}
            />
            {/* subtle diagonal texture */}
            <div
              className="absolute inset-0 opacity-[0.18] mix-blend-overlay"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(45deg, rgba(255,255,255,.35) 0 2px, transparent 2px 14px)',
              }}
            />
            {/* soft vignette */}
            <div className="absolute -inset-x-20 -top-40 h-80 bg-white/20 blur-3xl" />
            <div className="absolute -inset-x-20 -bottom-40 h-80 bg-black/20 blur-3xl" />

            <div className="relative">
              <h2 className="mx-auto max-w-3xl font-display text-4xl font-extrabold !text-white sm:text-5xl md:text-6xl">
                Ready to start your certification journey?
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-[17px] leading-relaxed text-white/90">
                Join 15,000+ safety professionals who have successfully passed CSP, ASP, OHST, CHST, CIH, SMS, and STS
                exams with IntelliCert's brain-based prep system.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a
                  href="/app/login"
                  className="btn btn-lg bg-white text-brand-700 shadow-[0_20px_45px_-10px_rgba(0,0,0,.4)] hover:bg-slate-50 hover:-translate-y-0.5"
                >
                  <Rocket size={18} /> Start Free Practice
                </a>
                <a
                  href="#pricing"
                  className="btn btn-lg border border-white/40 bg-transparent text-white hover:bg-white/10"
                >
                  View Plans <ArrowRight size={16} />
                </a>
              </div>
              <p className="mt-6 text-[13px] font-medium text-white/80">
                3-day free trial · Pass guarantee · Cancel anytime
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
