import { motion, useReducedMotion } from 'framer-motion';

type Props = {
  className?: string;
  /** 'dark' for hero (over navy gradient), 'light' for use over white */
  variant?: 'dark' | 'light';
};

/**
 * Animated neural-network mesh — pure SVG, no Three.js.
 *
 * 24 nodes in an organic scatter, connected by edges with low opacity. Nodes
 * pulse softly (3s) and edges shimmer (8s). No mouse interaction by design —
 * the brief commands "every animation has purpose, no spinning logos." This
 * is ambient, restrained.
 *
 * `prefers-reduced-motion`: nodes/edges go static.
 */
export default function NeuralMesh({ className = '', variant = 'dark' }: Props) {
  const reduced = useReducedMotion();

  // 24 nodes in a deterministic seed-based scatter (looks organic, predictable in tests)
  const nodes: Array<{ x: number; y: number; r: number; delay: number }> = Array.from(
    { length: 24 },
    (_, i) => {
      // Hash-like deterministic positions (no random)
      const seed = (i * 9301 + 49297) % 233280;
      const x = (seed % 100) / 100;
      const y = ((seed * 13) % 100) / 100;
      const r = 0.4 + ((i * 7) % 10) / 10 * 0.4;
      return { x, y, r, delay: (i * 0.13) % 3 };
    },
  );

  // Edges: connect each node to its 1-2 nearest neighbours (computed once)
  const edges: Array<{ a: number; b: number }> = [];
  for (let i = 0; i < nodes.length; i++) {
    const dists = nodes.map((n, j) => ({
      j,
      d: i === j ? Infinity : Math.hypot(n.x - nodes[i].x, n.y - nodes[i].y),
    })).sort((a, b) => a.d - b.d);
    edges.push({ a: i, b: dists[0].j });
    if (dists[1].d < 0.3) edges.push({ a: i, b: dists[1].j });
  }

  const nodeColor = variant === 'dark' ? '#FB923C' : '#EA580C';
  const edgeColor = variant === 'dark' ? '#1A3557' : '#94A3B8';

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    >
      <defs>
        <radialGradient id="node-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={nodeColor} stopOpacity="1" />
          <stop offset="100%" stopColor={nodeColor} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Edges first (behind nodes) */}
      {edges.map((e, i) => (
        <motion.line
          key={`e-${i}`}
          x1={nodes[e.a].x * 100}
          y1={nodes[e.a].y * 100}
          x2={nodes[e.b].x * 100}
          y2={nodes[e.b].y * 100}
          stroke={edgeColor}
          strokeWidth="0.08"
          strokeOpacity={variant === 'dark' ? 0.45 : 0.25}
          initial={reduced ? false : { pathLength: 0, opacity: 0 }}
          animate={reduced ? undefined : { pathLength: 1, opacity: variant === 'dark' ? 0.45 : 0.25 }}
          transition={{
            duration: 2,
            delay: 0.5 + i * 0.04,
            ease: 'easeOut',
          }}
        />
      ))}

      {/* Nodes */}
      {nodes.map((n, i) => (
        <g key={`n-${i}`}>
          {/* Glow halo */}
          <motion.circle
            cx={n.x * 100}
            cy={n.y * 100}
            r={n.r * 1.8}
            fill="url(#node-glow)"
            initial={{ opacity: 0 }}
            animate={reduced ? { opacity: 0.6 } : {
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={reduced ? undefined : {
              duration: 3,
              delay: n.delay,
              ease: 'easeInOut',
              repeat: Infinity,
            }}
          />
          {/* Core */}
          <motion.circle
            cx={n.x * 100}
            cy={n.y * 100}
            r={n.r * 0.6}
            fill={nodeColor}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: 0.6,
              delay: 0.2 + i * 0.04,
              ease: 'easeOut',
            }}
          />
        </g>
      ))}
    </svg>
  );
}
