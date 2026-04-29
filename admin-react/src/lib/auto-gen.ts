/**
 * Content-to-visualization + auto-generation helpers.
 *
 * Given raw topic content (title, overview, concepts, formulas, etc.),
 * these helpers pick the best visualization type and synthesize
 * flashcards, quiz questions, and mnemonics heuristically — no AI API calls.
 * The admin can review and edit before saving.
 */

export type VisualType =
  | 'hierarchy-of-controls'
  | 'risk-matrix'
  | 'process-flow'
  | 'fire-tetrahedron'
  | 'heinrich-triangle'
  | 'dose-calculator'
  | 'domino-theory'
  | 'lifecycle-pdca'
  | 'timeline-emergency'
  | 'defense-layers'
  | 'loto-sequence'
  | 'hazard-particles'
  | 'ripple-causal'
  | 'ppe-sequence'
  | 'nfpa-diamond'
  | 'electrical-schematic'
  | 'ventilation-flow'
  | 'fault-tree'
  | 'formula-calculator'
  | 'scenario-gallery'
  | 'comparison-matrix';

export type Concept = { term: string; definition: string };
export type Formula = { name: string; formula: string; description?: string };
export type ExamTip = { tip: string };
export type Scenario = { title: string; description: string };

export type TopicInput = {
  title: string;
  subtitle: string;
  overview: string;
  concepts: Concept[];
  formulas: Formula[];
  examTips: ExamTip[];
  scenarios: Scenario[];
  domainId: string;
};

export type Flashcard = { front: string; back: string; difficulty: 'easy' | 'medium' | 'hard' };
export type QuizQuestion = { question: string; options: string[]; correctIndex: number; explanation: string };
export type Mnemonic = { title: string; phrase: string; explanation: string };

export type GeneratedSuite = {
  visual: { type: VisualType; confidence: number; reason: string };
  flashcards: Flashcard[];
  quizQuestions: QuizQuestion[];
  mnemonics: Mnemonic[];
};

/* -------------------------------------------------------------------------- *
 * 1. Visual auto-detector — keyword pattern matching
 * -------------------------------------------------------------------------- */

type VisualRule = {
  type: VisualType;
  patterns: RegExp[];
  weight: number;
  reason: string;
};

const VISUAL_RULES: VisualRule[] = [
  { type: 'hierarchy-of-controls', patterns: [/hierarchy\s+of\s+controls?/i, /\belimination\b.*\bsubstitution\b/i, /engineering\s+controls?/i, /\badministrative\s+controls?/i], weight: 10, reason: 'Topic mentions the 5-tier hierarchy of controls' },
  { type: 'nfpa-diamond',          patterns: [/\bnfpa\s*704/i, /fire\s+diamond/i, /hazard\s+diamond/i, /health.*flammability.*reactivity/i], weight: 10, reason: 'NFPA 704 fire diamond is the reference visualization' },
  { type: 'fire-tetrahedron',      patterns: [/fire\s+tetrahedron/i, /fuel.*heat.*oxygen/i, /chain\s+reaction/i, /combustion/i, /\bignition\b.*\bfuel\b/i, /hot\s+work/i], weight: 9, reason: 'Topic is about fire chemistry / combustion' },
  { type: 'risk-matrix',           patterns: [/risk\s+matrix/i, /likelihood\s*[×x*]\s*severity/i, /risk\s+assessment/i, /\brisk\s+score/i, /\balarp\b/i, /\balara\b/i], weight: 10, reason: '5×5 probability vs severity grid fits this topic' },
  { type: 'loto-sequence',         patterns: [/\bloto\b/i, /lockout[- ]?tag(out)?/i, /1910\.147/i, /hazardous\s+energy/i, /isolate.*energy/i], weight: 10, reason: 'LOTO procedure is the reference visualization' },
  { type: 'electrical-schematic',  patterns: [/\belectrical\b.*\b(system|circuit|hazard|safety)/i, /\bohm'?s\s+law/i, /\bgfci\b/i, /\barc\s+flash/i, /\bshort\s+circuit/i, /subpart\s+s\b/i], weight: 9, reason: 'Electrical circuit simulator explains the concepts interactively' },
  { type: 'ventilation-flow',      patterns: [/ventilation/i, /local\s+exhaust/i, /capture\s+velocity/i, /\bacgih\b/i, /\bhood\b.*\b(design|velocity)/i], weight: 10, reason: 'Industrial ventilation with ACGIH formula' },
  { type: 'dose-calculator',       patterns: [/\bnoise\s+dose/i, /\bosha\s+dose/i, /twa/i, /\bpel\b.*\bdba\b/i, /\bhearing\s+conservation/i, /\bc\/t\b/i, /permissible\s+exposure/i], weight: 9, reason: 'OSHA dose formula live calculator' },
  { type: 'heinrich-triangle',     patterns: [/heinrich/i, /\b1\s*:\s*10\s*:\s*30\s*:\s*600/i, /accident\s+ratio/i, /injury\s+pyramid/i, /near[- ]?miss/i], weight: 9, reason: 'Heinrich injury ratio pyramid' },
  { type: 'domino-theory',         patterns: [/domino/i, /causal\s+chain/i, /5\s+whys?/i, /root\s+cause/i, /unsafe\s+act/i], weight: 8, reason: 'Causal chain visualization' },
  { type: 'defense-layers',        patterns: [/swiss\s+cheese/i, /defense\s+in\s+depth/i, /layers?\s+of\s+protection/i, /\blopa\b/i, /barriers?.*control/i, /\bradiation\b/i, /time.*distance.*shield/i], weight: 9, reason: 'Swiss cheese defense-in-depth model' },
  { type: 'timeline-emergency',    patterns: [/emergency\s+response/i, /erp\b/i, /evacuat/i, /incident\s+command/i, /shelter[- ]in[- ]place/i, /\bnims\b/i], weight: 9, reason: 'Emergency response timeline' },
  { type: 'lifecycle-pdca',        patterns: [/\bpdca\b/i, /plan[-\s]do[-\s]check[-\s]act/i, /continual\s+improvement/i, /\bvpp\b/i, /osha\s+vpp/i, /management\s+cycle/i, /iso\s+45001/i, /iso\s+14001/i], weight: 9, reason: 'Cyclic management process' },
  { type: 'ppe-sequence',          patterns: [/\bppe\b.*(sequence|order|donning|doffing)/i, /donning.*doffing/i, /respirator.*gloves/i], weight: 9, reason: 'PPE donning sequence puzzle' },
  { type: 'hazard-particles',      patterns: [/exposure\s+control/i, /airborne\s+hazard/i, /silica/i, /dust.*exposure/i, /\benclosure.*ventilat/i, /air\s+pollution/i], weight: 7, reason: 'Animated exposure particle cloud' },
  { type: 'ripple-causal',         patterns: [/ripple\s+effect/i, /chain\s+of\s+events/i, /\bconsequence.*propagat/i, /struck[- ]by/i, /groundwater/i, /contaminant\s+plume/i], weight: 7, reason: 'Propagating cause-effect ripple' },
  { type: 'fault-tree',            patterns: [/fault\s+tree/i, /\bfta\b/i, /\bfmea\b/i, /reliability/i, /\band\s+gate\b/i, /or\s+gate/i, /boolean/i, /\bmtbf\b/i], weight: 10, reason: 'Fault tree with AND/OR gates' },
  { type: 'formula-calculator',    patterns: [/\bmtbf\b/i, /\bmttr\b/i, /\bnpv\b/i, /cost[- ]benefit/i, /\broi\b/i, /ideal\s+gas/i, /pv\s*=\s*nrt/i, /gas\s+laws?/i, /statistics?/i, /probability/i, /\bpayback\b/i, /engineering\s+mechanics/i, /\bmoment\b.*\bforce/i, /structural/i], weight: 7, reason: 'Formula-heavy topic → live calculator' },
  { type: 'process-flow',          patterns: [/\b(process|procedure|workflow|steps?|sequence)\b/i, /permit[- ]to[- ]work/i, /investigat/i, /audit/i, /\bpsm\b/i, /investigation/i], weight: 5, reason: 'Step-by-step process' },
  { type: 'comparison-matrix',     patterns: [/\bcompar/i, /\btype[s]?\s+of\b/i, /class\s+[a-k]/i, /\bvs\.?\b/i, /category/i, /classification/i], weight: 4, reason: 'Topic compares multiple categories/types' },
  { type: 'scenario-gallery',      patterns: [/example\s+(questions?|answers?)/i, /practice\s+questions?/i, /exam\s+questions?/i, /scenarios?/i], weight: 8, reason: 'Exam-style practice set' },
];

export function detectVisual(input: Pick<TopicInput, 'title' | 'subtitle' | 'overview' | 'concepts'>): {
  type: VisualType;
  confidence: number;
  reason: string;
  alternatives: { type: VisualType; score: number }[];
} {
  const haystack = [
    input.title,
    input.subtitle,
    input.overview,
    ...input.concepts.map((c) => c.term + ' ' + c.definition),
  ]
    .join('\n')
    .toLowerCase();

  const scores = VISUAL_RULES.map((rule) => {
    const hits = rule.patterns.reduce((acc, p) => acc + (p.test(haystack) ? 1 : 0), 0);
    return { type: rule.type, score: hits * rule.weight, reason: rule.reason };
  });

  const sorted = scores.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);
  const top = sorted[0];

  if (!top) {
    return {
      type: 'process-flow',
      confidence: 0.2,
      reason: 'No strong signal — process-flow is a versatile default',
      alternatives: [],
    };
  }

  const max = 50;
  const confidence = Math.min(1, top.score / max);
  return {
    type: top.type,
    confidence,
    reason: top.reason,
    alternatives: sorted.slice(1, 4).map(({ type, score }) => ({ type, score })),
  };
}

/* -------------------------------------------------------------------------- *
 * 2. Flashcard generator — concepts + formulas + tips → flashcards
 * -------------------------------------------------------------------------- */

export function generateFlashcards(input: TopicInput): Flashcard[] {
  const cards: Flashcard[] = [];

  input.concepts.forEach((c) => {
    if (c.term && c.definition) {
      cards.push({
        front: `What is ${c.term}?`,
        back: c.definition,
        difficulty: 'medium',
      });
    }
  });

  input.formulas.forEach((f) => {
    if (f.name && f.formula) {
      cards.push({
        front: `Write the formula for ${f.name}`,
        back: f.description ? `${f.formula}\n\n${f.description}` : f.formula,
        difficulty: 'hard',
      });
    }
  });

  input.examTips.forEach((t) => {
    if (t.tip && t.tip.length > 15) {
      const firstSentence = t.tip.split(/[.!?]/)[0].trim();
      if (firstSentence.length > 10) {
        cards.push({
          front: firstSentence + '?',
          back: t.tip,
          difficulty: 'easy',
        });
      }
    }
  });

  return cards;
}

/* -------------------------------------------------------------------------- *
 * 3. Quiz question generator — build MCQs from concepts
 * -------------------------------------------------------------------------- */

export function generateQuizQuestions(input: TopicInput): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const concepts = input.concepts.filter((c) => c.term && c.definition);

  // For each concept, generate a "which of these is X" question using other concept terms as distractors
  concepts.forEach((c, idx) => {
    const distractors = concepts
      .filter((_, i) => i !== idx)
      .slice(0, 3)
      .map((d) => d.definition.slice(0, 100));

    if (distractors.length < 3) return;

    const correctDef = c.definition.slice(0, 100);
    const options = [correctDef, ...distractors].sort(() => Math.random() - 0.5);
    const correctIndex = options.indexOf(correctDef);

    questions.push({
      question: `Which of the following best describes "${c.term}"?`,
      options: options.map((o) => o + (o.length === 100 ? '…' : '')),
      correctIndex,
      explanation: `${c.term}: ${c.definition}`,
    });
  });

  // Question from overview (true/false style as MCQ)
  if (input.overview && input.overview.length > 50) {
    questions.push({
      question: `Which statement is most consistent with ${input.title}?`,
      options: [
        input.overview.slice(0, 140).trim() + (input.overview.length > 140 ? '…' : ''),
        'This topic is not relevant to workplace safety.',
        'This topic only applies to construction sites.',
        'This topic is entirely theoretical with no practical application.',
      ],
      correctIndex: 0,
      explanation: `Reference: ${input.title} — ${input.subtitle}`,
    });
  }

  return questions.slice(0, 10);
}

/* -------------------------------------------------------------------------- *
 * 4. Mnemonic suggestor
 * -------------------------------------------------------------------------- */

const MNEMONIC_LIBRARY: Record<string, { phrase: string; explanation: string }> = {
  'hierarchy of controls':      { phrase: 'Every Safety Expert Acts Protected', explanation: 'Elimination → Substitution → Engineering → Administrative → PPE' },
  'fire tetrahedron':           { phrase: 'F·H·O·C — Fire Has Oxygen Chain',    explanation: 'Fuel, Heat, Oxygen, Chain Reaction' },
  'ppe':                        { phrase: 'CBR Goggles Have Gloves',             explanation: 'Coverall, Boots, Respirator, Goggles, Hood, Gloves' },
  'loto':                       { phrase: 'Notice Shut Isolate Apply Dissipate Verify Work Restore', explanation: 'The 8-step LOTO sequence' },
  'fire extinguisher':          { phrase: 'P.A.S.S',                              explanation: 'Pull pin, Aim low, Squeeze handle, Sweep base' },
  'hazcom':                     { phrase: 'SDS ≥ 16',                             explanation: 'Safety Data Sheets must have at least 16 sections' },
  'heinrich':                   { phrase: '1·10·30·600',                          explanation: 'For every fatality: 10 serious, 30 minor, 600 near-misses' },
  'soil classification':        { phrase: 'A is Best, C is Worst',                 explanation: 'Type A (stable cohesive), Type B (moderate), Type C (unstable granular)' },
  'osha focus four':            { phrase: 'Fall Struck Caught Electrocuted',      explanation: 'Falls, Struck-by, Caught-in/between, Electrocution' },
  'investigation':              { phrase: 'SGAID',                                  explanation: 'Secure, Gather, Analyze, Implement, Document' },
  'ics':                        { phrase: 'COLPFL',                                 explanation: 'Command, Operations, Logistics, Planning, Finance, Liaison' },
  'pdca':                       { phrase: 'Plan-Do-Check-Act',                     explanation: 'Deming/Shewhart continual improvement cycle' },
  'gas laws':                   { phrase: 'PV = nRT',                               explanation: 'Ideal gas law — relates Pressure, Volume, moles, Temperature' },
};

export function generateMnemonics(input: TopicInput): Mnemonic[] {
  const hay = (input.title + ' ' + input.subtitle + ' ' + input.overview).toLowerCase();
  const out: Mnemonic[] = [];
  for (const [key, val] of Object.entries(MNEMONIC_LIBRARY)) {
    if (hay.includes(key)) {
      out.push({ title: key.replace(/\b\w/g, (c) => c.toUpperCase()), phrase: val.phrase, explanation: val.explanation });
    }
  }
  // If no match, try to build one from concept first letters
  if (out.length === 0 && input.concepts.length >= 3 && input.concepts.length <= 7) {
    const letters = input.concepts
      .map((c) => (c.term || '').trim().charAt(0).toUpperCase())
      .filter(Boolean)
      .join('·');
    if (letters.length >= 3) {
      out.push({
        title: `${input.title} — Acronym`,
        phrase: letters,
        explanation: `First letters of: ${input.concepts.map((c) => c.term).join(' / ')}`,
      });
    }
  }
  return out;
}

/* -------------------------------------------------------------------------- *
 * 5. One-shot: generate everything
 * -------------------------------------------------------------------------- */

export function generateSuite(input: TopicInput): GeneratedSuite {
  const v = detectVisual(input);
  return {
    visual: { type: v.type, confidence: v.confidence, reason: v.reason },
    flashcards: generateFlashcards(input),
    quizQuestions: generateQuizQuestions(input),
    mnemonics: generateMnemonics(input),
  };
}

/* -------------------------------------------------------------------------- *
 * Visualization metadata for preview display
 * -------------------------------------------------------------------------- */
export const VISUAL_META: Record<VisualType, { label: string; description: string; previewEmoji: string }> = {
  'hierarchy-of-controls': { label: 'Hierarchy of Controls',  description: '5-layer pyramid click-to-reveal',            previewEmoji: '📊' },
  'risk-matrix':           { label: 'Risk Matrix',            description: '5×5 interactive grid',                        previewEmoji: '🎯' },
  'process-flow':          { label: 'Process Flow',           description: 'Node-based sequence with play',               previewEmoji: '🔁' },
  'fire-tetrahedron':      { label: 'Fire Tetrahedron',       description: '3D rotating, click to remove element',        previewEmoji: '🔥' },
  'heinrich-triangle':     { label: 'Heinrich Triangle',      description: 'Animated injury ratio pyramid',               previewEmoji: '📐' },
  'dose-calculator':       { label: 'Noise Dose Calculator',  description: 'Live OSHA dose formula with arc gauge',       previewEmoji: '🔊' },
  'domino-theory':         { label: 'Domino Theory',          description: '5-domino causal chain',                       previewEmoji: '🎲' },
  'lifecycle-pdca':        { label: 'PDCA / Lifecycle Wheel', description: 'Pie segments with detail reveal',             previewEmoji: '🔄' },
  'timeline-emergency':    { label: 'Emergency Timeline',     description: 'Horizontal sequence with auto-play',          previewEmoji: '⏱' },
  'defense-layers':        { label: 'Defense in Depth',       description: 'Swiss cheese — strengthen to block hazard',   previewEmoji: '🛡' },
  'loto-sequence':         { label: 'LOTO Sequence',          description: '8-step walkthrough w/ animated lock',         previewEmoji: '🔒' },
  'hazard-particles':      { label: 'Exposure Containment',   description: '18 floating particles + 3 control toggles',   previewEmoji: '☣' },
  'ripple-causal':         { label: 'Incident Ripple',        description: '10-node propagating causal graph',            previewEmoji: '🌊' },
  'ppe-sequence':          { label: 'PPE Donning Order',      description: 'Drag-to-order puzzle',                        previewEmoji: '🦺' },
  'nfpa-diamond':          { label: 'NFPA 704 Diamond',       description: 'Interactive fire diamond w/ rating sliders',  previewEmoji: '💎' },
  'electrical-schematic':  { label: 'Electrical Circuit',     description: "Ohm's law simulator w/ GFCI & fault injection",previewEmoji: '⚡' },
  'ventilation-flow':      { label: 'Ventilation Flow',       description: 'ACGIH capture velocity w/ particles',         previewEmoji: '💨' },
  'fault-tree':            { label: 'Fault Tree',             description: 'AND/OR gates w/ live probability calc',       previewEmoji: '🌳' },
  'formula-calculator':    { label: 'Formula Calculator',     description: 'Live input-to-output calculator',             previewEmoji: '🧮' },
  'scenario-gallery':      { label: 'Scenario Gallery',       description: 'Exam-style questions with explanations',      previewEmoji: '📝' },
  'comparison-matrix':     { label: 'Comparison Matrix',      description: 'Side-by-side comparison grid',                previewEmoji: '📋' },
};
