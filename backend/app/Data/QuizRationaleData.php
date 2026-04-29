<?php

namespace App\Data;

use Spatie\TypeScriptTransformer\Attributes\TypeScript;

/**
 * Rationale payload returned by QuizController::submit AFTER the learner
 * submits an answer. Carries the 4-component rationale standard:
 *   1. Why correct (correct_rationale)
 *   2. Per-option distractor rationales (option_*_rationale)
 *   3. Common trap (concept this is confused with)
 *   4. Memory hook (deep-link to mnemonic/visual on the platform)
 */
#[TypeScript]
class QuizRationaleData
{
    public function __construct(
        public int $quiz_id,
        public bool $is_correct,
        public int $picked_index,
        public int $correct_index,
        public ?string $explanation,
        public ?string $option_a_rationale,
        public ?string $option_b_rationale,
        public ?string $option_c_rationale,
        public ?string $option_d_rationale,
        public ?string $common_trap,
        public ?int $memory_hook_topic_id,
        public ?string $memory_hook_topic_name = null,
    ) {
    }
}
