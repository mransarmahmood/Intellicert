import { useState } from 'react';
import { motion } from 'framer-motion';
import { PersonStanding, Fan, Box, HardHat, ShieldCheck, Biohazard, Wind } from 'lucide-react';

const PARTICLE_COUNT = 18;

type Ctrls = { vent: boolean; enc: boolean; ppe: boolean };

export default function HazardParticles() {
  const [ctrls, setCtrls] = useState<Ctrls>({ vent: false, enc: false, ppe: false });

  const toggle = (k: keyof Ctrls) => setCtrls((c) => ({ ...c, [k]: !c[k] }));

  const activeCount = Object.values(ctrls).filter(Boolean).length;
  const status = ctrls.enc
    ? { text: 'Enclosure — most effective engineering control', color: 'text-emerald-700', Icon: ShieldCheck }
    : ctrls.vent
    ? { text: 'Local exhaust — removes airborne hazard at source', color: 'text-yellow-700', Icon: Wind }
    : ctrls.ppe
    ? { text: 'PPE — last resort, depends on compliance', color: 'text-orange-700', Icon: HardHat }
    : { text: 'Worker exposed to hazard', color: 'text-red-700', Icon: Biohazard };

  // Generate deterministic particle trajectories
  const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    tx: 160 + ((i * 37) % 100),
    ty: -60 - ((i * 23) % 100),
    delay: (i * 0.15) % 2.3,
  }));

  return (
    <div className="rounded-2xl border border-ink-line bg-white p-6 shadow-card">
      <div className="text-center mb-4">
        <h3 className="font-display text-xl font-extrabold text-ink">Exposure Control — Containment</h3>
        <p className="mt-1 text-sm text-ink-dim">Activate controls to contain the hazard cloud</p>
      </div>

      <div className="relative h-[300px] rounded-2xl overflow-hidden border border-ink-line"
        style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)' }}
      >
        {/* Source */}
        <div className="absolute bottom-10 left-10 w-10 h-16 rounded-t-lg" style={{ background: 'linear-gradient(180deg, #64748b, #334155)' }}>
          <div className="absolute -top-2 left-1 w-8 h-2 bg-ink-DEFAULT rounded" />
        </div>

        {/* Worker */}
        <div className="absolute bottom-10 right-8 w-16 text-center z-10">
          <div className="relative inline-block">
            <PersonStanding size={40} className="text-ink" />
            {ctrls.ppe && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1, boxShadow: ['0 0 0 0 rgba(234,88,12,0.4)', '0 0 0 10px rgba(234,88,12,0)'] }}
                transition={{ scale: { duration: 0.3 }, boxShadow: { duration: 1.8, repeat: Infinity } }}
                className="absolute inset-0 rounded-full border-2 border-orange-500"
              />
            )}
          </div>
          <div className="text-[11px] font-bold text-ink-body mt-1">Worker</div>
        </div>

        {/* Particles */}
        {particles.map((p) => {
          const animate =
            ctrls.enc ? { opacity: 0, scale: 0, x: 0, y: 0 }
            : ctrls.vent ? { x: 0, y: -260, opacity: [0.7, 0] }
            : { x: [0, p.tx], y: [0, p.ty], scale: [0.6, 1.2], opacity: [0.1, 0.7, 0.1] };

          const transition =
            ctrls.enc ? { duration: 0.4 }
            : ctrls.vent ? { duration: 1.2, ease: 'easeIn' as const }
            : { duration: 4, repeat: Infinity, ease: 'easeInOut' as const, delay: p.delay };

          return (
            <motion.div
              key={p.id}
              animate={animate}
              transition={transition}
              className="absolute rounded-full"
              style={{
                width: 18, height: 18,
                bottom: 80, left: 60,
                background: 'radial-gradient(circle at 30% 30%, rgba(234, 88, 12, 0.6), rgba(220, 38, 38, 0.4))',
                filter: 'blur(2px)',
              }}
            />
          );
        })}

        {/* Enclosure overlay */}
        {ctrls.enc && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="absolute rounded-xl border-[3px] border-dashed border-emerald-600 pointer-events-none"
            style={{ inset: '16px 100px 20px 24px', background: 'rgba(34, 197, 94, 0.08)' }}
          />
        )}

        {/* Control labels */}
        {ctrls.vent && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="absolute top-3 left-10 bg-cyan-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded">
            Local Exhaust
          </motion.div>
        )}
        {ctrls.enc && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="absolute top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded">
            Enclosure
          </motion.div>
        )}
        {ctrls.ppe && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="absolute top-3 right-3 bg-orange-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded">
            Respirator (PPE)
          </motion.div>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-2 mt-4">
        <button
          onClick={() => toggle('vent')}
          className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-all ${
            ctrls.vent ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-white text-ink-body border-ink-line hover:bg-surface-alt'
          }`}
        >
          <Fan size={14} /> {ctrls.vent ? 'Ventilation ON' : 'Toggle Ventilation'}
        </button>
        <button
          onClick={() => toggle('enc')}
          className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-all ${
            ctrls.enc ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-ink-body border-ink-line hover:bg-surface-alt'
          }`}
        >
          <Box size={14} /> {ctrls.enc ? 'Enclosure ON' : 'Toggle Enclosure'}
        </button>
        <button
          onClick={() => toggle('ppe')}
          className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-all ${
            ctrls.ppe ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-ink-body border-ink-line hover:bg-surface-alt'
          }`}
        >
          <HardHat size={14} /> {ctrls.ppe ? 'Respirator ON' : 'Toggle Respirator'}
        </button>
      </div>

      <motion.div
        key={activeCount + '-' + JSON.stringify(ctrls)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`mt-3 text-center text-sm flex items-center justify-center gap-2 font-medium ${status.color}`}
      >
        <status.Icon size={16} />
        <strong>{status.text}</strong>
      </motion.div>
    </div>
  );
}
