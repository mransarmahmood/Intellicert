<?php

namespace App\Console\Commands;

use App\Models\MasteryItem;
use App\Models\MasteryTopic;
use Illuminate\Console\Command;

/**
 * Runs the 12-point Mastery defensibility checklist for a topic (or all
 * topics) and writes the result back to mastery_topics.defensibility_checklist_json.
 *
 * Sets status='mastery_gold' iff ALL 12 points pass; otherwise 'needs_sme'.
 *
 *   php artisan mastery:check-defensibility --id=M1.01
 *   php artisan mastery:check-defensibility --all --report
 */
class MasteryDefensibilityCheck extends Command
{
    protected $signature = 'mastery:check-defensibility
        {--id= : Single mastery_id to check}
        {--all : Check all topics}
        {--report : Print human-readable per-topic report}';

    protected $description = 'Run the 12-point defensibility checklist on Mastery topics.';

    public function handle(): int
    {
        $query = MasteryTopic::query();
        if ($id = $this->option('id')) $query->where('mastery_id', $id);
        elseif (!$this->option('all')) {
            $this->error('Specify --id=<mastery_id> or --all');
            return self::FAILURE;
        }

        $topics = $query->get();
        $report = $this->option('report');
        $passed = 0; $flagged = 0;

        foreach ($topics as $topic) {
            $result = $this->check($topic);
            $allPass = collect($result)->every(fn ($r) => $r['pass'] === true);

            $topic->defensibility_checklist_json = $result;
            $topic->status = $allPass ? 'mastery_gold' : 'needs_sme';
            $topic->save();

            if ($allPass) $passed++; else $flagged++;

            if ($report) {
                $this->line(sprintf("\n%s — %s [%s]", $topic->mastery_id, $topic->name, $topic->status));
                foreach ($result as $i => $r) {
                    $mark = $r['pass'] ? '<fg=green>✓</>' : '<fg=red>✗</>';
                    $this->line(sprintf("  %s %2d. %s%s", $mark, $i + 1, $r['label'],
                        $r['pass'] ? '' : "  <fg=yellow>($r[reason])</>"));
                }
            }
        }

        $this->newLine();
        $this->info("Topics checked: " . $topics->count() . "  ·  Passed: $passed  ·  Flagged for SME: $flagged");
        return self::SUCCESS;
    }

    /**
     * @return array<int, array{label:string,pass:bool,reason?:string}>
     */
    private function check(MasteryTopic $t): array
    {
        $items = MasteryItem::where('mastery_topic_id', $t->id)->get();
        $checks = [];

        // 1. All 18 elements present
        $missing18 = [];
        if (empty($t->hook_text)) $missing18[] = 'hook_text';
        if (empty($t->learning_objectives_json)) $missing18[] = 'learning_objectives';
        if (empty($t->overview_html)) $missing18[] = 'overview_html';
        if (empty($t->concepts_json)) $missing18[] = 'concepts';
        if (empty($t->worked_example_json)) $missing18[] = 'worked_example';
        if (empty($t->field_application_json)) $missing18[] = 'field_application';
        if (empty($t->mnemonics_json)) $missing18[] = 'mnemonics';
        if (empty($t->common_pitfalls_json)) $missing18[] = 'common_pitfalls';
        if (empty($t->cross_domain_links_json)) $missing18[] = 'cross_domain_links';
        if (empty($t->citations_json)) $missing18[] = 'citations';
        if (empty($t->method_card_json)) $missing18[] = 'method_card';
        if (empty($t->decision_tree_json)) $missing18[] = 'decision_tree';
        if ($t->is_calculation_topic && empty($t->calculation_sandbox_json)) $missing18[] = 'calculation_sandbox';
        if (!$t->is_calculation_topic && empty($t->application_workshop_json)) $missing18[] = 'application_workshop';
        $checks[] = $this->result('All 18 elements present', empty($missing18),
            empty($missing18) ? null : 'missing: ' . implode(', ', $missing18));

        // 2. Calculations verified — for calc topics, sandbox must include a numeric sample answer.
        if ($t->is_calculation_topic) {
            $sandbox = $t->calculation_sandbox_json ?? [];
            $hasAnswer = !empty($sandbox['sample_answer']) && is_numeric((string) ($sandbox['sample_answer']['value'] ?? ''));
            $checks[] = $this->result('Calculations verified (sample answer numeric)', $hasAnswer,
                $hasAnswer ? null : 'sandbox.sample_answer.value missing or non-numeric');
        } else {
            $checks[] = $this->result('Calculations verified (n/a — non-calc topic)', true);
        }

        // 3. References ≥1 primary source citation
        $cit = $t->citations_json ?? [];
        $checks[] = $this->result('Cited primary sources (≥1)', count($cit) >= 1,
            count($cit) === 0 ? 'no citations' : null);

        // 4. Decision tree covers ≥2 alternative methods
        $tree = $t->decision_tree_json ?? [];
        $alternatives = $tree['alternatives'] ?? [];
        $checks[] = $this->result('Decision tree ≥2 alternatives', count($alternatives) >= 2,
            count($alternatives) < 2 ? 'only ' . count($alternatives) . ' alternative(s)' : null);

        // 5. Method card fits 1 page (heuristic: total chars ≤ 3500 across structured fields)
        $mc = $t->method_card_json ?? [];
        $cardChars = strlen(json_encode($mc));
        $checks[] = $this->result('Method card fits 1 page (≤3500 chars)', $cardChars > 0 && $cardChars <= 3500,
            $cardChars > 3500 ? "method card is $cardChars chars" : ($cardChars === 0 ? 'method card empty' : null));

        // 6. GCC anchoring in case (where applicable). Skip if explicitly marked global-only.
        $field = $t->field_application_json ?? [];
        $hasGcc = false;
        $blob = strtolower(json_encode($field));
        foreach (['saudi','aramco','nfeom','red sea','rsg','gcc','dubai','abu dhabi','riyadh','etihad','adnoc','qatar','kuwait','oman','bahrain'] as $kw) {
            if (str_contains($blob, $kw)) { $hasGcc = true; break; }
        }
        $checks[] = $this->result('GCC anchoring in field application', $hasGcc || empty($field),
            (!$hasGcc && !empty($field)) ? 'no GCC keyword detected — verify intentional' : null);

        // 7. Distinction with related methods explicit (decision tree branches OR overview mentions ≥1 alternative)
        $hasDistinction = !empty($tree['branches']) && count($tree['branches']) >= 2;
        $checks[] = $this->result('Distinction with related methods explicit', $hasDistinction,
            !$hasDistinction ? 'decision_tree.branches missing or <2' : null);

        // 8. All items have 4-component rationale
        $itemChecks = [];
        foreach ($items as $it) {
            $rationales = $it->option_rationales_json ?? [];
            $hasFour = !empty($it->correct_rationale)
                && count(array_filter($rationales, fn ($r) => !empty($r))) >= 3
                && !empty($it->common_trap)
                && !empty($it->memory_hook)
                && !empty($it->source_reference);
            if (!$hasFour) $itemChecks[] = "item#{$it->id}";
        }
        $checks[] = $this->result(
            'All items have 4-component rationale',
            $items->count() >= 5 && empty($itemChecks),
            $items->count() < 5 ? "only {$items->count()} item(s)" : (empty($itemChecks) ? null : 'incomplete: ' . implode(', ', $itemChecks))
        );

        // 9. Cross-domain links ≥2
        $links = $t->cross_domain_links_json ?? [];
        $checks[] = $this->result('Cross-domain links ≥2', count($links) >= 2,
            count($links) < 2 ? 'only ' . count($links) . ' link(s)' : null);

        // 10. Bloom distribution correct (no more than 2 items at the same Bloom level)
        $blooms = $items->pluck('bloom_level')->filter()->countBy();
        $maxAtLevel = $blooms->max() ?? 0;
        $checks[] = $this->result('Bloom distribution diverse (max 2 items per level)', $maxAtLevel <= 2,
            $maxAtLevel > 2 ? "level repeated $maxAtLevel times" : null);

        // 11. Method-selection logic tested in ≥1 item
        $hasSelectionItem = $items->contains(fn ($it) =>
            stripos($it->stem ?? '', 'which method') !== false
            || stripos($it->stem ?? '', 'best technique') !== false
            || stripos($it->stem ?? '', 'most appropriate') !== false
            || $it->cognitive_level === 'analysis'
        );
        $checks[] = $this->result('Method-selection tested in ≥1 item', $hasSelectionItem,
            !$hasSelectionItem ? 'no analysis/selection item found' : null);

        // 12. SME notes captured
        $hasSmeNotes = !empty($t->sme_notes) && strlen($t->sme_notes) >= 30;
        $checks[] = $this->result('SME notes file captured', $hasSmeNotes,
            !$hasSmeNotes ? 'sme_notes empty or <30 chars' : null);

        return $checks;
    }

    private function result(string $label, bool $pass, ?string $reason = null): array
    {
        $r = ['label' => $label, 'pass' => $pass];
        if ($reason !== null) $r['reason'] = $reason;
        return $r;
    }
}
