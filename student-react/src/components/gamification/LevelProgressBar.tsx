export default function LevelProgressBar({
  level,
  title,
  progress,
  xpToNext,
}: {
  level: number;
  title: string;
  progress: number;
  xpToNext: number;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-ink-dim">Level {level}</div>
          <div className="font-display text-[16px] font-bold text-ink">{title}</div>
        </div>
        <div className="text-[12px] font-semibold text-ink-dim">{xpToNext} XP to next</div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface">
        <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-brand-600" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
