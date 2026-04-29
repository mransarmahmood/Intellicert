<?php

namespace App\Data;

use Spatie\TypeScriptTransformer\Attributes\TypeScript;

/**
 * A learnable concept inside a topic.
 * Returned by /api/concepts and inside topic detail responses.
 */
#[TypeScript]
class ConceptData
{
    public function __construct(
        public int $id,
        public string $title,
        public ?string $description,
        public ?string $image_url,
        public int $sort_order,
    ) {
    }
}
