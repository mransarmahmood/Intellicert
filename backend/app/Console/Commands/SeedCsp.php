<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SeedCsp extends Command
{
    protected $signature = 'csp:seed {--fresh : Truncate target tables before seeding}';
    protected $description = 'Seed domains, topics, flashcards, and quizzes from database/seed.json';

    public function handle(): int
    {
        $path = database_path('seed.json');
        if (!file_exists($path)) {
            $this->error("seed.json not found at {$path}");
            $this->line('Run:  node database/seed-extract.cjs');
            return self::FAILURE;
        }

        $seed = json_decode(file_get_contents($path), true);
        if (!is_array($seed)) {
            $this->error('seed.json could not be parsed');
            return self::FAILURE;
        }

        if ($this->option('fresh')) {
            $this->warn('Truncating: quizzes, flashcards, topic_extras, concepts, topics, domains');
            if (!$this->confirm('This will DELETE all rows in those tables. Continue?', false)) {
                return self::FAILURE;
            }
            DB::statement('SET FOREIGN_KEY_CHECKS=0');
            DB::table('quizzes')->truncate();
            DB::table('flashcards')->truncate();
            DB::table('topic_extras')->truncate();
            DB::table('concepts')->truncate();
            DB::table('topics')->truncate();
            DB::table('domains')->truncate();
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
        }

        // ─── DOMAINS ─────────────────────────────────────────────
        $insertedDomains = 0;
        foreach ($seed['domains'] ?? [] as $d) {
            DB::table('domains')->updateOrInsert(
                ['id' => $d['id']],
                [
                    'number'      => $d['number'] ?? 0,
                    'name'        => $d['name'] ?? '',
                    'short_name'  => $d['shortName'] ?? ($d['name'] ?? ''),
                    'weight'      => $d['weight'] ?? 0,
                    'color_hex'   => $d['colorHex'] ?? '#3B82F6',
                    'icon'        => $d['icon'] ?? 'fa-shield-halved',
                    'description' => $d['description'] ?? null,
                    'updated_at'  => now(),
                    'created_at'  => now(),
                ]
            );
            $insertedDomains++;
        }
        $this->info("Domains: {$insertedDomains}");

        // ─── TOPICS (nested under domains) ───────────────────────
        $insertedTopics = 0;
        foreach ($seed['domains'] ?? [] as $d) {
            $domainId = $d['id'];
            $order = 0;
            foreach ($d['topics'] ?? [] as $t) {
                $order++;
                DB::table('topics')->updateOrInsert(
                    ['domain_id' => $domainId, 'topic_key' => $t['id']],
                    [
                        'name'       => $t['name'] ?? '',
                        'subtitle'   => $t['subtitle'] ?? null,
                        'icon'       => $t['icon'] ?? 'fa-book',
                        'sort_order' => $order,
                        'updated_at' => now(),
                        'created_at' => now(),
                    ]
                );
                $insertedTopics++;
            }
        }
        $this->info("Topics: {$insertedTopics}");

        // ─── FLASHCARDS ──────────────────────────────────────────
        $insertedCards = 0;
        $skippedCards = 0;
        foreach ($seed['flashcards'] ?? [] as $f) {
            $key = $f['id'] ?? null;
            if (!$key) { $skippedCards++; continue; }
            DB::table('flashcards')->updateOrInsert(
                ['card_key' => $key],
                [
                    'domain_id' => $f['domain'] ?? '',
                    'front'     => $f['front'] ?? '',
                    'back'      => $f['back'] ?? '',
                    'image_url' => $f['image'] ?? null,
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
            $insertedCards++;
        }
        $this->info("Flashcards: {$insertedCards}" . ($skippedCards ? " ({$skippedCards} skipped)" : ''));

        // ─── QUIZZES (regular + scenario + concept + exam + sequence) ───
        $insertedQuizzes = 0;
        $skippedQuizzes  = 0;
        $byKind = [];
        // Combine the original CSP.QUIZZES (regular) with all extra question banks
        $allQuestions = array_merge(
            array_map(fn ($q) => array_merge($q, ['kind' => 'regular']), $seed['quizzes'] ?? []),
            $seed['extraQuestions'] ?? []
        );
        foreach ($allQuestions as $q) {
            $key = $q['id'] ?? null;
            $opts = $q['options'] ?? [];
            if (!$key || count($opts) < 4) { $skippedQuizzes++; continue; }
            $kind = $q['kind'] ?? 'regular';
            DB::table('quizzes')->updateOrInsert(
                ['quiz_key' => $key],
                [
                    'domain_id'     => $q['domain'] ?? '',
                    'question'      => $q['question'] ?? '',
                    'option_a'      => $opts[0] ?? '',
                    'option_b'      => $opts[1] ?? '',
                    'option_c'      => $opts[2] ?? '',
                    'option_d'      => $opts[3] ?? '',
                    'correct_index' => (int) ($q['correct'] ?? 0),
                    'explanation'   => $q['explanation'] ?? null,
                    'kind'          => $kind,
                    'topic_key'     => $q['topic'] ?? null,
                    'difficulty'    => $q['difficulty'] ?? 'medium',
                    'updated_at'    => now(),
                    'created_at'    => now(),
                ]
            );
            $insertedQuizzes++;
            $byKind[$kind] = ($byKind[$kind] ?? 0) + 1;
        }
        $kindBreakdown = implode(', ', array_map(fn ($k, $v) => "{$k}={$v}", array_keys($byKind), array_values($byKind)));
        $this->info("Quizzes: {$insertedQuizzes} ({$kindBreakdown})" . ($skippedQuizzes ? " — {$skippedQuizzes} skipped" : ''));

        // ─── RICH PER-TOPIC CONTENT ──────────────────────────────
        // overview / concepts / mnemonics / examTips / formulas / regulations / diagrams
        // Topic extras are wiped per-topic before re-insert so re-running the seeder
        // doesn't create N duplicates.
        $tc = $seed['topicContent'] ?? [];
        $insertedConcepts = 0;
        $insertedExtras = 0;
        $updatedOverviews = 0;

        foreach ($tc as $tcRow) {
            $domainId = $tcRow['domain_id'] ?? null;
            $topicKey = $tcRow['topic_key'] ?? null;
            if (!$domainId || !$topicKey) continue;

            $topic = DB::table('topics')
                ->where('domain_id', $domainId)
                ->where('topic_key', $topicKey)
                ->first();
            if (!$topic) continue;

            // Update topic overview (rich HTML) when present
            if (!empty($tcRow['overview'])) {
                DB::table('topics')->where('id', $topic->id)->update([
                    'overview'   => $tcRow['overview'],
                    'updated_at' => now(),
                ]);
                $updatedOverviews++;
            }

            // ─── Concepts (idempotent on title) ─────────────────
            $sortOrder = 0;
            foreach ($tcRow['concepts'] ?? [] as $c) {
                $sortOrder++;
                $title = $c['title'] ?? null;
                if (!$title) continue;
                DB::table('concepts')->updateOrInsert(
                    ['topic_id' => $topic->id, 'title' => $title],
                    [
                        'description' => $c['description'] ?? null,
                        'image_url'   => $c['image'] ?? null,
                        'sort_order'  => $sortOrder,
                        'updated_at'  => now(),
                        'created_at'  => now(),
                    ]
                );
                $insertedConcepts++;
            }

            // ─── Topic extras: wipe + re-insert from seed ───────
            // (the source files are the source of truth — admins can add more in the UI later)
            DB::table('topic_extras')->where('topic_id', $topic->id)->delete();

            // Mnemonics → mnemonic
            foreach ($tcRow['mnemonics'] ?? [] as $i => $m) {
                $payload = [
                    'title' => isset($m['acronym'], $m['title'])
                        ? "{$m['acronym']} — {$m['title']}"
                        : ($m['title'] ?? $m['acronym'] ?? ''),
                    'body'  => $m['description'] ?? '',
                ];
                DB::table('topic_extras')->insert([
                    'topic_id'     => $topic->id,
                    'extra_type'   => 'mnemonic',
                    'content_json' => json_encode($payload, JSON_UNESCAPED_UNICODE),
                    'sort_order'   => $i,
                ]);
                $insertedExtras++;
            }

            // Exam tips → examtip
            foreach ($tcRow['examTips'] ?? [] as $i => $tip) {
                $body = is_array($tip) ? ($tip['body'] ?? json_encode($tip)) : (string) $tip;
                DB::table('topic_extras')->insert([
                    'topic_id'     => $topic->id,
                    'extra_type'   => 'examtip',
                    'content_json' => json_encode(['title' => '', 'body' => $body], JSON_UNESCAPED_UNICODE),
                    'sort_order'   => $i,
                ]);
                $insertedExtras++;
            }

            // Formulas → formula
            foreach ($tcRow['formulas'] ?? [] as $i => $f) {
                if (is_string($f)) {
                    $payload = ['title' => '', 'body' => $f];
                } else {
                    $payload = [
                        'title' => $f['name'] ?? $f['title'] ?? '',
                        'body'  => $f['formula'] ?? $f['description'] ?? json_encode($f),
                    ];
                }
                DB::table('topic_extras')->insert([
                    'topic_id'     => $topic->id,
                    'extra_type'   => 'formula',
                    'content_json' => json_encode($payload, JSON_UNESCAPED_UNICODE),
                    'sort_order'   => $i,
                ]);
                $insertedExtras++;
            }

            // Regulations → regulation
            foreach ($tcRow['regulations'] ?? [] as $i => $r) {
                $body = is_array($r) ? ($r['body'] ?? json_encode($r)) : (string) $r;
                DB::table('topic_extras')->insert([
                    'topic_id'     => $topic->id,
                    'extra_type'   => 'regulation',
                    'content_json' => json_encode(['title' => '', 'body' => $body], JSON_UNESCAPED_UNICODE),
                    'sort_order'   => $i,
                ]);
                $insertedExtras++;
            }

            // Diagrams → diagram (structured object preserved in content_json.diagram)
            foreach ($tcRow['diagrams'] ?? [] as $i => $d) {
                DB::table('topic_extras')->insert([
                    'topic_id'     => $topic->id,
                    'extra_type'   => 'diagram',
                    'content_json' => json_encode([
                        'title'   => $d['title'] ?? '',
                        'diagram' => $d,
                    ], JSON_UNESCAPED_UNICODE),
                    'sort_order'   => $i,
                ]);
                $insertedExtras++;
            }
        }

        $this->info("Topic overviews updated: {$updatedOverviews}");
        $this->info("Concepts: {$insertedConcepts}");
        $this->info("Topic extras (mnemonic/tip/formula/reg/diagram): {$insertedExtras}");

        // ─── EXAM PREP TABLES ──────────────────────────────────
        $insCalc = 0;
        foreach ($seed['calculations'] ?? [] as $c) {
            $key = $c['id'] ?? null;
            if (!$key) continue;
            DB::table('calculations')->updateOrInsert(
                ['calc_key' => $key],
                [
                    'domain_id'      => $c['domain']     ?? null,
                    'category'       => $c['category']   ?? 'General',
                    'difficulty'     => $c['difficulty'] ?? 'easy',
                    'title'          => $c['title']      ?? '',
                    'problem'        => $c['problem']    ?? '',
                    'formula'        => $c['formula']    ?? null,
                    'variables_json' => isset($c['variables']) ? json_encode($c['variables']) : null,
                    'steps_json'     => isset($c['steps']) ? json_encode($c['steps']) : null,
                    'answer'         => isset($c['answer']) ? (float) $c['answer'] : null,
                    'answer_unit'    => $c['answerUnit']  ?? null,
                    'tolerance'      => isset($c['tolerance']) ? (float) $c['tolerance'] : 0.01,
                    'interpretation' => $c['interpretation'] ?? null,
                    'exam_tip'       => $c['examTip']        ?? null,
                    'updated_at'     => now(),
                    'created_at'     => now(),
                ]
            );
            $insCalc++;
        }
        $this->info("Calculations: {$insCalc}");

        $insNums = 0;
        foreach ($seed['criticalNumbers'] ?? [] as $n) {
            $key = $n['id'] ?? null;
            if (!$key) continue;
            DB::table('critical_numbers')->updateOrInsert(
                ['number_key' => $key],
                [
                    'category'   => $n['category'] ?? 'misc',
                    'number'     => $n['number']   ?? '',
                    'label'      => $n['label']    ?? '',
                    'domain_id'  => $n['domain']   ?? null,
                    'standard'   => $n['standard'] ?? null,
                    'memory'     => $n['memory']   ?? null,
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
            $insNums++;
        }
        $this->info("Critical numbers: {$insNums}");

        $insRegs = 0;
        foreach ($seed['regulations'] ?? [] as $r) {
            $key = $r['id'] ?? null;
            if (!$key) continue;
            DB::table('regulations')->updateOrInsert(
                ['reg_key' => $key],
                [
                    'code'                       => $r['code']      ?? '',
                    'short_name'                 => $r['shortName'] ?? ($r['code'] ?? ''),
                    'category'                   => $r['category']  ?? 'General',
                    'domain_id'                  => $r['domain']    ?? null,
                    'covers'                     => $r['covers']    ?? null,
                    'key_numbers_json'           => isset($r['keyNumbers']) ? json_encode($r['keyNumbers']) : null,
                    'common_exam_questions_json' => isset($r['commonExamQuestions']) ? json_encode($r['commonExamQuestions']) : null,
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
            $insRegs++;
        }
        $this->info("Regulations: {$insRegs}");

        $this->line('');
        $this->info('Done.');
        return self::SUCCESS;
    }
}
