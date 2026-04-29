<?php

namespace App\Data;

use Spatie\TypeScriptTransformer\Attributes\TypeScript;

/**
 * Flashcard for spaced repetition review.
 */
#[TypeScript]
class FlashcardData
{
    public function __construct(
        public int $id,
        public int $topic_id,
        public string $domain_id,
        public string $front,
        public string $back,
        public ?string $hint,
        public int $sort_order,
    ) {
    }
}
