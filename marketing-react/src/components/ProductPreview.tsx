import { motion } from 'framer-motion';
import {
  Layers, Bot, Mic, BarChart3, GraduationCap, ArrowRight,
  Check, X, Lightbulb, Volume2, Pause,
} from 'lucide-react';
import Tabs, { TabsList, TabsTrigger, TabsContent } from './ui/Tabs';
import Badge from './ui/Badge';
import { fadeUp, inViewOnce, easeStandard } from '../lib/motion';

/**
 * Product Preview — interactive bento with tabbed view of platform surfaces.
 *
 * 5 tabs: Flashcards · Practice Exam · AI Explainer · Voice Mode · Progress.
 * Each tab is a hand-drawn mockup (no real screenshots — keeps it dynamic
 * without stale screenshots when product UI evolves).
 */
export default function ProductPreview() {
  return (
    <section id="preview" className="relative bg-surface-alt py-24 sm:py-32">
      <div className="wrap">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={inViewOnce}
          className="mx-auto max-w-2xl text-center"
        >
          <Badge variant="amber" icon={<Lightbulb size={11} aria-hidden="true" />}>
            Inside the App
          </Badge>
          <h2 className="mt-4 font-display text-5xl font-extrabold text-ink">
            Five surfaces.{' '}
            <span className="editorial text-brand-600">One coherent system.</span>
          </h2>
          <p className="mt-5 text-lg text-ink-body">
            Every screen is engineered for retention — not for screen time.
            Tap through the surfaces below.
          </p>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={inViewOnce}
          className="mt-12"
        >
          <Tabs id="product-preview" defaultValue="flashcards" className="space-y-8">
            <div className="flex justify-center">
              <TabsList className="overflow-x-auto">
                <TabsTrigger value="flashcards" icon={<Layers size={14} aria-hidden="true" />}>Flashcards</TabsTrigger>
                <TabsTrigger value="exam"        icon={<GraduationCap size={14} aria-hidden="true" />}>Practice Exam</TabsTrigger>
                <TabsTrigger value="ai"          icon={<Bot size={14} aria-hidden="true" />}>AI Explainer</TabsTrigger>
                <TabsTrigger value="voice"       icon={<Mic size={14} aria-hidden="true" />}>Voice Mode</TabsTrigger>
                <TabsTrigger value="progress"    icon={<BarChart3 size={14} aria-hidden="true" />}>Progress</TabsTrigger>
              </TabsList>
            </div>

            {/* Mockup viewport */}
            <div className="relative mx-auto max-w-5xl">
              <div className="absolute -inset-x-8 -inset-y-6 -z-10 rounded-3xl bg-brand-500/8 blur-3xl" aria-hidden="true" />

              <TabsContent value="flashcards"><FlashcardMock /></TabsContent>
              <TabsContent value="exam"><ExamMock /></TabsContent>
              <TabsContent value="ai"><AIMock /></TabsContent>
              <TabsContent value="voice"><VoiceMock /></TabsContent>
              <TabsContent value="progress"><ProgressMock /></TabsContent>
            </div>
          </Tabs>
        </motion.div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Mock surfaces — pure markup, no images. Each is a stylized "screenshot."
// ─────────────────────────────────────────────────────────────────────
function MockShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-ink-line bg-white shadow-cardHover">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-ink-line bg-surface-sunken px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
        </div>
        <div className="ml-auto rounded-md bg-white px-3 py-1 font-mono text-2xs text-ink-muted ring-1 ring-ink-line">
          intellicert.app/app
        </div>
      </div>
      {children}
    </div>
  );
}

function FlashcardMock() {
  return (
    <MockShell>
      <div className="grid min-h-[420px] grid-cols-1 gap-6 p-6 sm:p-8 lg:grid-cols-[1fr,260px]">
        {/* Card front */}
        <div className="relative grid place-items-center rounded-2xl bg-gradient-to-br from-brand-50 via-white to-amber-50 p-8 ring-1 ring-ink-line">
          <div className="text-center">
            <div className="mx-auto mb-5 inline-flex items-center gap-1.5 rounded-pill border border-brand-500/30 bg-brand-50 px-3 py-1 text-2xs font-bold uppercase tracking-wider text-brand-700">
              <Layers size={11} aria-hidden="true" /> Card 7 of 12
            </div>
            <h3 className="font-display text-3xl font-extrabold text-ink">
              What is the OSHA TWA basis for noise exposure?
            </h3>
            <p className="mt-3 text-sm text-ink-dim">Tap to flip · 8 sec to recall</p>
            <div className="mt-8 flex justify-center gap-3">
              <button className="btn btn-ghost btn-sm" disabled>
                <X size={13} aria-hidden="true" /> Again
              </button>
              <button className="btn btn-primary btn-sm" disabled>
                <Check size={13} aria-hidden="true" /> Got it
              </button>
            </div>
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          <div className="rounded-xl bg-surface-sunken p-3">
            <div className="text-2xs font-bold uppercase tracking-wider text-ink-dim">Today</div>
            <div className="mt-1 font-mono text-2xl font-bold text-ink">12 / 30</div>
            <div className="text-xs text-ink-body">cards reviewed</div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
              <div className="h-full w-2/5 rounded-full bg-gradient-to-r from-brand-500 to-amber-500" />
            </div>
          </div>
          <div className="rounded-xl bg-surface-sunken p-3">
            <div className="text-2xs font-bold uppercase tracking-wider text-ink-dim">Strength</div>
            <div className="mt-2 space-y-1.5">
              {[{ k: 'Mastered', v: 18, c: 'bg-success-500' },
                { k: 'Learning', v: 9, c: 'bg-amber-500' },
                { k: 'Weak', v: 3, c: 'bg-red-400' }].map((s) => (
                <div key={s.k} className="flex items-center gap-2 text-xs">
                  <span className={`h-2 w-2 rounded-full ${s.c}`} />
                  <span className="flex-1 text-ink-body">{s.k}</span>
                  <span className="font-mono font-bold text-ink">{s.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MockShell>
  );
}

function ExamMock() {
  return (
    <MockShell>
      <div className="min-h-[420px] p-6 sm:p-8">
        <div className="flex items-start justify-between">
          <div>
            <Badge variant="navy">
              <GraduationCap size={11} aria-hidden="true" /> Full Simulation · BCSP rules
            </Badge>
            <div className="mt-2 font-mono text-sm text-ink-dim">Question 47 of 200</div>
          </div>
          <div className="rounded-pill bg-amber-500/10 px-4 py-1.5 ring-1 ring-amber-500/30">
            <span className="font-mono text-sm font-bold text-amber-600">04:32:18</span>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-ink-line p-5">
          <p className="text-base text-ink">
            A 50-person construction site reports 6 OSHA-recordable injuries in
            850,000 hours worked. Calculate the TRIR (round to 2 decimals).
          </p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {['0.71', '1.41', '7.06', '14.12'].map((opt, i) => (
              <button
                key={i}
                className={`group flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-all ${
                  i === 1
                    ? 'border-brand-500 bg-brand-50 font-semibold text-ink'
                    : 'border-ink-line hover:border-slate-300 hover:bg-surface-sunken'
                }`}
                disabled
              >
                <span className={`grid h-6 w-6 place-items-center rounded-md font-mono text-xs font-bold ${
                  i === 1 ? 'bg-brand-600 text-white' : 'bg-surface-sunken text-ink-dim'
                }`}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="font-mono">{opt}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3 text-2xs">
          <div className="rounded-lg bg-surface-sunken p-2 text-center">
            <div className="font-mono text-base font-bold text-ink">152</div>
            <div className="uppercase tracking-wider text-ink-dim">Remaining</div>
          </div>
          <div className="rounded-lg bg-surface-sunken p-2 text-center">
            <div className="font-mono text-base font-bold text-success-500">42</div>
            <div className="uppercase tracking-wider text-ink-dim">Confident</div>
          </div>
          <div className="rounded-lg bg-surface-sunken p-2 text-center">
            <div className="font-mono text-base font-bold text-amber-600">5</div>
            <div className="uppercase tracking-wider text-ink-dim">Flagged</div>
          </div>
        </div>
      </div>
    </MockShell>
  );
}

function AIMock() {
  return (
    <MockShell>
      <div className="grid min-h-[420px] grid-cols-1 gap-0 lg:grid-cols-[1fr,300px]">
        <div className="space-y-4 p-6 sm:p-8">
          <Badge variant="brand"><Bot size={11} aria-hidden="true" /> AI Auto-Explainer</Badge>
          <div className="rounded-xl bg-surface-sunken p-4 text-sm text-ink-body">
            <span className="font-semibold text-ink">You:</span> I keep mixing up TRIR, DART, and LTIFR. Can you explain the difference simply?
          </div>
          <div className="rounded-xl border border-brand-500/20 bg-gradient-to-br from-brand-50 to-white p-4">
            <div className="mb-2 flex items-center gap-2 text-2xs font-bold uppercase tracking-wider text-brand-600">
              <Bot size={12} aria-hidden="true" /> Explainer
            </div>
            <p className="text-sm text-ink-body">
              Three rates, all per <span className="font-mono">100 FTE-years</span>:
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-ink-body">
              <li>• <strong>TRIR</strong> = all OSHA-recordables × 200,000 / hours</li>
              <li>• <strong>DART</strong> = subset (days-away/restricted/transferred)</li>
              <li>• <strong>LTIFR</strong> = lost-time × 1,000,000 / hours <em>(international)</em></li>
            </ul>
            <div className="mt-3 rounded-lg bg-white p-3 ring-1 ring-brand-500/20">
              <span className="text-2xs font-bold uppercase tracking-wider text-brand-700">Memory hook:</span>
              <span className="ml-2 text-sm font-semibold text-ink">TRIR ≥ DART · LTIFR uses 1M not 200K</span>
            </div>
          </div>
        </div>

        <div className="border-t border-ink-line bg-surface-sunken p-5 lg:border-l lg:border-t-0">
          <div className="text-2xs font-bold uppercase tracking-wider text-ink-dim">Your weak nodes</div>
          <ul className="mt-3 space-y-2 text-sm">
            {['Incident metrics', 'Hierarchy of controls', 'NIOSH RWL'].map((w, i) => (
              <li key={w} className="flex items-center justify-between rounded-lg bg-white p-2 text-ink-body ring-1 ring-ink-line">
                <span>{w}</span>
                <span className="font-mono text-2xs text-ink-dim">{[42, 67, 71][i]}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </MockShell>
  );
}

function VoiceMock() {
  return (
    <MockShell>
      <div className="grid min-h-[420px] place-items-center bg-grad-hero p-6 sm:p-8">
        <div className="text-center text-white">
          <Badge variant="glass"><Mic size={11} aria-hidden="true" /> Active Listening Mode</Badge>
          <div className="mt-6 mb-2 font-mono text-2xs uppercase tracking-widest text-white/60">Now playing</div>
          <h3 className="font-display text-2xl font-bold">Hierarchy of Controls — Domain 1.2</h3>
          <p className="mt-2 text-sm text-white/60">Auto-pauses every 60s for retrieval prompts</p>

          {/* Waveform */}
          <div className="my-8 flex items-end justify-center gap-1.5">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.span
                key={i}
                className="block w-1.5 rounded-full bg-amber-400"
                animate={{ height: [10, 24 + (i * 3) % 32, 10] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.05 }}
                style={{ height: 10 }}
              />
            ))}
          </div>

          <div className="mx-auto max-w-md rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <div className="text-2xs font-bold uppercase tracking-wider text-amber-400">Pause prompt</div>
            <p className="mt-1.5 text-sm text-white">
              "Pause now. What were the three points just covered?"
            </p>
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            <button className="btn btn-ghost-dark btn-sm" disabled><Pause size={12} aria-hidden="true" /></button>
            <button className="btn btn-ghost-dark btn-sm" disabled><Volume2 size={12} aria-hidden="true" /></button>
            <span className="font-mono text-2xs text-white/60">12:34 / 18:00</span>
          </div>
        </div>
      </div>
    </MockShell>
  );
}

function ProgressMock() {
  const domains = [
    { name: 'D1 Safety Management', pct: 84, c: 'bg-success-500' },
    { name: 'D2 Risk Assessment',   pct: 72, c: 'bg-success-500' },
    { name: 'D3 Hazard Control',    pct: 65, c: 'bg-amber-500' },
    { name: 'D4 Incident Mgmt',     pct: 58, c: 'bg-amber-500' },
    { name: 'D5 IH & Health',       pct: 41, c: 'bg-red-400' },
    { name: 'D6 Ergonomics',        pct: 49, c: 'bg-amber-500' },
    { name: 'D7 Adv. Sciences',     pct: 78, c: 'bg-success-500' },
  ];
  return (
    <MockShell>
      <div className="min-h-[420px] p-6 sm:p-8">
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-surface-sunken p-4">
            <div className="text-2xs uppercase tracking-wider text-ink-dim">Pass probability</div>
            <div className="mt-1 font-mono text-3xl font-bold text-ink">78<span className="text-lg text-ink-dim">%</span></div>
            <div className="mt-1 text-2xs text-success-500">↑ +6 this week</div>
          </div>
          <div className="rounded-xl bg-surface-sunken p-4">
            <div className="text-2xs uppercase tracking-wider text-ink-dim">Streak</div>
            <div className="mt-1 font-mono text-3xl font-bold text-ink">14<span className="text-lg text-ink-dim">d</span></div>
            <div className="mt-1 text-2xs text-amber-600">Keep it up</div>
          </div>
          <div className="rounded-xl bg-surface-sunken p-4">
            <div className="text-2xs uppercase tracking-wider text-ink-dim">SRS due today</div>
            <div className="mt-1 font-mono text-3xl font-bold text-ink">12</div>
            <div className="mt-1 text-2xs text-ink-dim">≈ 5 minutes</div>
          </div>
        </div>

        <div>
          <div className="text-2xs font-bold uppercase tracking-wider text-ink-dim">Per-domain mastery</div>
          <ul className="mt-3 space-y-2.5">
            {domains.map((d) => (
              <li key={d.name}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-ink-body">{d.name}</span>
                  <span className="font-mono tabular-nums text-ink-dim">{d.pct}%</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-sunken">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${d.pct}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, ease: easeStandard }}
                    className={`h-full rounded-full ${d.c}`}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex items-center justify-between rounded-xl border border-brand-500/30 bg-brand-50 p-4">
          <div>
            <div className="text-2xs font-bold uppercase tracking-wider text-brand-700">Next best action</div>
            <p className="mt-0.5 text-sm font-semibold text-ink">Drill D5 IH & Health — your weakest domain</p>
          </div>
          <button className="btn btn-primary btn-sm" disabled>
            Start <ArrowRight size={12} aria-hidden="true" />
          </button>
        </div>
      </div>
    </MockShell>
  );
}
