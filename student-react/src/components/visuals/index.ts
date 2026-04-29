export { default as HierarchyVisualizer } from './HierarchyVisualizer';
export { default as RiskMatrix } from './RiskMatrix';
export { default as ProcessFlow } from './ProcessFlow';
export { default as FireTetrahedron } from './FireTetrahedron';
export { default as HeinrichTriangle } from './HeinrichTriangle';
export { default as DoseCalculator } from './DoseCalculator';
export { default as DominoTheory } from './DominoTheory';
export { default as LifecycleWheel } from './LifecycleWheel';
export { default as TimelineExplainer } from './TimelineExplainer';
export { default as DefenseLayers } from './DefenseLayers';
export { default as LotoSequence } from './LotoSequence';
export { default as HazardParticles } from './HazardParticles';
export { default as RippleCausal } from './RippleCausal';
export { default as PpeSequence } from './PpeSequence';
export { default as NfpaDiamond } from './NfpaDiamond';
export { default as ElectricalSchematic } from './ElectricalSchematic';
export { default as VentilationFlow } from './VentilationFlow';
export { default as FaultTree } from './FaultTree';

export type VisualKey =
  | 'hierarchy-of-controls'
  | 'blooms-taxonomy'
  | 'waste-hierarchy'
  | 'risk-matrix'
  | 'incident-investigation'
  | 'permit-to-work'
  | 'risk-assessment'
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
  | 'ppe-sequence';
