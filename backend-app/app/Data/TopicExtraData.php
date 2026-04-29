<?php

namespace App\Data;

use Spatie\TypeScriptTransformer\Attributes\TypeScript;

/**
 * An auxiliary content item attached to a topic — mnemonic, exam tip,
 * formula, regulation, chapter reference, or diagram.
 */
#[TypeScript]
class TopicExtraData
{
    public function __construct(
        public int $id,
        public string $extra_type,
        public mixed $content_json,
    ) {
    }
}
