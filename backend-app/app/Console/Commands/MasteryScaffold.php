<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * One-shot scaffold writer.
 *
 * Generates the 75 markdown evidence files for the Mastery Library:
 *   - docs/csp11_mastery/00_index.md         (one)
 *   - docs/csp11_mastery/categories/Mn.md    (nine)
 *   - docs/csp11_mastery/topics/<id>_<slug>.md (sixty-five)
 *
 * Idempotent — only writes a file if it doesn't already exist (so re-runs
 * after content authoring don't blow away SME work). Force overwrite with
 * --force.
 */
class MasteryScaffold extends Command
{
    protected $signature = 'mastery:scaffold {--force : Overwrite existing files}';
    protected $description = 'Scaffold the 75 markdown evidence files for the Mastery Library.';

    private string $base;

    public function handle(): int
    {
        $this->base = base_path('../docs/csp11_mastery');
        $force = (bool) $this->option('force');

        $catCount = $this->writeIndex($force) + $this->writeCategories($force);
        $topicCount = $this->writeTopics($force);

        $this->info("Scaffold done. Index/categories: {$catCount}. Topic files: {$topicCount}.");
        return self::SUCCESS;
    }

    private function writeIndex(bool $force): int
    {
        $path = "{$this->base}/00_index.md";
        if (file_exists($path) && !$force) return 0;

        $cats = DB::table('mastery_categories')->orderBy('sort_order')->get();
        $topics = DB::table('mastery_topics')->orderBy('sort_order')->get();

        $body = "# Mastery Library — CSP11 Advanced Techniques & Methods\n\n";
        $body .= "**65 topics · 9 categories · 18-element Gold Standard each**\n\n";
        $body .= "This is the canonical index of the Mastery Library. Every topic ships only after passing the 12-point defensibility checklist (`php artisan mastery:check-defensibility --id=<mastery_id>`).\n\n";
        $body .= "| Status | Meaning |\n|---|---|\n";
        $body .= "| `mastery_gold` | Passed all 12 points; live to learners |\n";
        $body .= "| `needs_sme` | Failed defensibility check OR SME flagged |\n";
        $body .= "| `draft_for_sme` | AI-generated, awaiting first SME pass |\n";
        $body .= "| `archived` | Retired |\n\n";

        foreach ($cats as $cat) {
            $body .= "## {$cat->code} — {$cat->name} (priority {$cat->priority}, target {$cat->topic_count_target} topics)\n\n";
            $body .= ($cat->description ?? '') . "\n\n";
            $body .= "| ID | Topic | Blueprint | Calc? | Status |\n|---|---|---|---|---|\n";
            $catTopics = $topics->where('mastery_category_code', $cat->code)->sortBy('sort_order');
            foreach ($catTopics as $t) {
                $bp = $t->primary_blueprint_code . ($t->secondary_blueprint_code ? " / {$t->secondary_blueprint_code}" : '');
                $calc = $t->is_calculation_topic ? '✓' : '—';
                $body .= "| {$t->mastery_id} | [{$t->name}](topics/{$t->mastery_id}_{$t->slug}.md) | {$bp} | {$calc} | `{$t->status}` |\n";
            }
            $body .= "\n";
        }

        $body .= "## 18-Element Gold Standard\n\n";
        $body .= "Every Mastery topic carries:\n\n";
        $body .= "1. Hook (1-paragraph case + image)\n";
        $body .= "2. Learning objectives (Bloom-tagged, blueprint-coded)\n";
        $body .= "3. Overview / dual-coded core\n";
        $body .= "4. Concepts (3–7)\n";
        $body .= "5. Worked example (problem → reasoning → answer → traps)\n";
        $body .= "6. Field application (GCC-anchored where applicable)\n";
        $body .= "7. Mnemonic / number anchor\n";
        $body .= "8. Common pitfalls (≥3)\n";
        $body .= "9. Cross-domain links (≥2)\n";
        $body .= "10. Citations (primary sources only)\n";
        $body .= "11. 10-step flow content (hook/try/core/visual/example/memory/recall/apply/teach/summary)\n";
        $body .= "12. Mastery threshold (≥0.85)\n";
        $body .= "13. Distinction with related methods\n";
        $body .= "14. Method-selection logic (tested in ≥1 item)\n";
        $body .= "15. Five mastery items (recall/application/analysis/scenario/calculation)\n";
        $body .= "16. **Method Card** (1-page printable PDF spec)\n";
        $body .= "17. **Decision Tree** (when to use vs. alternatives)\n";
        $body .= "18. **Calculation Sandbox** (interactive worksheet) OR Application Workshop\n\n";

        return $this->put($path, $body);
    }

    private function writeCategories(bool $force): int
    {
        $written = 0;
        $cats = DB::table('mastery_categories')->orderBy('sort_order')->get();
        foreach ($cats as $cat) {
            $path = "{$this->base}/categories/{$cat->code}.md";
            if (file_exists($path) && !$force) continue;

            $body  = "# {$cat->code} — {$cat->name}\n\n";
            $body .= "**Priority: {$cat->priority} · Target: {$cat->topic_count_target} topics**\n\n";
            $body .= ($cat->description ?? '') . "\n\n";
            $body .= "## Topics\n\n";
            $topics = DB::table('mastery_topics')
                ->where('mastery_category_code', $cat->code)
                ->orderBy('sort_order')
                ->get();
            foreach ($topics as $t) {
                $bp = $t->primary_blueprint_code . ($t->secondary_blueprint_code ? " / {$t->secondary_blueprint_code}" : '');
                $body .= "- [{$t->mastery_id} {$t->name}](../topics/{$t->mastery_id}_{$t->slug}.md) — {$bp}\n";
            }
            $body .= "\n## Cross-topic distinctions (SME to author)\n\n";
            $body .= "_To be filled in when ≥3 topics in this category reach `mastery_gold`. Capture the 'when to use X vs Y' decision logic here so the Decision Tree element of each topic stays consistent across the category._\n";

            $written += $this->put($path, $body);
        }
        return $written;
    }

    private function writeTopics(bool $force): int
    {
        $written = 0;
        $topics = DB::table('mastery_topics')->orderBy('sort_order')->get();
        foreach ($topics as $t) {
            $path = "{$this->base}/topics/{$t->mastery_id}_{$t->slug}.md";
            if (file_exists($path) && !$force) continue;
            $written += $this->put($path, $this->topicTemplate($t));
        }
        return $written;
    }

    private function topicTemplate(object $t): string
    {
        $bp = $t->primary_blueprint_code . ($t->secondary_blueprint_code ? " / {$t->secondary_blueprint_code}" : '');
        $sandboxOrWorkshop = $t->is_calculation_topic ? 'Calculation Sandbox' : 'Application Workshop';

        $b  = "# {$t->mastery_id} — {$t->name}\n\n";
        $b .= "**Status:** `{$t->status}` · **Blueprint:** {$bp} · **Calculation topic:** " . ($t->is_calculation_topic ? 'Yes' : 'No') . "\n\n";
        $b .= "_This file is the SME defensibility evidence for this Mastery topic. Authoring follows the 18-element Gold Standard. Run `php artisan mastery:check-defensibility --id={$t->mastery_id}` after edits._\n\n";
        $b .= "---\n\n";
        $b .= "## 1. Hook\n\n_Real incident or statistic. 3-4 sentences with cited source. Image url + alt._\n\n";
        $b .= "## 2. Learning Objectives\n\n_3–5 measurable LOs. Each tagged with Bloom level + blueprint sub-domain code._\n\n";
        $b .= "## 3. Overview\n\n_Dual-coded core explanation. Image breakpoint every 200–300 words._\n\n";
        $b .= "## 4. Concepts (3–7)\n\n_Each concept: title, 1-paragraph definition, distinguishing feature._\n\n";
        $b .= "## 5. Worked Example\n\n_Problem → reasoning steps → answer → distractor traps. GCC-anchored when applicable._\n\n";
        $b .= "## 6. Field Application\n\n_Industry, scenario, decision prompt._\n\n";
        $b .= "## 7. Mnemonic / Number Anchor\n\n_Pick the most durable encoding for this method._\n\n";
        $b .= "## 8. Common Pitfalls (≥3)\n\n_Predictable failure modes when learners apply this method._\n\n";
        $b .= "## 9. Cross-Domain Links (≥2)\n\n_Where else this technique surfaces in CSP11._\n\n";
        $b .= "## 10. Citations (primary sources)\n\n_ANSI/ASSP, IEC, API, ISO, NIOSH, ACGIH, BCSP texts. Year + clause where applicable._\n\n";
        $b .= "## 11. 10-Step Flow Content\n\nhook · try · core · visual · example · memory · recall · apply · teach · summary\n\n";
        $b .= "## 12. Mastery Threshold\n\n_Default 0.85. Raise to 0.90 for high-stakes (PSM, SIL, confined space, fall protection)._\n\n";
        $b .= "## 13. Distinction with Related Methods\n\n_How this method differs from each near-neighbor method in the same category. Table form preferred._\n\n";
        $b .= "## 14. Method-Selection Logic\n\n_Conditions that route a learner to this method vs. alternatives. At least one mastery item tests this directly._\n\n";
        $b .= "## 15. Mastery Items (5)\n\n_Distribution: recall · application · analysis · scenario · calculation. Each carries the 4-component rationale (per-option + common_trap + memory_hook + source_reference)._\n\n";
        $b .= "## 16. Method Card (1-page)\n\n_Definition · When to use · When NOT to use · Inputs · Procedure · Output · Formulas · Pitfalls · Reference. Must fit one printed page._\n\n";
        $b .= "## 17. Decision Tree\n\n_Selection flowchart vs. ≥2 alternative methods. Each branch defended with cited reasoning._\n\n";
        $b .= "## 18. {$sandboxOrWorkshop}\n\n";
        if ($t->is_calculation_topic) {
            $b .= "_Inputs (units, ranges) → step-by-step reveal → worked GCC example → variant challenge → auto-graded answer._\n\n";
        } else {
            $b .= "_Scenario · prompt · expected reasoning rubric · AI-graded feedback config._\n\n";
        }
        $b .= "---\n\n## 12-Point Defensibility Checklist\n\n";
        $checks = [
            'All 18 elements present',
            'Calculations verified against primary source',
            'References ≤5 yrs for evolving topics, canonical for foundational',
            'Decision tree covers ≥2 alternative methods',
            'Method card fits 1 page',
            'GCC anchoring in case (where applicable)',
            'Distinction with related methods explicit',
            'All items have 4-component rationale',
            'Cross-domain links ≥2',
            'Bloom distribution correct (no ≥3 items at same level)',
            'Method-selection logic tested in ≥1 item',
            'SME notes captured in this file',
        ];
        foreach ($checks as $i => $c) $b .= sprintf("- [ ] %d. %s\n", $i + 1, $c);
        $b .= "\n## SME Notes\n\n_Reviewer name · date · disposition. Use this section to record edits, citations added, formulas re-verified._\n";

        return $b;
    }

    private function put(string $path, string $body): int
    {
        $dir = dirname($path);
        if (!is_dir($dir)) mkdir($dir, 0755, true);
        file_put_contents($path, $body);
        return 1;
    }
}
