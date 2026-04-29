<?php

namespace App\Data;

use Spatie\TypeScriptTransformer\Attributes\TypeScript;

/**
 * A quiz question with multiple-choice options.
 *
 * Per-option rationales (option_a_rationale … option_d_rationale),
 * common_trap, and memory_hook_topic_id are intentionally NOT included
 * in the listing/feed payload — they're returned only after the learner
 * submits an answer (see QuizController::submit). This prevents
 * rationale leakage in the question list.
 */
#[TypeScript]
class QuizData
{
    public function __construct(
        public int $id,
        public int $topic_id,
        public string $domain_id,
        public string $question,
        /** @var string[] */
        public array $options,
        public int $correct_index,
        public ?string $explanation,
        public string $difficulty,
        public ?int $bloom_level = null,
        public ?string $sub_domain_code = null,
        public ?string $source_reference = null,
        public string $status = 'live',
    ) {
    }
}
