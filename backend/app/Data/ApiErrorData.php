<?php

namespace App\Data;

use Spatie\TypeScriptTransformer\Attributes\TypeScript;

/**
 * Generic error response — the shape every endpoint returns on failure.
 */
#[TypeScript]
class ApiErrorData
{
    public function __construct(
        public bool $success,
        public string $error,
        /** Optional structured details for validation errors. */
        public ?array $errors = null,
    ) {
    }
}
