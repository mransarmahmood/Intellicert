<?php

namespace App\Console\Commands;

use App\Http\Controllers\AiController;
use App\Models\Topic;
use Illuminate\Console\Command;

/**
 * Track 6 — Bulk-generate the 9-layer topic anatomy fields:
 *   - hook_text (1-paragraph real-world hook from OSHA/CSB/incident reports)
 *   - learning_objectives_json (3-5 Bloom-tagged LOs)
 *   - worked_example_json (problem → reasoning steps → answer → distractor traps)
 *   - field_application_json (industry-anchored case)
 *
 * Drafts are saved with the same review workflow as rationales: nothing
 * goes live until SME (the user) reviews. Mastery threshold is left at the
 * default 0.85; the user tunes it up to 0.90 for high-stakes topics.
 *
 *   php artisan content:generate-9-layer --limit=3
 *   php artisan content:generate-9-layer --topic=42
 *   php artisan content:generate-9-layer --domain=safety
 */
class GenerateTopicLayers extends Command
{
    protected $signature = 'content:generate-9-layer
        {--limit=5 : Max topics to process}
        {--topic= : Generate for a single topic id}
        {--domain= : Restrict to a domain id}
        {--force : Overwrite existing layer content}';

    protected $description = 'Generate 9-layer anatomy content (hook, LOs, worked example, field application) for topics.';

    public function handle(AiController $ai): int
    {
        $limit  = (int) $this->option('limit');
        $force  = (bool) $this->option('force');
        $topicId = $this->option('topic');
        $domain  = $this->option('domain');

        $query = Topic::query();
        if ($topicId) $query->where('id', (int) $topicId);
        if ($domain) $query->where('domain_id', $domain);
        if (!$force) {
            $query->where(function ($q) {
                $q->whereNull('hook_text')->orWhere('hook_text', '=', '');
            });
        }
        $topics = $query->limit($limit)->get();

        $this->info("Generating 9-layer content for " . $topics->count() . " topics…");
        $generated = 0; $failed = 0;
        $bar = $this->output->createProgressBar($topics->count());
        $bar->start();

        $ref = new \ReflectionMethod(AiController::class, 'aiJson');
        $ref->setAccessible(true);

        foreach ($topics as $topic) {
            $bar->advance();

            $system = "You are a senior CSP exam item-writer and instructional designer. " .
                      "Write content for the 9-layer topic anatomy used by IntelliCert. " .
                      "Anchor real-world cases in GCC contexts (Saudi Aramco, Red Sea Global, NEOM, " .
                      "Etihad Rail) WHEN APPLICABLE; otherwise use US OSHA/CSB cases.";
            $user = "Topic: {$topic->name}\n" .
                    "Subtitle: " . ($topic->subtitle ?? '') . "\n" .
                    "Overview (excerpt): " . substr(strip_tags($topic->overview ?? ''), 0, 800) . "\n\n" .
                    "Return a JSON object with EXACTLY these keys:\n" .
                    "{\n" .
                    '  "hook_text": "1 paragraph (3-4 sentences) that hooks a learner with a real incident or statistic that makes them care. Cite the source.",' . "\n" .
                    '  "learning_objectives": [{"verb": "apply", "statement": "...", "bloom_level": 3, "sub_domain_code": "CSP11.D2.S3.4"}, ...] (3-5 items)' . "," . "\n" .
                    '  "worked_example": {"problem": "...", "steps": ["step 1...", "step 2...", "step 3..."], "answer": "...", "distractor_traps": ["why students pick the wrong answer 1", "trap 2"]},' . "\n" .
                    '  "field_application": {"industry": "construction|oil_gas|healthcare|manufacturing|...", "scenario": "1-paragraph case from the field", "decision_prompt": "What would you do?"}' . "\n" .
                    "}";

            // The AI may return JSON wrapped in fences — fall back to a manual aiText call.
            $textRef = new \ReflectionMethod(AiController::class, 'aiText');
            $textRef->setAccessible(true);
            try {
                $resp = $textRef->invoke($ai, $system, $user);
                $raw = (string) ($resp['content'] ?? '');
                $clean = preg_replace('/```(?:json)?|```/i', '', $raw);
                $json = json_decode((string) $clean, true);
                if (!is_array($json)) {
                    // Try to extract first {...} block
                    if (preg_match('/\{.*\}/s', $clean, $m)) {
                        $json = json_decode($m[0], true);
                    }
                }
            } catch (\Throwable $e) {
                $this->newLine();
                $this->error("Topic #{$topic->id}: AI call failed — " . $e->getMessage());
                $failed++;
                continue;
            }

            if (!is_array($json) || empty($json['hook_text']) || empty($json['learning_objectives'])) {
                $this->newLine();
                $this->warn("Topic #{$topic->id}: AI returned unparseable response — skipped.");
                $failed++;
                continue;
            }

            $topic->update([
                'hook_text'                => $json['hook_text'] ?? null,
                'learning_objectives_json' => $json['learning_objectives'] ?? null,
                'worked_example_json'      => $json['worked_example'] ?? null,
                'field_application_json'   => $json['field_application'] ?? null,
            ]);
            $generated++;
        }
        $bar->finish();
        $this->newLine();
        $this->info("Done. Generated: $generated  Failed: $failed");
        $this->line("9-layer content saved. Review in admin → Topic Detail → preview.");
        return self::SUCCESS;
    }
}
