<?php

namespace App\Data;

use Spatie\TypeScriptTransformer\Attributes\TypeScript;

/**
 * A CSP exam domain (top-level taxonomy node).
 * Returned by /api/domains and embedded in topic responses.
 */
#[TypeScript]
class DomainData
{
    public function __construct(
        public string $id,
        public int $number,
        public string $name,
        public ?string $description,
        public float $weight,
        public string $color_hex,
    ) {
    }
}
