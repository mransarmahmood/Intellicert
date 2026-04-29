import { motion } from 'framer-motion';
import { CheckCircle2, PlusCircle, BookOpen, Sparkles, Grid3x3 } from 'lucide-react';
import { SYLLABUS, VISUAL_META, getCoverageStats } from '../data/syllabus';
import type { VisualType } from '../data/syllabus';

export default function SyllabusCoveragePage() {
  const stats = getCoverageStats();
  const pct = Math.round((stats.present / stats.total) * 100);

  return (
    <div className="min-h-screen bg-surface">
      <div className="relative overflow-hidden bg-mesh-light border-b border-ink-line">
        <div className="wrap py-10">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
            <span className="eyebrow mb-3"><Grid3x3 size={13} /> Syllabus Coverage</span>
            <h1 className="font-display text-4xl font-extrabold text-ink leading-tight">
              Complete CSP Syllabus Map
            </h1>
            <p className="mt-3 text-ink-body leading-relaxed">
              Every topic from the official BCSP CSP reference book — mapped to depth (page count) and the
              best interactive visualization for learning it. Topics already in the app are marked with ✓,
              newly added topics with +.
            </p>

            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatTile label="Total Topics"        value={stats.total} color="#2563eb" />
              <StatTile label="Originally in app"   value={stats.present} color="#16a34a" />
              <StatTile label="Newly added"         value={stats.added}   color="#ea580c" />
              <StatTile label="Coverage"            value={`${pct}%`}     color="#7c3aed" />
            </div>
          </motion.div>
        </div>
      </div>

      <div className="wrap py-8">
        {SYLLABUS.map((domain, di) => (
          <motion.section
            key={domain.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: di * 0.05 }}
            className="mb-10"
          >
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <div className="eyebrow mb-1"><BookOpen size={11} /> Domain {domain.number}</div>
                <h2 className="font-display text-2xl font-extrabold text-ink">{domain.title}</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-ink-line text-xs font-bold text-ink-body">
                  {domain.weight}% of exam
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-ink-line text-xs font-bold text-ink-body">
                  {domain.topics.length} topics · {domain.totalPages} pages
                </span>
              </div>
            </div>

            <div className="grid gap-2.5">
              {domain.topics.map((t, ti) => {
                const isNew = !t.presentKey;
                const meta = VISUAL_META[t.visual as VisualType];
                return (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: di * 0.05 + ti * 0.02 }}
                    className="rounded-xl border border-ink-line bg-white shadow-card p-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-5"
                  >
                    <div className={`shrink-0 grid h-9 w-9 place-items-center rounded-lg ${
                      isNew ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {isNew ? <PlusCircle size={17} /> : <CheckCircle2 size={17} />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <div className="font-bold text-ink text-[14.5px]">
                          {domain.number}.{ti + 1} {t.title}
                        </div>
                      </div>
                      <div className="text-[13px] text-ink-body leading-relaxed mt-0.5">
                        {t.summary}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row md:flex-col gap-2 md:min-w-[220px] md:items-end">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-sunken text-[11px] font-semibold text-ink-body">
                        {t.pages} page{t.pages === 1 ? '' : 's'}
                      </span>
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                        style={{
                          background: isNew ? 'rgba(234,88,12,0.1)' : 'rgba(37,99,235,0.08)',
                          color: isNew ? '#c2410c' : '#1d4ed8',
                        }}
                        title={meta?.desc || ''}
                      >
                        <Sparkles size={11} /> {meta?.label ?? t.visual}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        ))}
      </div>
    </div>
  );
}

function StatTile({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-ink-line p-4">
      <div className="text-[11px] font-bold uppercase tracking-wide text-ink-dim">{label}</div>
      <div className="font-display text-3xl font-extrabold mt-1 tabular-nums" style={{ color }}>
        {value}
      </div>
    </div>
  );
}
