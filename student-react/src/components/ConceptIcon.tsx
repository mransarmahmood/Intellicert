// Picks an appropriate Lucide icon for a concept based on title keywords.
// Falls back to a numbered circle if no keyword matches.

import {
  Shield, ShieldCheck, Layers, AlertTriangle, Wrench, Cog,
  HardHat, Flame, Droplet, Wind, Zap, Activity, Eye,
  Stethoscope, FlaskConical, TestTube, Lock, KeyRound,
  Users, ClipboardCheck, ClipboardList, BookOpen,
  Calculator, BarChart3, TrendingUp, GitBranch, Target,
  Bell, Siren, Phone, Truck, Building2, Factory, TreePine,
  Recycle, Leaf, ThermometerSun, Volume2,
  CircleDot, Box, Pencil, FileText,
  ScrollText, Scale, Gavel, BadgeCheck, Award,
  XCircle, ArrowRightCircle, Workflow,
} from 'lucide-react';

type IconRule = { match: RegExp; icon: any; color: string };

// Order matters — first match wins. More specific patterns first.
const RULES: IconRule[] = [
  // Hierarchy of controls / safety design
  { match: /hierarchy|hierachy/i,                       icon: Layers,         color: '#10B981' },
  { match: /elimination|eliminate/i,                    icon: XCircle,        color: '#16A34A' },
  { match: /substitut/i,                                icon: ArrowRightCircle, color: '#22C55E' },
  { match: /engineering control/i,                      icon: Cog,            color: '#FBBF24' },
  { match: /administrative control/i,                   icon: ClipboardList,  color: '#F97316' },
  { match: /\bppe\b|personal protective/i,              icon: HardHat,        color: '#EF4444' },
  { match: /poka.?yoke|error.?proofing|fail.?safe/i,    icon: ShieldCheck,    color: '#06B6D4' },
  { match: /inherent.*safe|inherently safer/i,          icon: Shield,         color: '#10B981' },
  { match: /design|ptd|prevention.through.design/i,     icon: Pencil,         color: '#8B5CF6' },

  // Hazards
  { match: /\bfire\b|combust|flamm|ignit/i,             icon: Flame,          color: '#EF4444' },
  { match: /electric|voltage|current|gfci|afci/i,       icon: Zap,            color: '#F59E0B' },
  { match: /\bnoise\b|decibel|hearing/i,                icon: Volume2,        color: '#8B5CF6' },
  { match: /\bfall\b|height|guardrail|harness/i,        icon: AlertTriangle,  color: '#EF4444' },
  { match: /confined space|atmosphere/i,                icon: Box,            color: '#06B6D4' },
  { match: /loto|lockout|tagout|isolation/i,            icon: Lock,           color: '#EA580C' },

  // Chemical / process
  { match: /chemical|reactiv|compatibil|hazmat/i,       icon: FlaskConical,   color: '#8B5CF6' },
  { match: /pressure|relief|valve/i,                    icon: Activity,       color: '#3B82F6' },
  { match: /process|psm|moc|management of change/i,     icon: Workflow,       color: '#6366F1' },
  { match: /pyrophoric|spontaneous/i,                   icon: Flame,          color: '#DC2626' },

  // Health / exposure
  { match: /toxic|carcinogen|exposure/i,                icon: TestTube,       color: '#A855F7' },
  { match: /respirat|breathing|inhal/i,                 icon: Wind,           color: '#06B6D4' },
  { match: /ergonomic|lift|posture|musculoskeletal/i,   icon: Activity,       color: '#10B981' },
  { match: /epidemic|disease|public health/i,           icon: Stethoscope,    color: '#EC4899' },
  { match: /vision|sight|eye/i,                         icon: Eye,            color: '#3B82F6' },
  { match: /heat|cold|temperature/i,                    icon: ThermometerSun, color: '#F97316' },

  // Environment
  { match: /environment|epa|pollution|emission/i,       icon: Leaf,           color: '#10B981' },
  { match: /waste|recycl/i,                             icon: Recycle,        color: '#22C55E' },
  { match: /water|liquid|spill/i,                       icon: Droplet,        color: '#06B6D4' },
  { match: /sustainab|esg/i,                            icon: TreePine,       color: '#16A34A' },

  // Equipment
  { match: /forklift|powered industrial|pit/i,          icon: Truck,          color: '#F97316' },
  { match: /vehicle|fleet|truck/i,                      icon: Truck,          color: '#3B82F6' },
  { match: /tool|machine|equip|guard/i,                 icon: Wrench,         color: '#64748B' },
  { match: /facility|building|construct/i,              icon: Building2,      color: '#6366F1' },
  { match: /factory|manufactur/i,                       icon: Factory,        color: '#475569' },

  // Emergency
  { match: /alarm|alert|signal/i,                       icon: Bell,           color: '#F59E0B' },
  { match: /emergency|evacuat|rescue/i,                 icon: Siren,          color: '#EF4444' },
  { match: /communicat|phone|contact/i,                 icon: Phone,          color: '#3B82F6' },

  // Management / metrics
  { match: /metric|kpi|indicator|measur/i,              icon: BarChart3,      color: '#8B5CF6' },
  { match: /trend|improvement|growth/i,                 icon: TrendingUp,     color: '#10B981' },
  { match: /risk|matrix|likelihood|sever/i,             icon: Target,         color: '#EF4444' },
  { match: /audit|inspect|review/i,                     icon: ClipboardCheck, color: '#06B6D4' },
  { match: /budget|cost|finance|roi/i,                  icon: Calculator,     color: '#10B981' },
  { match: /tree|fault|fmea|hazop|pha/i,                icon: GitBranch,      color: '#A855F7' },

  // Documentation / regulation
  { match: /document|record|report/i,                   icon: FileText,       color: '#64748B' },
  { match: /procedure|policy|sop/i,                     icon: ScrollText,     color: '#6366F1' },
  { match: /regulat|standard|osha|ansi|nfpa/i,          icon: Scale,          color: '#DC2626' },
  { match: /law|legal|liab/i,                           icon: Gavel,          color: '#7C3AED' },
  { match: /training|learn|teach|educat/i,              icon: BookOpen,       color: '#EA580C' },
  { match: /people|worker|employee|team/i,              icon: Users,          color: '#3B82F6' },
  { match: /competen|qualif|certif/i,                   icon: BadgeCheck,     color: '#16A34A' },

  // Catch-alls
  { match: /key|critical|important/i,                   icon: KeyRound,       color: '#F59E0B' },
  { match: /quality|excellence|best/i,                  icon: Award,          color: '#FBBF24' },
];

export function pickConceptIcon(title: string, fallbackColor = '#EA580C'): { icon: any; color: string } {
  for (const r of RULES) {
    if (r.match.test(title)) return { icon: r.icon, color: r.color };
  }
  return { icon: CircleDot, color: fallbackColor };
}

export default function ConceptIcon({
  title,
  size = 22,
  className = '',
}: {
  title: string;
  size?: number;
  className?: string;
}) {
  const { icon: Icon, color } = pickConceptIcon(title);
  return (
    <div
      role="img"
      aria-label={title}
      className={`grid place-items-center rounded-xl text-white shadow-sm ${className}`}
      style={{
        width: size + 18,
        height: size + 18,
        background: `linear-gradient(135deg, ${color}, ${color}CC)`,
      }}
    >
      <Icon size={size} strokeWidth={2.25} aria-hidden="true" />
    </div>
  );
}
