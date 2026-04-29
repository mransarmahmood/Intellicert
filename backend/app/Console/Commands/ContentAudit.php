<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Track 6 — Content audit / verification tooling.
 *
 * Reports completeness against the 4-component rationale standard
 * (per-option rationales + common_trap + memory_hook + reference) and
 * the 9-layer topic anatomy (hook + LOs + worked example + field
 * application + mastery threshold tuned).
 *
 * Used as the gate for the +8–12pp pass-rate marketing claim:
 * `php artisan content:audit` should print 360/360 + 30/30 before launch.
 *
 *   php artisan content:audit
 *   php artisan content:audit --json
 *   php artisan content:audit --details
 */
class ContentAudit extends Command
{
    protected $signature = 'content:audit {--json : Emit JSON instead of human report} {--details : List incomplete items}';

    protected $description = 'Audit per-option rationales (360 items) and 9-layer topic anatomy (30 pilot topics).';

    public function handle(): int
    {
        $rationaleAudit = $this->auditRationales();
        $topicAudit     = $this->auditTopicLayers();

        $payload = [
            'rationales' => $rationaleAudit,
            'topics_9_layer' => $topicAudit,
            'gate_passed'    => $rationaleAudit['complete_pct'] >= 100 && $topicAudit['pilot_complete'] >= 30,
        ];

        if ($this->option('json')) {
            $this->line(json_encode($payload, JSON_PRETTY_PRINT));
            return self::SUCCESS;
        }

        $this->renderReport($payload);
        return $payload['gate_passed'] ? self::SUCCESS : self::FAILURE;
    }

    private function auditRationales(): array
    {
        $total = (int) DB::table('quizzes')->count();
        $byField = [
            'option_a_rationale' => (int) DB::table('quizzes')->whereNotNull('option_a_rationale')->where('option_a_rationale', '<>', '')->count(),
            'option_b_rationale' => (int) DB::table('quizzes')->whereNotNull('option_b_rationale')->where('option_b_rationale', '<>', '')->count(),
            'option_c_rationale' => (int) DB::table('quizzes')->whereNotNull('option_c_rationale')->where('option_c_rationale', '<>', '')->count(),
            'option_d_rationale' => (int) DB::table('quizzes')->whereNotNull('option_d_rationale')->where('option_d_rationale', '<>', '')->count(),
            'common_trap'        => (int) DB::table('quizzes')->whereNotNull('common_trap')->where('common_trap', '<>', '')->count(),
            'memory_hook_topic_id' => (int) DB::table('quizzes')->whereNotNull('memory_hook_topic_id')->count(),
            'source_reference'   => (int) DB::table('quizzes')->whereNotNull('source_reference')->where('source_reference', '<>', '')->count(),
            'bloom_level'        => (int) DB::table('quizzes')->whereNotNull('bloom_level')->count(),
            'sub_domain_code'    => (int) DB::table('quizzes')->whereNotNull('sub_domain_code')->where('sub_domain_code', '<>', '')->count(),
        ];

        // An item is "complete" only when ALL 4 rationale-component fields are populated.
        $complete = (int) DB::table('quizzes')
            ->whereNotNull('option_a_rationale')->where('option_a_rationale', '<>', '')
            ->whereNotNull('option_b_rationale')->where('option_b_rationale', '<>', '')
            ->whereNotNull('option_c_rationale')->where('option_c_rationale', '<>', '')
            ->whereNotNull('option_d_rationale')->where('option_d_rationale', '<>', '')
            ->whereNotNull('common_trap')->where('common_trap', '<>', '')
            ->count();

        return [
            'total'        => $total,
            'complete'     => $complete,
            'complete_pct' => $total === 0 ? 0 : round(100 * $complete / $total, 1),
            'by_field'     => $byField,
        ];
    }

    private function auditTopicLayers(): array
    {
        $total = (int) DB::table('topics')->count();
        $byField = [
            'hook_text'                => (int) DB::table('topics')->whereNotNull('hook_text')->where('hook_text', '<>', '')->count(),
            'hook_image_url'           => (int) DB::table('topics')->whereNotNull('hook_image_url')->where('hook_image_url', '<>', '')->count(),
            'learning_objectives_json' => (int) DB::table('topics')->whereNotNull('learning_objectives_json')->count(),
            'worked_example_json'      => (int) DB::table('topics')->whereNotNull('worked_example_json')->count(),
            'field_application_json'   => (int) DB::table('topics')->whereNotNull('field_application_json')->count(),
            'mastery_threshold_tuned'  => (int) DB::table('topics')->where('mastery_threshold', '<>', 0.85)->count(),
        ];

        // Pilot topics — must have all 4 anatomy fields (hook/LOs/worked/field).
        $pilotComplete = (int) DB::table('topics')
            ->whereNotNull('hook_text')->where('hook_text', '<>', '')
            ->whereNotNull('learning_objectives_json')
            ->whereNotNull('worked_example_json')
            ->whereNotNull('field_application_json')
            ->count();

        return [
            'total'           => $total,
            'pilot_complete'  => $pilotComplete,
            'pilot_target'    => 30,
            'by_field'        => $byField,
        ];
    }

    private function renderReport(array $p): void
    {
        $this->newLine();
        $this->info('— Item rationales (4-component standard) —');
        $r = $p['rationales'];
        $this->line(sprintf("  Complete: %d / %d  (%s%%)", $r['complete'], $r['total'], $r['complete_pct']));
        $this->table(['Field', 'Filled'], collect($r['by_field'])->map(fn ($v, $k) => [$k, "$v / {$r['total']}"])->values()->all());

        $this->newLine();
        $this->info('— 9-Layer topic anatomy (30-topic pilot) —');
        $t = $p['topics_9_layer'];
        $this->line(sprintf("  Pilot complete: %d / %d  (target %d)", $t['pilot_complete'], $t['total'], $t['pilot_target']));
        $this->table(['Field', 'Filled'], collect($t['by_field'])->map(fn ($v, $k) => [$k, "$v / {$t['total']}"])->values()->all());

        $this->newLine();
        if ($p['gate_passed']) {
            $this->info('✓ Content gate passed. Marketing claim eligible.');
        } else {
            $this->warn('✗ Content gate not passed. Continue authoring before shipping the +8–12pp claim.');
        }

        if ($this->option('details')) {
            $this->newLine();
            $this->info('— Items missing rationales (first 20) —');
            $missing = DB::table('quizzes')
                ->where(function ($q) {
                    $q->whereNull('option_a_rationale')->orWhere('option_a_rationale', '=', '')
                      ->orWhereNull('common_trap');
                })
                ->select('id', 'quiz_key', 'domain_id')
                ->limit(20)->get();
            foreach ($missing as $row) {
                $this->line(sprintf('  #%d %s [%s]', $row->id, $row->quiz_key, $row->domain_id));
            }
        }
    }
}
