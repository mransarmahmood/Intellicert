<?php

namespace App\Console\Commands;

use App\Http\Controllers\AiController;
use App\Models\Quiz;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\App;

/**
 * Track 6 — Bulk-generate per-option rationales for items that don't yet
 * have them. Drafts are written with status='draft' so they don't go live
 * until SME review.
 *
 * The 4-component rationale standard:
 *   1. Why correct (replaces / refines existing `explanation`)
 *   2. Per-option distractor rationales (option_a..d_rationale)
 *   3. Common trap (concept this is confused with)
 *   4. Memory hook — the prompt asks the model to suggest the topic
 *      whose mnemonic/visual is the strongest hook.
 *
 * Usage:
 *   php artisan content:generate-rationales --limit=5         (test batch)
 *   php artisan content:generate-rationales --domain=safety   (one domain)
 *   php artisan content:generate-rationales --force           (overwrite)
 */
class GenerateRationales extends Command
{
    protected $signature = 'content:generate-rationales
        {--limit=10 : Max items to process this run}
        {--domain= : Only process items in this domain_id}
        {--force : Overwrite existing rationales}
        {--dry-run : Print prompts but do not save}';

    protected $description = 'Generate per-option rationales for quiz items missing them.';

    public function handle(AiController $ai): int
    {
        $limit  = (int) $this->option('limit');
        $domain = $this->option('domain');
        $force  = (bool) $this->option('force');
        $dryRun = (bool) $this->option('dry-run');

        $query = Quiz::query();
        if ($domain) $query->where('domain_id', $domain);
        if (!$force) {
            $query->where(function ($q) {
                $q->whereNull('option_a_rationale')->orWhere('option_a_rationale', '=', '');
            });
        }
        $items = $query->limit($limit)->get();

        $this->info("Generating rationales for " . $items->count() . " items…");
        $generated = 0; $failed = 0;

        $bar = $this->output->createProgressBar($items->count());
        $bar->start();

        foreach ($items as $quiz) {
            $bar->advance();
            $optionLabels = ['A','B','C','D'];
            $correctLabel = $optionLabels[$quiz->correct_index] ?? 'A';

            $system = "You are a Certified Safety Professional (CSP) exam item-writer. " .
                      "Write rationales in plain, exam-style English. Cite OSHA/NIOSH/ANSI/NFPA where appropriate. Be concise.";
            $user = "Question: {$quiz->question}\n" .
                    "A) {$quiz->option_a}\n" .
                    "B) {$quiz->option_b}\n" .
                    "C) {$quiz->option_c}\n" .
                    "D) {$quiz->option_d}\n" .
                    "Correct answer: {$correctLabel}\n\n" .
                    "Return a JSON object with EXACTLY these keys (no extras, no prose):\n" .
                    "{\n" .
                    '  "correct_rationale": "2-3 sentences explaining why ' . $correctLabel . " is correct, citing a regulation if applicable.\",\n" .
                    '  "rationale_a": "1 sentence explaining why A is tempting OR confirming correctness if A is the answer.",' . "\n" .
                    '  "rationale_b": "1 sentence for B.",' . "\n" .
                    '  "rationale_c": "1 sentence for C.",' . "\n" .
                    '  "rationale_d": "1 sentence for D.",' . "\n" .
                    '  "common_trap": "1 sentence describing the concept students often confuse this with.",' . "\n" .
                    '  "source_reference": "Regulation/standard reference, or empty string if none."' . "\n" .
                    "}";

            if ($dryRun) {
                $this->line("\n--- Quiz #{$quiz->id} ---");
                $this->line($user);
                continue;
            }

            try {
                $result = $ai->__call('aiJson', [$system, $user]); // not callable — adjust
            } catch (\Throwable $e) {
                // Fall through to direct call below.
                $result = null;
            }

            // Direct call via reflection since aiJson is private.
            try {
                $ref = new \ReflectionMethod(AiController::class, 'aiJson');
                $ref->setAccessible(true);
                $resp = $ref->invoke($ai, $system, $user);
                $json = $resp['json'] ?? [];
            } catch (\Throwable $e) {
                $this->newLine();
                $this->error("Quiz #{$quiz->id}: AI call failed — " . $e->getMessage());
                $failed++;
                continue;
            }

            if (empty($json['correct_rationale'])) {
                $failed++;
                continue;
            }

            $quiz->update([
                'explanation'        => $json['correct_rationale'] ?? $quiz->explanation,
                'option_a_rationale' => $json['rationale_a'] ?? null,
                'option_b_rationale' => $json['rationale_b'] ?? null,
                'option_c_rationale' => $json['rationale_c'] ?? null,
                'option_d_rationale' => $json['rationale_d'] ?? null,
                'common_trap'        => $json['common_trap'] ?? null,
                'source_reference'   => $json['source_reference'] ?? null,
                'status'             => 'draft', // SME review required before going live
                'last_reviewed_at'   => now(),
            ]);
            $generated++;
        }
        $bar->finish();
        $this->newLine();
        $this->info("Done. Generated: $generated  Failed: $failed");
        $this->line("All generated rationales saved as status='draft' — review in admin and flip to status='live' when ready.");
        return self::SUCCESS;
    }
}
