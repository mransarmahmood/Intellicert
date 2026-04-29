import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Rocket, Play, Check, Brain, BookOpen, Layers, HelpCircle, GraduationCap, Zap, Timer, ShieldCheck, LineChart, Shield } from 'lucide-react';
import AnimatedStats from './AnimatedStats';
import { IMAGES } from '../assets/images';

const sideItems = [
  { icon: Brain, label: 'Dashboard', active: true },
  { icon: BookOpen, label: 'Study' },
  { icon: Layers, label: 'Flashcards' },
  { icon: HelpCircle, label: 'Quizzes' },
  { icon: GraduationCap, label: 'Feynman' },
  { icon: Zap, label: 'Focus Mode' },
];

const stats = [
  { label: 'Memory Strength', value: '87%', bar: 87 },
  { label: 'Due for Review', value: '12', bar: 35 },
  { label: 'Domain Mastery', value: '74%', bar: 74 },
  { label: 'Streak', value: '14d', bar: 90 },
];

const slides = [
  {
    id: 1,
    title: 'Guided Learning Dashboard',
    subtitle: 'Domain 3 - Risk Management',
    badge: '+23% recall rate',
    accent: 'bg-brand-500/20',
  },
  {
    id: 2,
    title: 'Timed Exam Simulation',
    subtitle: '200-question mock exam mode',
    badge: '5h 30m simulation',
    accent: 'bg-indigo-500/20',
  },
  {
    id: 3,
    title: 'Performance Breakdown',
    subtitle: 'Weakest domains identified automatically',
    badge: 'AI improvement tips',
    accent: 'bg-emerald-500/20',
  },
];

export default function Hero() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 3800);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="relative overflow-hidden pb-24 pt-56 sm:pt-64">
      {/* Real safety-professional photo background with soft surface veil */}
      <div className="pointer-events-none absolute inset-0 -z-[1]">
        <img
          src={IMAGES.HERO_BG}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover opacity-[0.14]"
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(to bottom, rgba(250,250,249,0.7), rgba(250,250,249,0.9) 60%, #FAFAF9)',
          }}
        />
      </div>
      {/* Animated background grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(15,23,42,.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,.06) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, #000 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, #000 30%, transparent 80%)',
        }}
      />
      {/* Floating gradient orbs */}
      <motion.div
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute -left-20 top-40 h-72 w-72 rounded-full bg-brand-400/30 blur-3xl"
      />
      <motion.div
        animate={{ x: [0, -40, 0], y: [0, 30, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute -right-20 top-32 h-96 w-96 rounded-full bg-blue-300/20 blur-3xl"
      />

      <div className="relative wrap text-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto inline-flex items-center gap-2 rounded-full border border-ink-line bg-white px-4 py-1.5 text-[12px] font-medium text-ink-body shadow-sm"
        >
          <Shield size={13} className="text-brand-600" />
          Trusted by 15,000+ safety professionals preparing for BCSP &amp; ABIH exams
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05 }}
          className="mx-auto mt-7 max-w-4xl font-display text-5xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-6xl md:text-7xl"
        >
          Pass your safety exam <br className="hidden sm:block" />
          with a{' '}
          <span className="relative inline-block">
            <span className="text-brand-600">
              smarter way to learn
            </span>
            <svg viewBox="0 0 300 12" className="absolute -bottom-2 left-0 w-full text-brand-500/70" fill="none">
              <path d="M2 6 Q 75 0, 150 6 T 298 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mx-auto mt-7 max-w-2xl text-[17px] leading-relaxed text-ink-body"
        >
          IntelliCert transforms CSP, ASP, OHST, CHST, CIH, SMS, and STS exam blueprints into a structured, brain-based
          learning system powered by spaced repetition, active recall, and real-world safety application. Study less.
          Remember more. Pass with confidence.
        </motion.p>
        <p className="mx-auto mt-3 max-w-2xl text-[14px] font-semibold uppercase tracking-wide text-ink-dim">
          7 BCSP &amp; ABIH credentials • 2,000+ practice questions • Full blueprint coverage
        </p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mt-9 flex flex-wrap items-center justify-center gap-3"
        >
          <a href="/app/login" className="btn btn-primary btn-lg">
            <Rocket size={18} /> Open Learning App
          </a>
          <a href="#flow" className="btn btn-ghost btn-lg">
            <Play size={16} /> See How It Works
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-ink-dim"
        >
          {['3-day free trial', 'Pass guarantee', 'Cancel anytime'].map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5">
              <Check size={14} className="text-brand-600" /> {t}
            </span>
          ))}
        </motion.div>

        {/* Animated stats counter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mx-auto mt-14 max-w-4xl"
        >
          <AnimatedStats />
        </motion.div>

        {/* Full-width animated showcase */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-20 w-screen left-1/2 right-1/2 -mx-[50vw]"
        >
          <div className="absolute -inset-x-20 -top-12 -bottom-12 -z-10 rounded-[4rem] bg-brand-400/15 blur-3xl" />

          <div className="mx-auto w-full max-w-[1320px] px-6 sm:px-10">
            <div className="relative overflow-hidden rounded-3xl border border-navy-700 bg-navy-900 p-2 shadow-[0_55px_120px_-30px_rgba(15,23,42,.55)] ring-1 ring-black/20">
              <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <Timer size={12} /> Live product preview
                </div>
              </div>

              <div className="relative grid min-h-[430px] grid-cols-1 lg:grid-cols-[210px_1fr]">
                <aside className="hidden border-r border-white/5 p-4 lg:block">
                  {sideItems.map((it) => (
                    <div
                      key={it.label}
                      className={`mb-1 flex items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium transition-colors ${
                        it.active ? 'bg-brand-600/15 text-brand-400' : 'text-slate-400 hover:bg-white/5'
                      }`}
                    >
                      <it.icon size={14} /> {it.label}
                    </div>
                  ))}
                </aside>

                <div className="relative p-6 text-left md:p-8">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={slides[activeSlide].id}
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -24 }}
                      transition={{ duration: 0.55, ease: 'easeOut' }}
                      className="space-y-5"
                    >
                      <div className={`absolute right-6 top-6 h-24 w-40 rounded-2xl ${slides[activeSlide].accent} blur-2xl`} />
                      <div>
                        <div className="font-display text-[22px] font-bold text-white">{slides[activeSlide].title}</div>
                        <div className="mt-1 text-[12px] text-slate-400">{slides[activeSlide].subtitle}</div>
                      </div>
                      <div>
                        <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-brand-400">
                          <Brain className="mr-1 inline" size={11} /> Brain-Based Learning Path - 7 / 10
                        </div>
                        <div className="flex gap-1.5">
                          {Array.from({ length: 10 }).map((_, i) => (
                            <div
                              key={i}
                              className={`h-1.5 flex-1 rounded-full ${
                                i < 7 ? 'bg-brand-500' : 'bg-white/10'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                        {stats.map((s) => (
                          <div key={s.label} className="rounded-xl border border-white/10 bg-white/[.03] p-3.5">
                            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{s.label}</div>
                            <div className="mt-1.5 font-display text-2xl font-bold text-white">{s.value}</div>
                            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/5">
                              <div className="h-full rounded-full bg-brand-500" style={{ width: `${s.bar}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">
                        <div className="rounded-xl border border-white/10 bg-white/[.03] p-3 text-slate-200">
                          <div className="mb-1 flex items-center gap-2 text-[12px] font-semibold"><ShieldCheck size={14} className="text-emerald-400" /> Exam readiness</div>
                          <p className="text-[12px] text-slate-400">Targeted domain review with progress checkpoints.</p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/[.03] p-3 text-slate-200">
                          <div className="mb-1 flex items-center gap-2 text-[12px] font-semibold"><LineChart size={14} className="text-blue-400" /> Performance trends</div>
                          <p className="text-[12px] text-slate-400">Score trajectory and retention curve visibility.</p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/[.03] p-3 text-slate-200">
                          <div className="mb-1 flex items-center gap-2 text-[12px] font-semibold"><Timer size={14} className="text-brand-400" /> Practice rhythm</div>
                          <p className="text-[12px] text-slate-400">Smart schedule adapts to your available time.</p>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 border-t border-white/5 px-4 py-3">
                {slides.map((slide, i) => (
                  <button
                    key={slide.id}
                    type="button"
                    aria-label={`Show slide ${i + 1}`}
                    onClick={() => setActiveSlide(i)}
                    className={`h-2.5 rounded-full transition-all ${i === activeSlide ? 'w-8 bg-brand-500' : 'w-2.5 bg-white/30 hover:bg-white/50'}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute left-3 top-1/3 hidden items-center gap-2 rounded-xl border border-ink-line bg-white px-3.5 py-2 text-[12px] font-semibold text-ink shadow-card xl:inline-flex"
          >
            <Check size={14} className="text-green-500" /> {slides[activeSlide].badge}
          </motion.div>
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
            className="absolute right-3 top-2/3 hidden items-center gap-2 rounded-xl border border-ink-line bg-white px-3.5 py-2 text-[12px] font-semibold text-ink shadow-card xl:inline-flex"
          >
            <Zap size={14} className="text-brand-600" /> 3 reviews due
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
