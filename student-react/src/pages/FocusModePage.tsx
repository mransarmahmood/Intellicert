import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { X, Wind } from 'lucide-react';

const TOTAL_SECONDS = 60;
// 4-7-8 breathing cycle (19 seconds total)
const PHASES = [
  { label: 'Breathe in',  seconds: 4, scale: 1.4 },
  { label: 'Hold',        seconds: 7, scale: 1.4 },
  { label: 'Breathe out', seconds: 8, scale: 0.85 },
] as const;

export default function FocusModePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') ?? '/study';

  const [seconds, setSeconds] = useState(TOTAL_SECONDS);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [phaseSecLeft, setPhaseSecLeft] = useState<number>(PHASES[0].seconds);

  useEffect(() => {
    if (seconds <= 0) {
      navigate(next, { replace: true });
      return;
    }
    const t = setTimeout(() => {
      setSeconds((s) => s - 1);
      setPhaseSecLeft((sl) => {
        if (sl - 1 <= 0) {
          setPhaseIdx((i) => (i + 1) % PHASES.length);
          return PHASES[(phaseIdx + 1) % PHASES.length].seconds;
        }
        return sl - 1;
      });
    }, 1000);
    return () => clearTimeout(t);
  }, [seconds, phaseIdx, navigate, next]);

  const phase = PHASES[phaseIdx];
  const progress = ((TOTAL_SECONDS - seconds) / TOTAL_SECONDS) * 100;

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-gradient-to-b from-navy-900 via-navy-950 to-black px-4 text-white">
      {/* Ambient orbs */}
      <motion.div
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl"
      />
      <motion.div
        animate={{ scale: [1.1, 1, 1.1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-blue-500/15 blur-3xl"
      />

      {/* Top bar */}
      <Link
        to={next}
        className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white/80 backdrop-blur transition hover:bg-white/15"
        title="Skip"
      >
        <X size={16} />
      </Link>
      <div className="absolute left-1/2 top-6 -translate-x-1/2 text-center">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">
          <Wind size={12} /> Focus Mode
        </div>
      </div>

      {/* Breathing circle */}
      <div className="relative grid place-items-center">
        <motion.div
          animate={{ scale: phase.scale }}
          transition={{ duration: phase.seconds, ease: 'easeInOut' }}
          className="grid h-64 w-64 place-items-center rounded-full bg-gradient-to-br from-brand-400/30 to-brand-700/20 ring-1 ring-white/10 backdrop-blur-sm sm:h-80 sm:w-80"
        >
          <motion.div
            animate={{ scale: phase.scale }}
            transition={{ duration: phase.seconds, ease: 'easeInOut' }}
            className="grid h-44 w-44 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 shadow-[0_0_80px_-10px_rgba(234,88,12,.6)] sm:h-52 sm:w-52"
          >
            <div className="text-center">
              <div className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">{phase.label}</div>
              <div className="mt-1 font-display text-6xl font-extrabold text-white tabular-nums">{phaseSecLeft}</div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom progress + total counter */}
      <div className="absolute inset-x-0 bottom-12 mx-auto max-w-md px-6">
        <div className="mb-3 flex items-center justify-between text-[12px] font-semibold text-white/60">
          <span>Get focused</span>
          <span className="tabular-nums">{seconds}s</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-1000" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-5 text-center text-[12px] text-white/50">
          Inhale 4 · hold 7 · exhale 8 — slows your heart rate and primes your memory.
        </p>
      </div>
    </div>
  );
}
