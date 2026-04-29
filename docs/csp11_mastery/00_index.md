# Mastery Library — CSP11 Advanced Techniques & Methods

**65 topics · 9 categories · 18-element Gold Standard each**

This is the canonical index of the Mastery Library. Every topic ships only after passing the 12-point defensibility checklist (`php artisan mastery:check-defensibility --id=<mastery_id>`).

| Status | Meaning |
|---|---|
| `mastery_gold` | Passed all 12 points; live to learners |
| `needs_sme` | Failed defensibility check OR SME flagged |
| `draft_for_sme` | AI-generated, awaiting first SME pass |
| `archived` | Retired |

## M1 — System Safety Analysis (priority P1, target 11 topics)

FTA, ETA, FMEA, FMECA, HAZOP, What-If, Bow-Tie, LOPA, Safety Case, MORT, Risk Summation.

| ID | Topic | Blueprint | Calc? | Status |
|---|---|---|---|---|
| M1.01 | [Fault Tree Analysis (FTA)](topics/M1.01_fault-tree-analysis-fta.md) | D2.T6 | — | `draft_for_sme` |
| M1.02 | [Event Tree Analysis (ETA)](topics/M1.02_event-tree-analysis-eta.md) | D2.T6 | — | `draft_for_sme` |
| M1.03 | [FMEA](topics/M1.03_fmea.md) | D2.T6 | — | `draft_for_sme` |
| M1.04 | [FMECA](topics/M1.04_fmeca.md) | D2.T6 | ✓ | `draft_for_sme` |
| M1.05 | [HAZOP](topics/M1.05_hazop.md) | D1.T2 / D2.T6 | — | `draft_for_sme` |
| M1.06 | [What-If / Checklist Analysis](topics/M1.06_what-if-checklist-analysis.md) | D1.T2 / D2.T6 | — | `draft_for_sme` |
| M1.07 | [Bow-Tie Analysis](topics/M1.07_bow-tie-analysis.md) | D2.T6 / D3.T2 | — | `draft_for_sme` |
| M1.08 | [Layer of Protection Analysis (LOPA)](topics/M1.08_layer-of-protection-analysis-lopa.md) | D2.T6 / D1.T2 | ✓ | `draft_for_sme` |
| M1.09 | [Safety Case Approach](topics/M1.09_safety-case-approach.md) | D2.T6 | — | `draft_for_sme` |
| M1.10 | [MORT](topics/M1.10_mort.md) | D2.T4 / D2.T6 | — | `draft_for_sme` |
| M1.11 | [Risk Summation](topics/M1.11_risk-summation.md) | D2.T6 / D3.T1 | ✓ | `draft_for_sme` |

## M2 — Ergonomics & Human Factors (priority P2, target 8 topics)

NIOSH RWL/LI, RSI, RULA, REBA, Snook, anthropometric design, hand-arm and whole-body vibration A(8).

| ID | Topic | Blueprint | Calc? | Status |
|---|---|---|---|---|
| M2.12 | [NIOSH Lifting Equation (RWL & LI)](topics/M2.12_niosh-lifting-equation-rwl-li.md) | D6.T4 | ✓ | `draft_for_sme` |
| M2.13 | [Revised Strain Index (RSI)](topics/M2.13_revised-strain-index-rsi.md) | D6.T4 | ✓ | `draft_for_sme` |
| M2.14 | [RULA](topics/M2.14_rula.md) | D6.T4 | ✓ | `draft_for_sme` |
| M2.15 | [REBA](topics/M2.15_reba.md) | D6.T4 | ✓ | `draft_for_sme` |
| M2.16 | [Snook Tables](topics/M2.16_snook-tables.md) | D6.T4 | ✓ | `draft_for_sme` |
| M2.17 | [Anthropometric Design](topics/M2.17_anthropometric-design.md) | D6.T4 | ✓ | `draft_for_sme` |
| M2.18 | [Hand-Arm Vibration A(8)](topics/M2.18_hand-arm-vibration-a8.md) | D6.T1 / D6.T4 | ✓ | `draft_for_sme` |
| M2.19 | [Whole-Body Vibration A(8)](topics/M2.19_whole-body-vibration-a8.md) | D6.T1 / D6.T4 | ✓ | `draft_for_sme` |

## M3 — Industrial Hygiene & Exposure (priority P2, target 10 topics)

TWA, additive mixtures, Brief & Scala, noise dose, ventilation, heat stress, dose-response, radiation, dust.

| ID | Topic | Blueprint | Calc? | Status |
|---|---|---|---|---|
| M3.20 | [TWA Calculation](topics/M3.20_twa-calculation.md) | D6.T1 | ✓ | `draft_for_sme` |
| M3.21 | [Mixture Exposure (Additive)](topics/M3.21_mixture-exposure-additive.md) | D6.T1 | ✓ | `draft_for_sme` |
| M3.22 | [Brief & Scala Adjustment](topics/M3.22_brief-scala-adjustment.md) | D6.T1 | ✓ | `draft_for_sme` |
| M3.23 | [Noise Dose (OSHA & ACGIH)](topics/M3.23_noise-dose-osha-acgih.md) | D6.T1 | ✓ | `draft_for_sme` |
| M3.24 | [Ventilation: Capture & Local](topics/M3.24_ventilation-capture-local.md) | D6.T1 | ✓ | `draft_for_sme` |
| M3.25 | [Dilution Ventilation](topics/M3.25_dilution-ventilation.md) | D6.T1 | ✓ | `draft_for_sme` |
| M3.26 | [Heat Stress (WBGT)](topics/M3.26_heat-stress-wbgt.md) | D6.T1 | ✓ | `draft_for_sme` |
| M3.27 | [Toxicology Dose-Response](topics/M3.27_toxicology-dose-response.md) | D6.T3 | — | `draft_for_sme` |
| M3.28 | [Radiation Protection](topics/M3.28_radiation-protection.md) | D6.T1 | ✓ | `draft_for_sme` |
| M3.29 | [Combustible Dust](topics/M3.29_combustible-dust.md) | D6.T1 / D1.T2 | — | `draft_for_sme` |

## M4 — Statistical & Data Analysis (priority P1, target 7 topics)

Descriptive stats, CIs, probability, Pareto, sampling, control charts, epidemiology.

| ID | Topic | Blueprint | Calc? | Status |
|---|---|---|---|---|
| M4.30 | [Descriptive Statistics](topics/M4.30_descriptive-statistics.md) | D2.T14 | ✓ | `draft_for_sme` |
| M4.31 | [Confidence Intervals](topics/M4.31_confidence-intervals.md) | D2.T14 | ✓ | `draft_for_sme` |
| M4.32 | [Probability Fundamentals](topics/M4.32_probability-fundamentals.md) | D2.T14 | ✓ | `draft_for_sme` |
| M4.33 | [Pareto Analysis](topics/M4.33_pareto-analysis.md) | D2.T14 | ✓ | `draft_for_sme` |
| M4.34 | [Sampling Strategy](topics/M4.34_sampling-strategy.md) | D2.T14 / D6.T1 | ✓ | `draft_for_sme` |
| M4.35 | [Control Charts (UCL/LCL)](topics/M4.35_control-charts-ucllcl.md) | D2.T14 | ✓ | `draft_for_sme` |
| M4.36 | [Epidemiology Statistics](topics/M4.36_epidemiology-statistics.md) | D6.T2 | ✓ | `draft_for_sme` |

## M5 — Incident Metrics & Indicators (priority P1, target 6 topics)

TRIR, DART, LTIFR, severity rate, leading indicators, EHS culture measurement.

| ID | Topic | Blueprint | Calc? | Status |
|---|---|---|---|---|
| M5.37 | [TRIR](topics/M5.37_trir.md) | D2.T7 | ✓ | `draft_for_sme` |
| M5.38 | [DART](topics/M5.38_dart.md) | D2.T7 | ✓ | `draft_for_sme` |
| M5.39 | [LTIFR (International)](topics/M5.39_ltifr-international.md) | D2.T7 | ✓ | `draft_for_sme` |
| M5.40 | [Severity Rate](topics/M5.40_severity-rate.md) | D2.T7 | ✓ | `draft_for_sme` |
| M5.41 | [Leading Indicator Design](topics/M5.41_leading-indicator-design.md) | D2.T7 | — | `draft_for_sme` |
| M5.42 | [EHS Culture Measurement](topics/M5.42_ehs-culture-measurement.md) | D2.T3 | — | `draft_for_sme` |

## M6 — Incident Investigation Methods (priority P3, target 7 topics)

5-Why, Fishbone, TapRooT/SnapCharT, TRIPOD-Beta, HFACS, causal factor charting, barrier analysis.

| ID | Topic | Blueprint | Calc? | Status |
|---|---|---|---|---|
| M6.43 | [5-Why Analysis](topics/M6.43_5-why-analysis.md) | D2.T4 | — | `draft_for_sme` |
| M6.44 | [Fishbone / Ishikawa](topics/M6.44_fishbone-ishikawa.md) | D2.T4 | — | `draft_for_sme` |
| M6.45 | [TapRooT / SnapCharT](topics/M6.45_taproot-snapchart.md) | D2.T4 | — | `draft_for_sme` |
| M6.46 | [TRIPOD-Beta](topics/M6.46_tripod-beta.md) | D2.T4 | — | `draft_for_sme` |
| M6.47 | [HFACS](topics/M6.47_hfacs.md) | D2.T4 | — | `draft_for_sme` |
| M6.48 | [Causal Factor Charting](topics/M6.48_causal-factor-charting.md) | D2.T4 | — | `draft_for_sme` |
| M6.49 | [Barrier Analysis (Investigation)](topics/M6.49_barrier-analysis-investigation.md) | D2.T4 | — | `draft_for_sme` |

## M7 — Financial, Project & Management (priority P3, target 6 topics)

ROI/Payback/NPV, cost-benefit, procurement role, RACI, Gantt/CPM, leadership theories.

| ID | Topic | Blueprint | Calc? | Status |
|---|---|---|---|---|
| M7.50 | [ROI / Payback / NPV](topics/M7.50_roi-payback-npv.md) | D2.T11 | ✓ | `draft_for_sme` |
| M7.51 | [Cost-Benefit Analysis](topics/M7.51_cost-benefit-analysis.md) | D2.T11 | ✓ | `draft_for_sme` |
| M7.52 | [Procurement Role in EHS](topics/M7.52_procurement-role-in-ehs.md) | D2.T11 | — | `draft_for_sme` |
| M7.53 | [RACI / RASCI Matrix](topics/M7.53_raci-rasci-matrix.md) | D2.T13 | — | `draft_for_sme` |
| M7.54 | [Project Timelines (Gantt, CPM)](topics/M7.54_project-timelines-gantt-cpm.md) | D2.T13 | ✓ | `draft_for_sme` |
| M7.55 | [Leadership & Management Theories](topics/M7.55_leadership-management-theories.md) | D2.T12 | — | `draft_for_sme` |

## M8 — CSP11-New & Emerging (priority P4, target 5 topics)

PtD (Z590.3), AI in training, cybersecurity in EM, ESG for EHS, drones & telematics.

| ID | Topic | Blueprint | Calc? | Status |
|---|---|---|---|---|
| M8.56 | [Prevention-Through-Design (Z590.3)](topics/M8.56_prevention-through-design-z5903.md) | D1.T1 | — | `draft_for_sme` |
| M8.57 | [Smart Tools in Training](topics/M8.57_smart-tools-in-training.md) | D7.T5 | — | `draft_for_sme` |
| M8.58 | [Cybersecurity in Emergency Mgmt](topics/M8.58_cybersecurity-in-emergency-mgmt.md) | D4.T1 | — | `draft_for_sme` |
| M8.59 | [ESG for EHS Professionals](topics/M8.59_esg-for-ehs-professionals.md) | D5.T5 | — | `draft_for_sme` |
| M8.60 | [Drones & Telematics](topics/M8.60_drones-telematics.md) | D1.T5 / D1.T6 | — | `draft_for_sme` |

## M9 — Process Safety Deep-Dive (priority P4, target 5 topics)

Pressure relief sizing, chemical compatibility, MOC, PHA selection, SIL & SIS.

| ID | Topic | Blueprint | Calc? | Status |
|---|---|---|---|---|
| M9.61 | [Pressure Relief Sizing](topics/M9.61_pressure-relief-sizing.md) | D1.T2 | ✓ | `draft_for_sme` |
| M9.62 | [Chemical Compatibility](topics/M9.62_chemical-compatibility.md) | D1.T2 | — | `draft_for_sme` |
| M9.63 | [Management of Change (MOC)](topics/M9.63_management-of-change-moc.md) | D2.T5 / D1.T2 | — | `draft_for_sme` |
| M9.64 | [PHA Method Selection](topics/M9.64_pha-method-selection.md) | D1.T2 | — | `draft_for_sme` |
| M9.65 | [SIL & Safety Instrumented Systems](topics/M9.65_sil-safety-instrumented-systems.md) | D1.T2 | ✓ | `draft_for_sme` |

## 18-Element Gold Standard

Every Mastery topic carries:

1. Hook (1-paragraph case + image)
2. Learning objectives (Bloom-tagged, blueprint-coded)
3. Overview / dual-coded core
4. Concepts (3–7)
5. Worked example (problem → reasoning → answer → traps)
6. Field application (GCC-anchored where applicable)
7. Mnemonic / number anchor
8. Common pitfalls (≥3)
9. Cross-domain links (≥2)
10. Citations (primary sources only)
11. 10-step flow content (hook/try/core/visual/example/memory/recall/apply/teach/summary)
12. Mastery threshold (≥0.85)
13. Distinction with related methods
14. Method-selection logic (tested in ≥1 item)
15. Five mastery items (recall/application/analysis/scenario/calculation)
16. **Method Card** (1-page printable PDF spec)
17. **Decision Tree** (when to use vs. alternatives)
18. **Calculation Sandbox** (interactive worksheet) OR Application Workshop

