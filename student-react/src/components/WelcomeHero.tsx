import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, Flame, Zap, Target, ArrowRight } from 'lucide-react';

type Props = {
  name?: string | null;
  streakDays?: number;
  readinessScore?: number;
  dueNow?: number;
};

export default function WelcomeHero({ name, streakDays = 0, readinessScore = 0, dueNow = 0 }: Props) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <motion.section
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl border border-ink-line bg-mesh-light p-8 shadow-card"
    >
      {/* Decorative orbs */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 0.4, scale: 1, rotate: 360 }}
        transition={{ scale: { duration: 0.8 }, rotate: { duration: 40, repeat: Infinity, ease: 'linear' } }}
        className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(234,88,12,0.35), transparent 70%)' }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 0.3, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.25), transparent 70%)' }}
      />

      <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="eyebrow mb-3"
          >
            <Sparkles size={12} /> {greeting}{name ? `, ${name.split(' ')[0]}` : ''}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="font-display text-3xl md:text-4xl font-extrabold text-ink leading-tight"
          >
            Ready to master<br />
            <span className="bg-gradient-to-r from-brand-600 via-orange-500 to-amber-500 bg-clip-text text-transparent">
              your next concept?
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-3 max-w-xl text-ink-body leading-relaxed"
          >
            Your personalized learning plan adapts to what you know — and what you don't. Let's keep the momentum.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-5 flex flex-wrap gap-3"
          >
            <Link
              to="/study"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 px-5 py-3 text-sm font-bold text-white shadow-glow hover:-translate-y-0.5 transition-transform"
            >
              Start Studying <ArrowRight size={15} />
            </Link>
            <Link
              to="/visuals"
              className="inline-flex items-center gap-2 rounded-xl border border-ink-line bg-white/80 backdrop-blur-sm px-5 py-3 text-sm font-bold text-ink hover:border-slate-300 hover:bg-white transition-all"
            >
              <Sparkles size={15} /> Explore Visuals
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          className="grid grid-cols-3 gap-3 lg:min-w-[340px]"
        >
          <StatCard Icon={Flame}  value={streakDays}     label="Day streak"  color="#ea580c" />
          <StatCard Icon={Target} value={`${readinessScore}%`} label="Readiness"   color="#2563eb" />
          <StatCard Icon={Zap}    value={dueNow}         label="Due now"     color="#7c3aed" />
        </motion.div>
      </div>
    </motion.section>
  );
}

function StatCard({
  Icon,
  value,
  label,
  color,
}: {
  Icon: typeof Flame;
  value: number | string;
  label: string;
  color: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="rounded-2xl border border-ink-line bg-white/80 backdrop-blur-sm p-4 text-center shadow-sm"
    >
      <div className="mx-auto mb-2 grid h-9 w-9 place-items-center rounded-lg" style={{ background: `${color}14`, color }}>
        <Icon size={15} />
      </div>
      <div className="font-display text-2xl font-extrabold text-ink tabular-nums">{value}</div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-dim">{label}</div>
    </motion.div>
  );
}
