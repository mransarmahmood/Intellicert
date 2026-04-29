import { GitBranch, Workflow, ShieldAlert } from 'lucide-react';
import { pickConceptIcon } from './ConceptIcon';

type ConceptLite = { id: number; title: string };

export default function TopicVisualMap({
  topicName,
  subtitle,
  concepts,
}: {
  topicName: string;
  subtitle?: string | null;
  concepts: ConceptLite[];
}) {
  const nodes = concepts.slice(0, 8);

  return (
    <div className="mt-5 grid gap-4 xl:grid-cols-3">
      <ConceptualMapCard topicName={topicName} nodes={nodes} />
      <FlowDiagramCard topicName={topicName} subtitle={subtitle} />
      <HierarchyMapCard />
    </div>
  );
}

function ConceptualMapCard({ topicName, nodes }: { topicName: string; nodes: ConceptLite[] }) {
  const total = Math.max(nodes.length, 1);
  const cx = 50;
  const cy = 50;
  const radius = 30;

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4">
      <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-700">
        <GitBranch size={13} />
        Conceptual Map
      </div>
      <svg viewBox="0 0 100 100" className="w-full rounded-lg border border-indigo-100 bg-white">
        <circle cx={cx} cy={cy} r={14} fill="#4F46E5" fillOpacity="0.16" stroke="#4F46E5" strokeWidth="1.3" />
        <text x={cx} y={cy + 1} textAnchor="middle" fontSize="3.8" fontWeight="700" fill="#1E1B4B">
          {trim(topicName, 16)}
        </text>

        {nodes.map((n, i) => {
          const angle = (i / total) * Math.PI * 2 - Math.PI / 2;
          const x = cx + radius * Math.cos(angle);
          const y = cy + radius * Math.sin(angle);
          const meta = pickConceptIcon(n.title);
          const labelLines = wrapShort(n.title, 12);
          const isTopHalf = y < cy;
          const labelBaseY = isTopHalf ? y - 7 : y + 10;
          return (
            <g key={n.id}>
              <line x1={cx} y1={cy} x2={x} y2={y} stroke={meta.color} strokeWidth="0.8" strokeOpacity="0.5" />
              <circle cx={x} cy={y} r={5.7} fill={meta.color} fillOpacity="0.16" stroke={meta.color} strokeWidth="0.9" />
              <text x={x} y={y + 0.9} textAnchor="middle" fontSize="2.3" fontWeight="700" fill="#0F172A">
                {String(i + 1)}
              </text>
              {labelLines.slice(0, 2).map((line, li) => {
                const yy = labelBaseY + li * 3.2;
                const estW = Math.max(8, line.length * 1.35);
                return (
                  <g key={`${n.id}-${li}`}>
                    <rect
                      x={x - estW / 2}
                      y={yy - 2.2}
                      width={estW}
                      height={3.1}
                      rx={1.2}
                      fill="#FFFFFF"
                      fillOpacity="0.92"
                      stroke="#CBD5E1"
                      strokeWidth="0.28"
                    />
                    <text
                      x={x}
                      y={yy}
                      textAnchor="middle"
                      fontSize="2.2"
                      fontWeight="700"
                      fill="#111827"
                    >
                      {line}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
      <div className="mt-3 grid gap-1.5 text-[11.5px] text-ink-body">
        {nodes.length === 0 ? (
          <div className="rounded-md bg-white px-2 py-1 text-ink-dim">No concept nodes yet for this topic.</div>
        ) : (
          nodes.map((n, i) => (
            <div key={n.id} className="rounded-md bg-white px-2 py-1">
              <span className="font-semibold text-indigo-700">{String(i + 1).padStart(2, '0')}</span> {n.title}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function FlowDiagramCard({ topicName, subtitle }: { topicName: string; subtitle?: string | null }) {
  const label = subtitle && subtitle.trim().length > 0 ? subtitle : topicName;
  const steps = [
    `Identify ${trim(label, 24)}`,
    'Assess risk exposure',
    'Apply controls',
    'Verify and improve',
  ];

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
      <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700">
        <Workflow size={13} />
        Learning Flow Diagram
      </div>
      <div className="space-y-2">
        {steps.map((step, idx) => (
          <div key={step} className="flex items-center gap-2">
            <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">
              {idx + 1}
            </div>
            <div className="flex-1 rounded-md border border-emerald-200 bg-white px-2.5 py-1.5 text-[12.5px] font-medium text-ink">
              {step}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-md border border-emerald-200 bg-white px-2.5 py-2 text-[11.5px] text-ink-body">
        Use this sequence as your mental model before attempting scenario or exam questions.
      </div>
    </div>
  );
}

function HierarchyMapCard() {
  const levels = [
    { title: 'Elimination', tone: 'bg-green-100 text-green-800 border-green-300' },
    { title: 'Substitution', tone: 'bg-lime-100 text-lime-800 border-lime-300' },
    { title: 'Engineering Controls', tone: 'bg-amber-100 text-amber-800 border-amber-300' },
    { title: 'Administrative Controls', tone: 'bg-orange-100 text-orange-800 border-orange-300' },
    { title: 'PPE', tone: 'bg-rose-100 text-rose-800 border-rose-300' },
  ];

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
      <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-700">
        <ShieldAlert size={13} />
        Control Priority Map
      </div>
      <div className="space-y-1.5">
        {levels.map((l) => (
          <div
            key={l.title}
            className={`rounded-md border px-2.5 py-1.5 text-[12px] font-semibold ${l.tone}`}
          >
            {l.title}
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-md border border-amber-200 bg-white px-2.5 py-2 text-[11.5px] text-ink-body">
        Decision rule: prioritize controls at the top when evaluating solutions.
      </div>
    </div>
  );
}

function trim(text: string, max: number): string {
  const t = (text || '').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function wrapShort(text: string, maxChars: number): string[] {
  const words = (text || '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [''];
  const out: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length <= maxChars) {
      cur = (cur + ' ' + w).trim();
    } else {
      if (cur) out.push(cur);
      cur = w;
    }
  }
  if (cur) out.push(cur);
  return out;
}
