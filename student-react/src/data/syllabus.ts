/**
 * CSP Examination Syllabus — complete coverage map
 *
 * Source: Official BCSP CSP reference book table of contents.
 * Each entry tracks:
 *   id            — stable key
 *   title         — syllabus title
 *   pages         — depth indicator (page span in reference book)
 *   visual        — recommended interactive visualization type
 *   presentKey    — key already present in legacy app (domains.js) if any;
 *                   null if this topic is NEW and needs to be added
 */

export type VisualType =
  | 'hierarchy-of-controls'
  | 'blooms-taxonomy'
  | 'waste-hierarchy'
  | 'risk-matrix'
  | 'process-flow'
  | 'fire-tetrahedron'
  | 'heinrich-triangle'
  | 'dose-calculator'
  | 'domino-theory'
  | 'lifecycle-pdca'
  | 'lifecycle-vpp'
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

export type SyllabusTopic = {
  id: string;
  title: string;
  pages: number;
  visual: VisualType;
  presentKey?: string | null;
  summary: string;
};

export type SyllabusDomain = {
  number: number;
  id: string;
  title: string;
  totalPages: number;
  weight: number;
  topics: SyllabusTopic[];
};

export const SYLLABUS: SyllabusDomain[] = [
  {
    number: 1,
    id: 'domain1',
    title: 'Advanced Application of Safety Principles',
    totalPages: 145,
    weight: 25,
    topics: [
      { id: 'process-safety',     title: 'Process Safety Management',                                                      pages: 5,  visual: 'process-flow',      presentKey: 'process-safety',     summary: 'PSM 14 elements, PHA, MOC, Flixboro/Bhopal case studies.' },
      { id: 'electrical',         title: 'Electrical Systems',                                                              pages: 8,  visual: 'electrical-schematic', presentKey: null,               summary: 'Circuit fundamentals, OSHA 1910 Subpart S, GFCI, arc flash, lockout energy control.' },
      { id: 'fall-protection',    title: 'Hazards Associated with Working at Heights and Fall Protection Systems',        pages: 5,  visual: 'defense-layers',    presentKey: null,                 summary: 'ANSI Z359, 4 foot general, 6 foot construction, PFAS, anchorage, rescue planning.' },
      { id: 'confined-space',     title: 'Confined Space Requirements, Hazards, and Controls',                             pages: 3,  visual: 'loto-sequence',     presentKey: null,                 summary: 'Permit-required vs. non-permit, atmospheric testing, entry supervisor/attendant/entrant roles, rescue.' },
      { id: 'excavation',         title: 'Excavation Hazards and Controls',                                                 pages: 3,  visual: 'hierarchy-of-controls', presentKey: null,             summary: 'Soil Types A/B/C, sloping/benching/shoring/shielding, competent person, 29 CFR 1926 Subpart P.' },
      { id: 'loto',               title: 'Hazardous Energy and Control Methods',                                            pages: 4,  visual: 'loto-sequence',     presentKey: null,                 summary: 'LOTO 29 CFR 1910.147, 8-step procedure, stored energy, group lockout.' },
      { id: 'struck-caught',      title: 'Struck By / Caught Between Hazards and Controls',                                 pages: 3,  visual: 'ripple-causal',     presentKey: null,                 summary: 'OSHA Focus Four, flying/falling/swinging/rolling objects, pinch points.' },
      { id: 'pinchpoint',         title: 'Rotating / Moving Equipment Pinchpoint Hazards and Controls',                     pages: 4,  visual: 'hierarchy-of-controls', presentKey: null,             summary: 'Machine guarding, point of operation, nip points, safeguard methods.' },
      { id: 'walking-working',    title: 'Hazards Associated with Walking / Working Surfaces',                              pages: 3,  visual: 'process-flow',      presentKey: null,                 summary: 'Slip/trip/fall prevention, housekeeping, 29 CFR 1910 Subpart D.' },
      { id: 'hand-power-tools',   title: 'Hazards Associated with Hand and Power Tools',                                    pages: 5,  visual: 'comparison-matrix', presentKey: 'tools-equipment',    summary: 'Hand tools, power tools, PPE selection, GFCI, double-insulation.' },
      { id: 'saws-woodworking',   title: 'Hazards Associated with Some of the More Common Saws Used in Woodworking',       pages: 2,  visual: 'comparison-matrix', presentKey: null,                 summary: 'Table saw, radial arm, miter, band, jointer, planer, kickback, guarding.' },
      { id: 'heavy-equipment',    title: 'Hazards Associated with Heavy Equipment',                                         pages: 2,  visual: 'scenario-gallery',  presentKey: null,                 summary: 'Blind spots, tip-over, hauling, roll-over protection (ROPS/FOPS).' },
      { id: 'cranes',             title: 'Hazards Associated with Cranes',                                                  pages: 3,  visual: 'process-flow',      presentKey: null,                 summary: 'OSHA 29 CFR 1926 Subpart CC, operator qualification, signal person, rigging, load charts.' },
      { id: 'hot-work',           title: 'Hot Work Hazards and Associated Control Methods',                                 pages: 2,  visual: 'fire-tetrahedron',  presentKey: null,                 summary: 'Welding, cutting, brazing, fire watch, hot work permits.' },
      { id: 'rigging-signaling',  title: 'Hoisting, Rigging and Signaling',                                                 pages: 3,  visual: 'comparison-matrix', presentKey: null,                 summary: 'Sling types, load angles, hand signals, tag lines, working load limit.' },
      { id: 'fleet-safety',       title: 'Fleet Safety and Hierarchy of Hazard Control',                                    pages: 2,  visual: 'hierarchy-of-controls', presentKey: 'fleet-safety',    summary: 'Driver safety, telematics, maintenance, defensive driving, DUI.' },
      { id: 'example-q-d1',       title: 'Example Questions',                                                                pages: 50, visual: 'scenario-gallery',  presentKey: null,                 summary: 'Domain I exam-style practice questions covering all 16 sub-topics.' },
      { id: 'example-a-d1',       title: 'Example Answers',                                                                  pages: 38, visual: 'scenario-gallery',  presentKey: null,                 summary: 'Detailed answer explanations with references.' },
    ],
  },
  {
    number: 2,
    id: 'domain2',
    title: 'Program Management',
    totalPages: 178,
    weight: 25,
    topics: [
      { id: 'indicators',             title: 'Gap Analysis, Leading and Lagging Indicators',                  pages: 1, visual: 'comparison-matrix',  presentKey: 'indicators',     summary: 'KPIs, TRIR/DART, leading vs lagging, benchmarking.' },
      { id: 'incident-investigation', title: 'Incident Investigative Processes and Documentation',            pages: 3, visual: 'process-flow',       presentKey: 'incident-investigation', summary: '5-Why, Fishbone, FTA, TapRoot, event causation models.' },
      { id: 'system-safety',          title: 'System Safety Techniques',                                      pages: 3, visual: 'fault-tree',         presentKey: 'system-safety',  summary: 'FTA, FMEA, HAZOP, What-If, Safety Case approach.' },
      { id: 'reliability',            title: 'Reliability Engineering',                                        pages: 2, visual: 'formula-calculator', presentKey: null,             summary: 'MTBF, MTTR, reliability series/parallel, bathtub curve, redundancy.' },
      { id: 'chemical-hazards-d2',    title: 'Chemical Hazards and Controls',                                 pages: 8, visual: 'nfpa-diamond',       presentKey: null,             summary: 'GHS, SDS, PELs/TLVs, substitution, engineering controls, PPE.' },
      { id: 'osha-act',               title: 'Selected Topics from Occupational Safety and Health Act',        pages: 2, visual: 'timeline-emergency', presentKey: null,             summary: 'OSH Act 1970, Section 5, General Duty Clause, citations, inspections.' },
      { id: 'finance-economy',        title: 'Management Aspects and Engineering Economy',                     pages: 5, visual: 'formula-calculator', presentKey: 'finance',        summary: 'NPV, IRR, payback, cost-benefit, ROI, depreciation.' },
      { id: 'bcsp-ethics',            title: 'BCSP Code of Ethics',                                            pages: 1, visual: 'hierarchy-of-controls', presentKey: null,           summary: 'BCSP code, professional conduct, confidentiality, competence.' },
      { id: 'coaching',               title: 'Coaching Techniques and Influencing Others',                     pages: 2, visual: 'process-flow',       presentKey: null,             summary: 'GROW model, active listening, feedback, influence styles, motivation theories.' },
      { id: 'stats-probability',      title: 'Set Theory, Probability, and Statistics',                        pages: 11, visual: 'formula-calculator',presentKey: 'data-analysis',  summary: 'Mean/median/mode, standard deviation, normal distribution, Bayes, Pareto.' },
      { id: 'inferential-stats',      title: 'Inferential Statistics',                                         pages: 14, visual: 'formula-calculator',presentKey: null,             summary: 'Hypothesis testing, t-test, ANOVA, confidence intervals, regression.' },
      { id: 'ppe-selected',           title: 'Personal Protective Equipment and Other Selected Safety Topics',  pages: 3, visual: 'ppe-sequence',      presentKey: null,             summary: 'PPE hazard assessment, 29 CFR 1910 Subpart I, selection, donning/doffing.' },
      { id: 'audits-raci-iso',        title: 'Safety Audits, RACI Chart, Hierarchy of Hazard Control, and ISOs', pages: 3, visual: 'hierarchy-of-controls', presentKey: 'audit-systems', summary: 'ISO 45001, 14001, 19011, ANSI Z10, RACI responsibility charts.' },
      { id: 'example-q-d2',           title: 'Example Questions',                                               pages: 119, visual: 'scenario-gallery', presentKey: null,             summary: 'Domain II exam-style practice questions.' },
    ],
  },
  {
    number: 3,
    id: 'domain3',
    title: 'Risk Management',
    totalPages: 20,
    weight: 15,
    topics: [
      { id: 'managing-risks',   title: 'Managing Risks',  pages: 2,  visual: 'risk-matrix',       presentKey: 'risk-evaluation', summary: 'Risk matrix, ALARP, ALARA, as-low-as-reasonably-practicable, tolerability, BowTie analysis.' },
      { id: 'example-q-d3',     title: 'Example Questions', pages: 9, visual: 'scenario-gallery', presentKey: null,              summary: 'Risk assessment scenarios, risk score calculations.' },
      { id: 'example-a-d3',     title: 'Example Answers',   pages: 8, visual: 'scenario-gallery', presentKey: null,              summary: 'Detailed explanations with risk quantification methods.' },
    ],
  },
  {
    number: 4,
    id: 'domain4',
    title: 'Emergency Management',
    totalPages: 62,
    weight: 9,
    topics: [
      { id: 'basic-principles',       title: 'Review of Basic Principles and Terminology',             pages: 2, visual: 'fire-tetrahedron',   presentKey: null, summary: 'Fire tetrahedron, flash/fire/autoignition points, classes A-K, combustion chemistry.' },
      { id: 'flammable-liquids',      title: 'Flammable and Combustible Liquids',                      pages: 3, visual: 'comparison-matrix',  presentKey: null, summary: 'NFPA 30 categories, flash points, storage, OSHA 1910.106.' },
      { id: 'flammable-gases',        title: 'Flammable Gases',                                         pages: 2, visual: 'comparison-matrix',  presentKey: null, summary: 'LEL/UEL, flammability range, cryogenic, compressed gas cylinders.' },
      { id: 'nfpa-704',               title: 'NFPA 704 System',                                         pages: 1, visual: 'nfpa-diamond',       presentKey: null, summary: 'Fire diamond: blue/red/yellow/white, ratings 0-4, special symbols.' },
      { id: 'fire-extinguishers',     title: 'Fire Extinguishers',                                      pages: 3, visual: 'comparison-matrix',  presentKey: null, summary: 'Classes A-K, ABC/CO2/dry chem/Class D/wet chem, PASS technique, portable vs fixed.' },
      { id: 'electrical-haz-loc',     title: 'Electrical Equipment for Hazardous Locations',            pages: 1, visual: 'comparison-matrix',  presentKey: null, summary: 'NEC Class I/II/III, Division 1/2, Zones 0/1/2, intrinsically safe.' },
      { id: 'sprinkler-detection',    title: 'Sprinkler Systems and Fire Detection Instruments',        pages: 3, visual: 'process-flow',       presentKey: 'fire-systems', summary: 'Wet/dry pipe, pre-action, deluge, heat/smoke/flame detectors, NFPA 13/72.' },
      { id: 'fire-safety-building',   title: 'Useful Concepts in Building Fire Safety',                 pages: 1, visual: 'defense-layers',     presentKey: null, summary: 'Compartmentation, means of egress, occupant load, smoke control, passive/active.' },
      { id: 'workplace-emergency',    title: 'Planning and Responding to Workplace Emergencies',        pages: 3, visual: 'timeline-emergency', presentKey: 'erp', summary: 'ERP development, ICS, NIMS, evacuation, shelter-in-place, drills.' },
      { id: 'example-q-d4',           title: 'Example Questions',                                       pages: 21, visual: 'scenario-gallery', presentKey: null, summary: 'Emergency scenarios — fire, chemical spill, severe weather.' },
      { id: 'example-a-d4',           title: 'Example Answers',                                         pages: 21, visual: 'scenario-gallery', presentKey: null, summary: 'Detailed answer explanations.' },
    ],
  },
  {
    number: 5,
    id: 'domain5',
    title: 'Environmental Management',
    totalPages: 20,
    weight: 6,
    topics: [
      { id: 'air-pollution',       title: 'Air Pollution',                                            pages: 2, visual: 'hazard-particles',   presentKey: null, summary: 'Clean Air Act, NAAQS, criteria pollutants, ventilation for outdoor air quality.' },
      { id: 'groundwater-migration', title: 'Migration of Hazardous Materials through Underground Water', pages: 2, visual: 'ripple-causal',  presentKey: null, summary: 'Aquifers, contaminant plumes, Darcy\'s law, hydraulic conductivity, RCRA.' },
      { id: 'soil-contamination',  title: 'Contamination of Soil by Hazardous Materials',              pages: 1, visual: 'defense-layers',     presentKey: null, summary: 'CERCLA, Superfund, remediation methods, bioremediation, excavation.' },
      { id: 'example-q-d5',        title: 'Example Questions',                                         pages: 9, visual: 'scenario-gallery',   presentKey: null, summary: 'Environmental scenarios and calculations.' },
      { id: 'example-a-d5',        title: 'Example Answers',                                           pages: 5, visual: 'scenario-gallery',   presentKey: null, summary: 'Detailed explanations.' },
    ],
  },
  {
    number: 6,
    id: 'domain6',
    title: 'Occupational Health and Applied Science',
    totalPages: 167,
    weight: 10,
    topics: [
      { id: 'oh-intro',            title: 'Introduction',                                             pages: 1, visual: 'hierarchy-of-controls', presentKey: null, summary: 'Industrial hygiene fundamentals, anticipate/recognize/evaluate/control.' },
      { id: 'industrial-ventilation', title: 'Industrial Ventilation',                               pages: 5, visual: 'ventilation-flow',   presentKey: null, summary: 'Local exhaust, general dilution, ACGIH Industrial Ventilation Manual, hood design, capture velocity.' },
      { id: 'noise-control',       title: 'Industrial Noise Control',                                 pages: 10, visual: 'dose-calculator',   presentKey: null, summary: 'OSHA 90 dBA PEL, 5 dB exchange, hearing conservation, engineering controls.' },
      { id: 'radiation',           title: 'Radiation',                                                pages: 7, visual: 'defense-layers',     presentKey: null, summary: 'Ionizing vs non-ionizing, ALARA, time/distance/shielding, dose limits, rad monitoring.' },
      { id: 'toxicology',          title: 'Chemical Hazard Protection and Toxicology',                pages: 4, visual: 'nfpa-diamond',       presentKey: 'toxicology', summary: 'LD50/LC50, dose-response, TLV/PEL/REL, routes of exposure, carcinogens/mutagens/teratogens.' },
      { id: 'ergonomics',          title: 'Ergonomics and Human Factors Engineering',                 pages: 13, visual: 'comparison-matrix',presentKey: 'ergonomics', summary: 'NIOSH lifting equation, anthropometrics, MSD prevention, workstation design.' },
      { id: 'engineering-mechanics', title: 'Engineering Mechanics',                                  pages: 13, visual: 'formula-calculator',presentKey: null, summary: 'Statics, dynamics, forces, moments, free body diagrams, stress/strain.' },
      { id: 'structural-systems',  title: 'Structural Systems',                                       pages: 5, visual: 'formula-calculator', presentKey: null, summary: 'Beams, columns, trusses, load paths, failure modes, safety factors.' },
      { id: 'gas-laws',            title: 'Gas Laws',                                                 pages: 5, visual: 'formula-calculator', presentKey: null, summary: 'Ideal gas law PV=nRT, Boyle, Charles, Dalton, partial pressures, STP.' },
      { id: 'life-sciences',       title: 'Life Sciences',                                            pages: 5, visual: 'comparison-matrix', presentKey: null, summary: 'Anatomy, physiology, microbiology basics, bloodborne pathogens.' },
      { id: 'facility-design',     title: 'General Topics in Facility Design',                        pages: 9, visual: 'process-flow',       presentKey: null, summary: 'Building codes, life safety, occupancy, egress design, ADA accessibility.' },
      { id: 'example-q-d6',        title: 'Example Questions',                                         pages: 47, visual: 'scenario-gallery', presentKey: null, summary: 'Domain VI exam-style practice questions.' },
      { id: 'example-a-d6',        title: 'Example Answers',                                           pages: 47, visual: 'scenario-gallery', presentKey: null, summary: 'Detailed answer explanations.' },
    ],
  },
];

export const VISUAL_META: Record<VisualType, { label: string; icon: string; desc: string }> = {
  'hierarchy-of-controls': { label: 'Hierarchy of Controls',         icon: 'Layers',    desc: '5-layer pyramid click-to-reveal' },
  'blooms-taxonomy':       { label: "Bloom's Taxonomy",              icon: 'Layers',    desc: '6-level pyramid' },
  'waste-hierarchy':       { label: 'Waste Hierarchy',               icon: 'Layers',    desc: '6-level pyramid' },
  'risk-matrix':           { label: 'Risk Matrix',                   icon: 'Grid3x3',   desc: '5×5 interactive grid' },
  'process-flow':          { label: 'Process Flow',                  icon: 'Workflow',  desc: 'Node-based sequence with play' },
  'fire-tetrahedron':      { label: 'Fire Tetrahedron',              icon: 'Flame',     desc: '3D rotating, click to remove' },
  'heinrich-triangle':     { label: 'Heinrich Triangle',             icon: 'Triangle',  desc: 'Animated injury ratio' },
  'dose-calculator':       { label: 'Dose Calculator',               icon: 'Volume2',   desc: 'Live formula arc gauge' },
  'domino-theory':         { label: 'Domino Theory',                 icon: 'Dices',     desc: '5-domino causal chain' },
  'lifecycle-pdca':        { label: 'PDCA Cycle',                    icon: 'RotateCw',  desc: 'Pie segments with detail' },
  'lifecycle-vpp':         { label: 'OSHA VPP',                      icon: 'RotateCw',  desc: 'Pie segments' },
  'timeline-emergency':    { label: 'Emergency Timeline',            icon: 'Clock',     desc: 'Horizontal sequence with play' },
  'defense-layers':        { label: 'Defense in Depth',              icon: 'Shield',    desc: 'Swiss cheese, launch hazard' },
  'loto-sequence':         { label: 'LOTO Sequence',                 icon: 'Lock',      desc: '8-step walkthrough w/ lock shake' },
  'hazard-particles':      { label: 'Exposure Containment',          icon: 'Biohazard', desc: '18 particles, 3 control toggles' },
  'ripple-causal':         { label: 'Incident Ripple',               icon: 'Waves',     desc: '10-node causal graph' },
  'ppe-sequence':          { label: 'PPE Donning Order',             icon: 'HardHat',   desc: 'Drag-to-order puzzle' },
  'nfpa-diamond':          { label: 'NFPA 704 Diamond',              icon: 'Diamond',   desc: 'Fire diamond with rating sliders' },
  'electrical-schematic':  { label: 'Electrical Schematic',          icon: 'Zap',       desc: 'Circuit with current animation' },
  'ventilation-flow':      { label: 'Ventilation Flow',              icon: 'Wind',      desc: 'Duct + particles + capture velocity' },
  'fault-tree':            { label: 'Fault Tree Analyzer',           icon: 'GitBranch', desc: 'AND/OR gates, probability calc' },
  'formula-calculator':    { label: 'Formula Calculator',            icon: 'Calculator',desc: 'Live input-to-output' },
  'scenario-gallery':      { label: 'Scenario Gallery',              icon: 'Grid3x3',   desc: 'Exam-style questions with explanations' },
  'comparison-matrix':     { label: 'Comparison Matrix',             icon: 'Table',     desc: 'Side-by-side comparison' },
};

export function getCoverageStats() {
  const total = SYLLABUS.flatMap((d) => d.topics).length;
  const present = SYLLABUS.flatMap((d) => d.topics).filter((t) => t.presentKey).length;
  const visualCoverage = SYLLABUS.flatMap((d) => d.topics).reduce<Record<string, number>>((acc, t) => {
    acc[t.visual] = (acc[t.visual] || 0) + 1;
    return acc;
  }, {});
  return { total, present, added: total - present, visualCoverage };
}
