import { Sparkles, Zap, Gift, TrendingUp, ShieldCheck, Flame } from 'lucide-react';

const items = [
  { icon: Flame, text: 'Annual plan: $180/year — best value, save $60' },
  { icon: Gift, text: '6-month all-access · only $100 one-time' },
  { icon: ShieldCheck, text: 'Pass guarantee · free until you pass' },
  { icon: Sparkles, text: 'New: Feynman teach-back mode is live' },
  { icon: TrendingUp, text: '2× recall vs. textbooks — backed by research' },
  { icon: Zap, text: 'Spaced repetition that adapts to your brain' },
];

export default function AnnouncementBar() {
  const loop = [...items, ...items, ...items];
  return (
    <div className="fixed inset-x-0 top-0 z-[60] overflow-hidden border-b border-brand-700/50 bg-brand-700 text-white">
      <div className="relative flex items-center py-2.5">
        {/* shimmer overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'linear-gradient(90deg, transparent 0%, rgba(255,255,255,.35) 50%, transparent 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 6s linear infinite',
          }}
        />
        <div className="flex w-max animate-marquee gap-10 pr-10">
          {loop.map((it, i) => (
            <div key={i} className="flex shrink-0 items-center gap-2 text-[13px] font-semibold tracking-wide">
              <it.icon size={15} className="text-white/90" />
              <span>{it.text}</span>
              <span className="ml-6 text-white/40">•</span>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
