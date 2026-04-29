import { useEffect, useState } from 'react';

type Toast = { id: number; xp: number };

export default function XpRewardToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const onAward = (e: Event) => {
      const detail = (e as CustomEvent<{ xp: number }>).detail;
      if (!detail?.xp) return;
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { id, xp: detail.xp }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2200);
    };
    window.addEventListener('intellicert:xp-awarded', onAward as EventListener);
    return () => window.removeEventListener('intellicert:xp-awarded', onAward as EventListener);
  }, []);

  if (!toasts.length) return null;
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[70] space-y-2">
      {toasts.map((t) => (
        <div key={t.id} className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-[13px] font-semibold text-emerald-800 shadow-card">
          +{t.xp} XP earned
        </div>
      ))}
    </div>
  );
}
