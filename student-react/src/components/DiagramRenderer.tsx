// Renders the structured diagrams stored in topic_extras (extra_type = 'diagram').
// Supports the diagram types found in the legacy js/data files:
//   - hierarchy : ordered tier list (most → least effective, etc.)
//   - flow      : connected boxes (process steps, with optional branches)
//   - mindmap   : central node + colored branches with bullet items
//   - infocards : grid of compact info tiles
//   - matrix    : N×M grid (e.g. risk matrix)
//   - comparison: header+rows comparison table
// Unknown types fall back to a JSON dump so nothing is silently lost.

type AnyDiagram = Record<string, any>;

export default function DiagramRenderer({ d }: { d: AnyDiagram }) {
  if (!d || typeof d !== 'object') return null;
  const t = (d.type || '').toLowerCase();

  switch (t) {
    case 'hierarchy':  return <Hierarchy d={d} />;
    case 'flow':       return <Flow d={d} />;
    case 'mindmap':    return <Mindmap d={d} />;
    case 'infocards':  return <InfoCards d={d} />;
    case 'matrix':     return <Matrix d={d} />;
    case 'comparison': return <Comparison d={d} />;
    default:
      return (
        <div className="rounded-xl border border-ink-line bg-surface p-4">
          <pre className="overflow-x-auto whitespace-pre-wrap text-[11px] text-ink-dim">{JSON.stringify(d, null, 2)}</pre>
        </div>
      );
  }
}

function Comparison({ d }: { d: AnyDiagram }) {
  const headers: string[] = d.headers ?? d.columns ?? [];
  const rows: any[] = d.rows ?? [];
  if (headers.length === 0 || rows.length === 0) {
    return (
      <div className="rounded-xl border border-ink-line bg-surface p-4 text-[12px] text-ink-dim">
        Comparison diagram has no table rows yet.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-[12.5px]">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="border border-ink-line bg-surface px-3 py-2 text-left font-bold text-ink">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => {
            const cols = Array.isArray(r) ? r : [r];
            return (
              <tr key={ri}>
                {headers.map((_, ci) => (
                  <td key={ci} className="border border-ink-line bg-white px-3 py-2 text-ink-body">
                    {cols[ci] ?? '-'}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ────────────────────────────────────────────────────────────

function Hierarchy({ d }: { d: AnyDiagram }) {
  const levels: string[] = d.levels ?? [];
  const colors: string[] = d.colors ?? [];
  if (levels.length === 0) return null;

  // Real SVG pyramid: each level is a horizontal trapezoid stacked top→bottom.
  // Width grows from ~30% at the top to 100% at the base.
  const W = 800;
  const ROW_H = 64;
  const GAP = 4;
  const padX = 80;
  const padY = 12;
  const n = levels.length;
  const innerW = W - padX * 2;
  const H = padY * 2 + n * ROW_H + (n - 1) * GAP;

  const widthAt = (i: number) => {
    // top-most = 30% of inner width, bottom = 100%
    const t = i / Math.max(1, n - 1);
    return innerW * (0.3 + 0.7 * t);
  };

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} style={{ minWidth: '520px', width: '100%' }} role="img" aria-label="Hierarchy diagram showing tiered relationships between concepts">
        <defs>
          {colors.map((c, i) => (
            <linearGradient key={i} id={`pyr-${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={c} />
              <stop offset="100%" stopColor={c} stopOpacity="0.85" />
            </linearGradient>
          ))}
        </defs>

        {levels.map((label, i) => {
          const wTop = widthAt(i);
          const wBot = i === n - 1 ? wTop : widthAt(i + 1) - 6; // small inset at the bottom of each trap
          const cx = W / 2;
          const y = padY + i * (ROW_H + GAP);
          const xTopL = cx - wTop / 2;
          const xTopR = cx + wTop / 2;
          const xBotL = cx - wBot / 2;
          const xBotR = cx + wBot / 2;
          const color = colors[i] || '#EA580C';
          return (
            <g key={i}>
              <polygon
                points={`${xTopL},${y} ${xTopR},${y} ${xBotR},${y + ROW_H} ${xBotL},${y + ROW_H}`}
                fill={`url(#pyr-${i})`}
                stroke="#fff"
                strokeWidth="2"
              />
              <text
                x={cx}
                y={y + ROW_H / 2 + 5}
                textAnchor="middle"
                fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
                fontWeight="800"
                fontSize="16"
                fill="#fff"
                style={{ paintOrder: 'stroke', stroke: 'rgba(0,0,0,0.15)', strokeWidth: 0.5 }}
              >
                {label}
              </text>
              {/* Tiny circle index on the left */}
              <circle cx={xTopL - 14} cy={y + ROW_H / 2} r="11" fill="#fff" stroke={color} strokeWidth="2" />
              <text
                x={xTopL - 14}
                y={y + ROW_H / 2 + 4}
                textAnchor="middle"
                fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
                fontWeight="800"
                fontSize="11"
                fill={color}
              >
                {i + 1}
              </text>
            </g>
          );
        })}

        {/* Vertical axis labels */}
        <text
          x={28}
          y={padY + 18}
          textAnchor="start"
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight="700"
          fontSize="9"
          letterSpacing="2"
          fill="#16A34A"
        >
          ↑ MOST EFFECTIVE
        </text>
        <text
          x={28}
          y={H - padY}
          textAnchor="start"
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight="700"
          fontSize="9"
          letterSpacing="2"
          fill="#EF4444"
        >
          LEAST EFFECTIVE ↓
        </text>
      </svg>
    </div>
  );
}

function Flow({ d }: { d: AnyDiagram }) {
  const steps: string[] = d.steps ?? [];
  if (steps.length === 0) return null;

  // Real SVG flowchart with rounded boxes + arrowheads + diamond decisions.
  // Snake-layout: rows alternate direction so connecting arrows always make sense.
  const BOX_W = 170;
  const BOX_H = 78;
  const GAP = 56;
  const padX = 24;
  const padY = 24;
  const cols = Math.min(3, steps.length);
  const rows = Math.ceil(steps.length / cols);
  const W = padX * 2 + cols * BOX_W + (cols - 1) * GAP;
  const H = padY * 2 + rows * BOX_H + (rows - 1) * (GAP + 20);

  const positions = steps.map((_, i) => {
    const row = Math.floor(i / cols);
    const colInRow = i % cols;
    const left2right = row % 2 === 0;
    const col = left2right ? colInRow : cols - 1 - colInRow;
    const x = padX + col * (BOX_W + GAP);
    const y = padY + row * (BOX_H + GAP + 20);
    return { x, y, row, left2right };
  });

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} style={{ minWidth: '600px', width: '100%' }} role="img" aria-label="Process flow diagram with decision points and connected steps">
        <defs>
          <marker id="flow-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#94A3B8" />
          </marker>
          <linearGradient id="flow-box" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFF7ED" />
            <stop offset="100%" stopColor="#FFFFFF" />
          </linearGradient>
          <linearGradient id="flow-diamond" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FEF3C7" />
            <stop offset="100%" stopColor="#FFFBEB" />
          </linearGradient>
        </defs>

        {/* Connectors */}
        {positions.slice(0, -1).map((p, i) => {
          const next = positions[i + 1];
          const sameRow = p.row === next.row;
          if (sameRow) {
            const x1 = p.left2right ? p.x + BOX_W : p.x;
            const x2 = p.left2right ? next.x : next.x + BOX_W;
            const y = p.y + BOX_H / 2;
            return <line key={`c-${i}`} x1={x1} y1={y} x2={x2} y2={y} stroke="#94A3B8" strokeWidth="2" markerEnd="url(#flow-arrow)" />;
          }
          const x = p.x + BOX_W / 2;
          const y1 = p.y + BOX_H;
          const y2 = next.y;
          return (
            <path
              key={`c-${i}`}
              d={`M ${x} ${y1} L ${x} ${(y1 + y2) / 2} L ${next.x + BOX_W / 2} ${(y1 + y2) / 2} L ${next.x + BOX_W / 2} ${y2}`}
              fill="none"
              stroke="#94A3B8"
              strokeWidth="2"
              markerEnd="url(#flow-arrow)"
            />
          );
        })}

        {/* Boxes */}
        {positions.map((p, i) => {
          const step = steps[i];
          const isDecision = step.startsWith('?');
          const label = isDecision ? step.slice(1) : step;
          const cx = p.x + BOX_W / 2;
          const cy = p.y + BOX_H / 2;

          if (isDecision) {
            return (
              <g key={`b-${i}`}>
                <polygon
                  points={`${cx},${p.y} ${p.x + BOX_W},${cy} ${cx},${p.y + BOX_H} ${p.x},${cy}`}
                  fill="url(#flow-diamond)"
                  stroke="#F59E0B"
                  strokeWidth="2"
                />
                <text
                  x={cx}
                  textAnchor="middle"
                  fontFamily="Inter, system-ui, sans-serif"
                  fontWeight="700"
                  fontSize="10"
                  fill="#92400E"
                >
                  {wrapForBox(label, 18).slice(0, 3).map((line, li) => (
                    <tspan key={li} x={cx} y={cy - 6 + li * 12}>{line}</tspan>
                  ))}
                </text>
              </g>
            );
          }

          return (
            <g key={`b-${i}`}>
              <rect x={p.x} y={p.y} width={BOX_W} height={BOX_H} rx="14" fill="url(#flow-box)" stroke="#FB923C" strokeWidth="2" />
              <circle cx={p.x + 16} cy={p.y + 16} r="11" fill="#EA580C" />
              <text
                x={p.x + 16}
                y={p.y + 20}
                textAnchor="middle"
                fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
                fontWeight="800"
                fontSize="11"
                fill="#fff"
              >
                {i + 1}
              </text>
              <text
                fontFamily="Inter, system-ui, sans-serif"
                fontWeight="700"
                fontSize="11"
                fill="#0F172A"
              >
                {wrapForBox(label, 18).slice(0, 4).map((line, li) => (
                  <tspan key={li} x={p.x + 36} y={p.y + 24 + li * 13}>{line}</tspan>
                ))}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function wrapForBox(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length <= maxChars) cur = (cur + ' ' + w).trim();
    else { if (cur) lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}

function Mindmap({ d }: { d: AnyDiagram }) {
  const center: string = d.center ?? '';
  const branches: { label: string; items?: string[]; color?: string }[] = d.branches ?? [];
  return (
    <div className="space-y-4">
      {/* Center node */}
      <div className="mx-auto max-w-md rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-5 text-center shadow-glow">
        <div className="whitespace-pre-line font-display text-[15px] font-bold text-white">{center}</div>
      </div>
      {/* Branches grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {branches.map((b, i) => {
          const color = b.color || '#EA580C';
          return (
            <div key={i} className="rounded-xl border border-ink-line bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                <div className="font-display text-[13px] font-bold uppercase tracking-wider" style={{ color }}>
                  {b.label}
                </div>
              </div>
              {b.items && b.items.length > 0 && (
                <ul className="mt-2 space-y-1 text-[12.5px] text-ink-body">
                  {b.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-1.5">
                      <span className="mt-1 h-1 w-1 shrink-0 rounded-full" style={{ background: color }} />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InfoCards({ d }: { d: AnyDiagram }) {
  const cards: { title: string; description?: string; icon?: string; color?: string }[] = d.cards ?? d.items ?? [];
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c, i) => {
        const color = c.color || '#EA580C';
        return (
          <div key={i} className="rounded-xl border border-ink-line bg-white p-4 shadow-sm">
            <div className="h-1 w-12 rounded-full" style={{ background: color }} />
            <div className="mt-3 font-display text-[14px] font-bold text-ink">{c.title}</div>
            {c.description && (
              <p className="mt-1 text-[12.5px] text-ink-body">{c.description}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Matrix({ d }: { d: AnyDiagram }) {
  const rows: string[] = d.rows ?? [];
  const cols: string[] = d.cols ?? d.columns ?? [];
  const cells: any[][] = d.cells ?? [];
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[12.5px]">
        <thead>
          <tr>
            <th className="border border-ink-line bg-surface p-2"></th>
            {cols.map((c, i) => (
              <th key={i} className="border border-ink-line bg-surface p-2 font-bold text-ink">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri}>
              <th className="border border-ink-line bg-surface p-2 text-left font-bold text-ink">{r}</th>
              {cols.map((_, ci) => {
                const cell = cells[ri]?.[ci];
                const label = typeof cell === 'object' ? cell?.label ?? '' : cell ?? '';
                const color = typeof cell === 'object' ? cell?.color : null;
                return (
                  <td
                    key={ci}
                    className="border border-ink-line p-3 text-center font-semibold"
                    style={color ? { background: color, color: '#fff' } : {}}
                  >
                    {label}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
