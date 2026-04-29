// Extracts CSP.* data from the legacy js/data/*.js files into a single seed.json
// the Laravel artisan command can ingest. Run with:
//   node database/seed-extract.cjs
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DATA_DIR = path.resolve(__dirname, '../../js/data');
const OUT = path.resolve(__dirname, 'seed.json');

const sandbox = { window: {}, console };
vm.createContext(sandbox);

const filesToLoad = [
  'domains.js',
  'flashcards-all.js',
  'quizzes-all.js',
  'domain1-safety-principles.js',
  'domain2-program-management.js',
  'domain3-risk-management.js',
  'domain4-emergency-mgmt.js',
  'domain5-environmental.js',
  'domain6-occ-health.js',
  'domain7-training.js',
  'calculations.js',
  'critical-numbers.js',
  'regulations.js',
  'formula-guide.js',
  'scenario-questions-d1d2.js',
  'scenario-q-d3d4.js',
  'scenario-q-d5d6.js',
  'concept-questions-d1d3.js',
  'concept-questions-d4d7.js',
  'exam-questions.js',
  'exam-questions-d3d7.js',
  'exam-questions-extra.js',
  'sequence-questions.js',
];

for (const file of filesToLoad) {
  const full = path.join(DATA_DIR, file);
  if (!fs.existsSync(full)) {
    console.warn('skip (missing):', file);
    continue;
  }
  const code = fs.readFileSync(full, 'utf8');
  // The legacy files mix `window.CSP = ...` with bare `CSP.X = ...` references.
  // Inject a top-level var so the bare identifier resolves to the shared object.
  const wrapped = 'var CSP = window.CSP = window.CSP || {};\n' + code;
  try {
    vm.runInContext(wrapped, sandbox, { filename: file });
    console.log('loaded:', file);
  } catch (e) {
    console.error('FAILED to load', file, '-', e.message);
  }
}

const csp = sandbox.window.CSP || sandbox.CSP || {};

// Collect rich per-topic content from the DOMAIN_X_CONTENT objects
const domainContentKeys = [
  'DOMAIN_1_CONTENT', 'DOMAIN_2_CONTENT', 'DOMAIN_3_CONTENT',
  'DOMAIN_4_CONTENT', 'DOMAIN_5_CONTENT', 'DOMAIN_6_CONTENT',
  'DOMAIN_7_CONTENT',
];

// Map each top-level CSP.DOMAIN_X_CONTENT to its parent domain id ("domain1" .. "domain7")
const domainIdByContentKey = {
  DOMAIN_1_CONTENT: 'domain1',
  DOMAIN_2_CONTENT: 'domain2',
  DOMAIN_3_CONTENT: 'domain3',
  DOMAIN_4_CONTENT: 'domain4',
  DOMAIN_5_CONTENT: 'domain5',
  DOMAIN_6_CONTENT: 'domain6',
  DOMAIN_7_CONTENT: 'domain7',
};

// Flatten into a `topicContent` array keyed by (domain_id + topic_key)
const topicContent = [];
for (const key of domainContentKeys) {
  const block = csp[key];
  if (!block || typeof block !== 'object') continue;
  const domainId = domainIdByContentKey[key];
  for (const [topicKey, content] of Object.entries(block)) {
    topicContent.push({
      domain_id: domainId,
      topic_key: topicKey,
      overview:    content.overview ?? null,        // rich HTML
      concepts:    content.concepts ?? [],          // [{title, description}]
      diagrams:    content.diagrams ?? [],          // structured visuals
      mnemonics:   content.mnemonics ?? [],         // [{acronym, title, description}]
      examTips:    content.examTips ?? [],          // [string]
      formulas:    content.formulas ?? [],          // [{name, formula, ...}] or [string]
      regulations: content.regulations ?? [],       // [string]
      yatesChapters: content.yatesChapters ?? [],   // [string]
    });
  }
}

const seed = {
  domains: csp.DOMAINS ?? [],
  flashcards: csp.FLASHCARDS ?? [],
  quizzes: csp.QUIZZES ?? [],
  topicContent,
  calculations:    csp.CALCULATIONS     ?? [],
  criticalNumbers: csp.CRITICAL_NUMBERS  ?? [],
  regulations:     csp.REGULATIONS       ?? [],
  formulaGuide:    csp.FORMULA_GUIDE     ?? null,

  // Extra question banks beyond CSP.QUIZZES — each entry tagged with kind/difficulty/topic_key
  extraQuestions: [
    ...(csp.SCENARIO_QUESTIONS_D1D2 ?? []).map((q) => ({ ...q, kind: 'scenario' })),
    ...(csp.SCENARIO_Q_D3D4         ?? []).map((q) => ({ ...q, kind: 'scenario' })),
    ...(csp.SCENARIO_Q_D5D6         ?? []).map((q) => ({ ...q, kind: 'scenario' })),
    ...(csp.CONCEPT_QUESTIONS_D1D3  ?? []).map((q) => ({ ...q, kind: 'concept' })),
    ...(csp.CONCEPT_QUESTIONS_D4D7  ?? []).map((q) => ({ ...q, kind: 'concept' })),
    ...(csp.EXAM_QUESTIONS          ?? []).map((q) => ({ ...q, kind: 'exam' })),
    ...(csp.EXAM_QUESTIONS_D3D7     ?? []).map((q) => ({ ...q, kind: 'exam' })),
    ...(csp.EXAM_QUESTIONS_EXTRA    ?? []).map((q) => ({ ...q, kind: 'exam' })),
    ...(csp.SEQUENCE_QUESTIONS      ?? []).map((q) => ({ ...q, kind: 'sequence' })),
  ],
};

console.log('calculations:   ', seed.calculations.length);
console.log('criticalNumbers:', seed.criticalNumbers.length);
console.log('regulations:    ', seed.regulations.length);
console.log('extraQuestions: ', seed.extraQuestions.length);

console.log('domains:        ', seed.domains.length);
console.log('topics:         ', seed.domains.reduce((s, d) => s + (d.topics?.length || 0), 0));
console.log('topicContent:   ', topicContent.length);
console.log('  concepts:     ', topicContent.reduce((s, t) => s + t.concepts.length, 0));
console.log('  mnemonics:    ', topicContent.reduce((s, t) => s + t.mnemonics.length, 0));
console.log('  examTips:     ', topicContent.reduce((s, t) => s + t.examTips.length, 0));
console.log('  formulas:     ', topicContent.reduce((s, t) => s + t.formulas.length, 0));
console.log('  regulations:  ', topicContent.reduce((s, t) => s + t.regulations.length, 0));
console.log('  diagrams:     ', topicContent.reduce((s, t) => s + t.diagrams.length, 0));
console.log('flashcards:     ', seed.flashcards.length);
console.log('quizzes:        ', seed.quizzes.length);

fs.writeFileSync(OUT, JSON.stringify(seed, null, 2));
console.log('wrote ->', OUT);
