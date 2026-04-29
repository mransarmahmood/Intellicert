import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Workflow, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';
import { pickConceptIcon } from '../components/ConceptIcon';

type Domain = { id: string; number: number; name: string; color_hex: string };
type Topic = { id: number; name: string; domain_id: string };
type TopicWithConcepts = {
  id: number;
  name: string;
  subtitle: string | null;
  domain_id: string;
  domain?: Domain;
  concepts?: Concept[];
};
type Concept = { id: number; title: string; description: string | null; image_url: string | null };

export default function ConceptMapsPage() {
  const domainsQ = useQuery({ queryKey: ['domains'], queryFn: () => api<{ domains: Domain[] }>('/domains') });
  const topicsQ = useQuery({ queryKey: ['topics-all'], queryFn: () => api<{ topics: Topic[] }>('/topics') });

  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [selectedConceptId, setSelectedConceptId] = useState<number | null>(null);

  const topicQ = useQuery({
    queryKey: ['topic', selectedTopicId],
    queryFn: () => api<{ topic: TopicWithConcepts }>(`/topics/${selectedTopicId}`),
    enabled: !!selectedTopicId,
  });

  // Auto-select the first topic that has concepts
  useMemo(() => {
    if (selectedTopicId || !topicsQ.data?.topics.length) return;
    setSelectedTopicId(topicsQ.data.topics[0].id);
  }, [topicsQ.data, selectedTopicId]);

  // Reset highlighted concept whenever the topic changes
  useMemo(() => { setSelectedConceptId(null); }, [selectedTopicId]);

  const topic = topicQ.data?.topic;
  const concepts = topic?.concepts ?? [];
  const accent = topic?.domain?.color_hex || '#EA580C';

  return (
    <div className="wrap py-10">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-700 ring-1 ring-indigo-500/20">
          <Workflow size={12} /> Memory tools
        </div>
        <h1 className="mt-3 font-display text-3xl font-extrabold text-ink sm:text-4xl">Concept Maps</h1>
        <p className="mt-2 text-[15px] text-ink-body">
          Visualize how every core concept inside a topic connects back to the central idea — a powerful way to encode relationships in long-term memory.
        </p>
      </div>

      {/* Topic picker */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <select
          value={selectedTopicId ?? ''}
          onChange={(e) => setSelectedTopicId(Number(e.target.value))}
          className="input max-w-md"
        >
          {(topicsQ.data?.topics ?? []).map((t) => {
            const d = domainsQ.data?.domains.find((dd) => dd.id === t.domain_id);
            return (
              <option key={t.id} value={t.id}>
                {d ? `${d.number}. ` : ''}{t.name}
              </option>
            );
          })}
        </select>
        {topic && (
          <Link to={`/topics/${topic.id}`} className="btn btn-ghost btn-sm">
            Open topic <ArrowRight size={13} />
          </Link>
        )}
      </div>

      {topicQ.isLoading || !topic ? (
        <div className="grid place-items-center py-20 text-ink-dim"><Loader2 className="animate-spin" /></div>
      ) : concepts.length === 0 ? (
        <div className="card grid place-items-center py-16 text-[13px] text-ink-dim">
          This topic has no concepts to map yet
        </div>
      ) : (
        <>
          <ConceptMap
            topic={topic}
            concepts={concepts}
            accent={accent}
            selectedConceptId={selectedConceptId}
            onSelect={setSelectedConceptId}
          />
          <ConceptDetail
            concept={concepts.find((c) => c.id === selectedConceptId) ?? null}
            accent={accent}
            onClose={() => setSelectedConceptId(null)}
          />
        </>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────

import { X } from 'lucide-react';
function ConceptDetail({
  concept,
  onClose,
}: {
  concept: Concept | null;
  accent: string;
  onClose: () => void;
}) {
  if (!concept) {
    return (
      <div className="card mt-6 p-5 text-center text-[13px] text-ink-dim">
        Click any concept node above to read its Detail Understanding here.
      </div>
    );
  }
  const meta = pickConceptIcon(concept.title);
  const Icon = meta.icon;
  return (
    <div className="card mt-6 overflow-hidden">
      <div
        className="flex items-start gap-4 border-b border-ink-line p-5"
        style={{ background: `linear-gradient(90deg, ${meta.color}15, transparent 60%)` }}
      >
        <div
          className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-white shadow-sm"
          style={{ background: `linear-gradient(135deg, ${meta.color}, ${meta.color}CC)` }}
        >
          <Icon size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-ink-dim">Concept</div>
          <h3 className="font-display text-[18px] font-bold text-ink">{concept.title}</h3>
        </div>
        <button
          onClick={onClose}
          className="grid h-8 w-8 place-items-center rounded-full text-ink-muted hover:bg-slate-100"
          title="Close"
        >
          <X size={14} />
        </button>
      </div>
      {concept.image_url && (
        <img src={concept.image_url} alt={concept.title} className="w-full max-h-72 object-cover" />
      )}
      <div className="p-6">
        {concept.description ? (
          <p className="whitespace-pre-line text-[14px] leading-relaxed text-ink-body">{concept.description}</p>
        ) : (
          <p className="text-[13px] text-ink-dim">No description available for this concept.</p>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Radial concept map: central node + N spokes
// Renders as SVG so it stays crisp at any zoom level.

function ConceptMap({
  topic,
  concepts,
  accent,
  selectedConceptId,
  onSelect,
}: {
  topic: TopicWithConcepts;
  concepts: Concept[];
  accent: string;
  selectedConceptId: number | null;
  onSelect: (id: number) => void;
}) {
  // Limit to 12 to keep the map readable
  const items = concepts.slice(0, 12);
  const n = items.length;

  // SVG layout
  const W = 900;
  const H = Math.max(560, 420 + n * 12);
  const cx = W / 2;
  const cy = H / 2;
  const R = Math.min(W, H) * 0.36;
  const centerR = 90;
  const nodeR = 50;

  // Compute node positions evenly around the circle
  const nodes = items.map((c, i) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    const x = cx + R * Math.cos(angle);
    const y = cy + R * Math.sin(angle);
    const meta = pickConceptIcon(c.title);
    return { ...c, x, y, color: meta.color };
  });

  return (
    <div className="card overflow-hidden p-2">
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: '720px' }}>
          {/* Defs: subtle background grid + center glow */}
          <defs>
            <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%"  stopColor={accent} stopOpacity="0.35" />
              <stop offset="60%" stopColor={accent} stopOpacity="0.08" />
              <stop offset="100%" stopColor={accent} stopOpacity="0" />
            </radialGradient>
            <linearGradient id="centerFill" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"  stopColor={accent} />
              <stop offset="100%" stopColor={accent} stopOpacity="0.7" />
            </linearGradient>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E2E8F0" strokeWidth="0.5" opacity="0.5" />
            </pattern>
          </defs>

          {/* Background */}
          <rect width="100%" height="100%" fill="url(#grid)" />
          <circle cx={cx} cy={cy} r={R + centerR} fill="url(#centerGlow)" />

          {/* Connecting lines */}
          {nodes.map((node, i) => (
            <line
              key={`l-${i}`}
              x1={cx}
              y1={cy}
              x2={node.x}
              y2={node.y}
              stroke={node.color}
              strokeWidth="2"
              strokeOpacity="0.35"
              strokeDasharray="4 4"
            />
          ))}

          {/* Center node */}
          <circle cx={cx} cy={cy} r={centerR} fill="url(#centerFill)" />
          <circle cx={cx} cy={cy} r={centerR} fill="none" stroke="#fff" strokeOpacity="0.4" strokeWidth="2" />
          <text
            x={cx}
            y={cy - 6}
            textAnchor="middle"
            fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
            fontWeight="800"
            fontSize="14"
            fill="#fff"
          >
            <tspan x={cx} dy="0">{wrapText(topic.name, 16)[0] ?? ''}</tspan>
            {wrapText(topic.name, 16).slice(1, 3).map((line, i) => (
              <tspan key={i} x={cx} dy="16">{line}</tspan>
            ))}
          </text>
          <text
            x={cx}
            y={cy + 38}
            textAnchor="middle"
            fontSize="9"
            fontWeight="700"
            letterSpacing="2"
            fill="#fff"
            opacity="0.8"
          >
            {n} CONCEPTS
          </text>

          {/* Concept nodes */}
          {nodes.map((node, i) => {
            const isSelected = node.id === selectedConceptId;
            return (
            <g
              key={`n-${i}`}
              onClick={() => onSelect(node.id)}
              style={{ cursor: 'pointer' }}
            >
              {/* Outer ring */}
              <circle
                cx={node.x}
                cy={node.y}
                r={nodeR + (isSelected ? 8 : 4)}
                fill="#fff"
                stroke={node.color}
                strokeOpacity={isSelected ? '0.5' : '0.25'}
                strokeWidth={isSelected ? '3' : '2'}
              />
              {/* Filled disc */}
              <circle
                cx={node.x}
                cy={node.y}
                r={nodeR}
                fill={node.color}
                fillOpacity={isSelected ? '0.22' : '0.12'}
                stroke={node.color}
                strokeWidth={isSelected ? '3.5' : '2.5'}
              />
              {/* Number */}
              <text
                x={node.x}
                y={node.y - 6}
                textAnchor="middle"
                fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
                fontWeight="800"
                fontSize="22"
                fill={node.color}
              >
                {String(i + 1).padStart(2, '0')}
              </text>
              {/* Title (1-2 lines) */}
              {wrapText(node.title, 14).slice(0, 2).map((line, j) => (
                <text
                  key={j}
                  x={node.x}
                  y={node.y + 14 + j * 11}
                  textAnchor="middle"
                  fontFamily="Inter, system-ui, sans-serif"
                  fontWeight="600"
                  fontSize="9"
                  fill="#0F172A"
                >
                  {line}
                </text>
              ))}
            </g>
            );
          })}
        </svg>
      </div>

      {/* Legend below the map */}
      <div className="mt-4 grid gap-2 border-t border-ink-line p-4 sm:grid-cols-2 lg:grid-cols-3">
        {nodes.map((node, i) => {
          const meta = pickConceptIcon(node.title);
          const Icon = meta.icon;
          const isSelected = node.id === selectedConceptId;
          return (
            <button
              key={node.id}
              onClick={() => onSelect(node.id)}
              className={`flex w-full items-center gap-2.5 rounded-lg border px-2 py-1.5 text-left text-[12.5px] transition ${
                isSelected ? 'border-ink-line bg-surface' : 'border-transparent hover:bg-surface/60'
              }`}
            >
              <div
                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-white"
                style={{ background: `linear-gradient(135deg, ${node.color}, ${node.color}CC)` }}
              >
                <Icon size={13} />
              </div>
              <span className="font-bold text-ink-dim">{String(i + 1).padStart(2, '0')}</span>
              <span className="truncate text-ink">{node.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Tiny word-wrap helper for SVG text
function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length <= maxChars) cur = (cur + ' ' + w).trim();
    else {
      if (cur) lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}
