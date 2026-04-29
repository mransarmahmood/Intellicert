<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Seeds the canonical 9 mastery_categories + 65 mastery_topics registry.
 *
 * The registry IS canonical — DO NOT add/remove rows here without updating
 * docs/csp11_mastery/00_index.md and bumping the manifest version.
 *
 * All 65 rows start at status='draft_for_sme' with empty content fields;
 * authoring fills them in via:
 *    php artisan mastery:generate-topic --id=M1.01
 *    php artisan mastery:check-defensibility --id=M1.01
 *
 * Run: php artisan db:seed --class=MasteryRegistrySeeder
 */
class MasteryRegistrySeeder extends Seeder
{
    public function run(): void
    {
        $this->seedCategories();
        $this->seedTopics();
    }

    private function seedCategories(): void
    {
        $rows = [
            ['M1', 'System Safety Analysis',          'P1', 11, 'FTA, ETA, FMEA, FMECA, HAZOP, What-If, Bow-Tie, LOPA, Safety Case, MORT, Risk Summation.'],
            ['M2', 'Ergonomics & Human Factors',      'P2',  8, 'NIOSH RWL/LI, RSI, RULA, REBA, Snook, anthropometric design, hand-arm and whole-body vibration A(8).'],
            ['M3', 'Industrial Hygiene & Exposure',   'P2', 10, 'TWA, additive mixtures, Brief & Scala, noise dose, ventilation, heat stress, dose-response, radiation, dust.'],
            ['M4', 'Statistical & Data Analysis',     'P1',  7, 'Descriptive stats, CIs, probability, Pareto, sampling, control charts, epidemiology.'],
            ['M5', 'Incident Metrics & Indicators',   'P1',  6, 'TRIR, DART, LTIFR, severity rate, leading indicators, EHS culture measurement.'],
            ['M6', 'Incident Investigation Methods',  'P3',  7, '5-Why, Fishbone, TapRooT/SnapCharT, TRIPOD-Beta, HFACS, causal factor charting, barrier analysis.'],
            ['M7', 'Financial, Project & Management', 'P3',  6, 'ROI/Payback/NPV, cost-benefit, procurement role, RACI, Gantt/CPM, leadership theories.'],
            ['M8', 'CSP11-New & Emerging',            'P4',  5, 'PtD (Z590.3), AI in training, cybersecurity in EM, ESG for EHS, drones & telematics.'],
            ['M9', 'Process Safety Deep-Dive',        'P4',  5, 'Pressure relief sizing, chemical compatibility, MOC, PHA selection, SIL & SIS.'],
        ];

        foreach ($rows as $i => [$code, $name, $priority, $count, $desc]) {
            DB::table('mastery_categories')->updateOrInsert(
                ['code' => $code],
                [
                    'name'               => $name,
                    'short_name'         => Str::limit($name, 30, ''),
                    'description'        => $desc,
                    'priority'           => $priority,
                    'topic_count_target' => $count,
                    'sort_order'         => ($i + 1) * 10,
                    'updated_at'         => now(),
                    'created_at'         => now(),
                ]
            );
        }
    }

    /**
     * Canonical 65-topic registry.
     * [mastery_id, category, name, primary_blueprint, secondary_blueprint, is_calculation]
     */
    private function seedTopics(): void
    {
        $rows = [
            // M1 — System Safety Analysis (11)
            ['M1.01', 'M1', 'Fault Tree Analysis (FTA)',                'D2.T6', null,    false],
            ['M1.02', 'M1', 'Event Tree Analysis (ETA)',                'D2.T6', null,    false],
            ['M1.03', 'M1', 'FMEA',                                      'D2.T6', null,    false],
            ['M1.04', 'M1', 'FMECA',                                     'D2.T6', null,    true],
            ['M1.05', 'M1', 'HAZOP',                                     'D1.T2', 'D2.T6',false],
            ['M1.06', 'M1', 'What-If / Checklist Analysis',              'D1.T2', 'D2.T6',false],
            ['M1.07', 'M1', 'Bow-Tie Analysis',                          'D2.T6', 'D3.T2',false],
            ['M1.08', 'M1', 'Layer of Protection Analysis (LOPA)',       'D2.T6', 'D1.T2',true],
            ['M1.09', 'M1', 'Safety Case Approach',                      'D2.T6', null,    false],
            ['M1.10', 'M1', 'MORT',                                      'D2.T4', 'D2.T6',false],
            ['M1.11', 'M1', 'Risk Summation',                            'D2.T6', 'D3.T1',true],

            // M2 — Ergonomics & Human Factors (8)
            ['M2.12', 'M2', 'NIOSH Lifting Equation (RWL & LI)',         'D6.T4', null,    true],
            ['M2.13', 'M2', 'Revised Strain Index (RSI)',                'D6.T4', null,    true],
            ['M2.14', 'M2', 'RULA',                                      'D6.T4', null,    true],
            ['M2.15', 'M2', 'REBA',                                      'D6.T4', null,    true],
            ['M2.16', 'M2', 'Snook Tables',                              'D6.T4', null,    true],
            ['M2.17', 'M2', 'Anthropometric Design',                     'D6.T4', null,    true],
            ['M2.18', 'M2', 'Hand-Arm Vibration A(8)',                   'D6.T1', 'D6.T4',true],
            ['M2.19', 'M2', 'Whole-Body Vibration A(8)',                 'D6.T1', 'D6.T4',true],

            // M3 — Industrial Hygiene & Exposure (10)
            ['M3.20', 'M3', 'TWA Calculation',                           'D6.T1', null,    true],
            ['M3.21', 'M3', 'Mixture Exposure (Additive)',               'D6.T1', null,    true],
            ['M3.22', 'M3', 'Brief & Scala Adjustment',                  'D6.T1', null,    true],
            ['M3.23', 'M3', 'Noise Dose (OSHA & ACGIH)',                 'D6.T1', null,    true],
            ['M3.24', 'M3', 'Ventilation: Capture & Local',              'D6.T1', null,    true],
            ['M3.25', 'M3', 'Dilution Ventilation',                      'D6.T1', null,    true],
            ['M3.26', 'M3', 'Heat Stress (WBGT)',                        'D6.T1', null,    true],
            ['M3.27', 'M3', 'Toxicology Dose-Response',                  'D6.T3', null,    false],
            ['M3.28', 'M3', 'Radiation Protection',                      'D6.T1', null,    true],
            ['M3.29', 'M3', 'Combustible Dust',                          'D6.T1', 'D1.T2',false],

            // M4 — Statistical & Data Analysis (7)
            ['M4.30', 'M4', 'Descriptive Statistics',                    'D2.T14', null,   true],
            ['M4.31', 'M4', 'Confidence Intervals',                      'D2.T14', null,   true],
            ['M4.32', 'M4', 'Probability Fundamentals',                  'D2.T14', null,   true],
            ['M4.33', 'M4', 'Pareto Analysis',                           'D2.T14', null,   true],
            ['M4.34', 'M4', 'Sampling Strategy',                         'D2.T14', 'D6.T1',true],
            ['M4.35', 'M4', 'Control Charts (UCL/LCL)',                  'D2.T14', null,   true],
            ['M4.36', 'M4', 'Epidemiology Statistics',                   'D6.T2',  null,   true],

            // M5 — Incident Metrics & Indicators (6)
            ['M5.37', 'M5', 'TRIR',                                      'D2.T7', null,   true],
            ['M5.38', 'M5', 'DART',                                      'D2.T7', null,   true],
            ['M5.39', 'M5', 'LTIFR (International)',                     'D2.T7', null,   true],
            ['M5.40', 'M5', 'Severity Rate',                             'D2.T7', null,   true],
            ['M5.41', 'M5', 'Leading Indicator Design',                  'D2.T7', null,   false],
            ['M5.42', 'M5', 'EHS Culture Measurement',                   'D2.T3', null,   false],

            // M6 — Incident Investigation Methods (7)
            ['M6.43', 'M6', '5-Why Analysis',                            'D2.T4', null,   false],
            ['M6.44', 'M6', 'Fishbone / Ishikawa',                       'D2.T4', null,   false],
            ['M6.45', 'M6', 'TapRooT / SnapCharT',                       'D2.T4', null,   false],
            ['M6.46', 'M6', 'TRIPOD-Beta',                               'D2.T4', null,   false],
            ['M6.47', 'M6', 'HFACS',                                     'D2.T4', null,   false],
            ['M6.48', 'M6', 'Causal Factor Charting',                    'D2.T4', null,   false],
            ['M6.49', 'M6', 'Barrier Analysis (Investigation)',          'D2.T4', null,   false],

            // M7 — Financial, Project & Management (6)
            ['M7.50', 'M7', 'ROI / Payback / NPV',                       'D2.T11', null,  true],
            ['M7.51', 'M7', 'Cost-Benefit Analysis',                     'D2.T11', null,  true],
            ['M7.52', 'M7', 'Procurement Role in EHS',                   'D2.T11', null,  false],
            ['M7.53', 'M7', 'RACI / RASCI Matrix',                       'D2.T13', null,  false],
            ['M7.54', 'M7', 'Project Timelines (Gantt, CPM)',            'D2.T13', null,  true],
            ['M7.55', 'M7', 'Leadership & Management Theories',          'D2.T12', null,  false],

            // M8 — CSP11-New & Emerging (5)
            ['M8.56', 'M8', 'Prevention-Through-Design (Z590.3)',        'D1.T1', null,   false],
            ['M8.57', 'M8', 'Smart Tools in Training',                   'D7.T5', null,   false],
            ['M8.58', 'M8', 'Cybersecurity in Emergency Mgmt',           'D4.T1', null,   false],
            ['M8.59', 'M8', 'ESG for EHS Professionals',                 'D5.T5', null,   false],
            ['M8.60', 'M8', 'Drones & Telematics',                       'D1.T5', 'D1.T6',false],

            // M9 — Process Safety Deep-Dive (5)
            ['M9.61', 'M9', 'Pressure Relief Sizing',                    'D1.T2', null,   true],
            ['M9.62', 'M9', 'Chemical Compatibility',                    'D1.T2', null,   false],
            ['M9.63', 'M9', 'Management of Change (MOC)',                'D2.T5', 'D1.T2',false],
            ['M9.64', 'M9', 'PHA Method Selection',                      'D1.T2', null,   false],
            ['M9.65', 'M9', 'SIL & Safety Instrumented Systems',         'D1.T2', null,   true],
        ];

        foreach ($rows as $i => [$id, $cat, $name, $primary, $secondary, $isCalc]) {
            $slug = Str::slug($name);
            DB::table('mastery_topics')->updateOrInsert(
                ['mastery_id' => $id],
                [
                    'mastery_category_code'    => $cat,
                    'slug'                     => $slug,
                    'name'                     => $name,
                    'primary_blueprint_code'   => $primary,
                    'secondary_blueprint_code' => $secondary,
                    'is_calculation_topic'     => $isCalc,
                    'requires_calculator'      => $isCalc,
                    'mastery_threshold'        => 0.85,
                    'status'                   => 'draft_for_sme',
                    'sort_order'               => ($i + 1) * 10,
                    'updated_at'               => now(),
                    'created_at'               => now(),
                ]
            );
        }
    }
}
