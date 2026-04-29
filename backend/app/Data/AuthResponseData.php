<?php

namespace App\Data;

use Spatie\TypeScriptTransformer\Attributes\TypeScript;

/**
 * Response shape for /api/auth/login and /api/auth/register.
 */
#[TypeScript]
class AuthResponseData
{
    public function __construct(
        public bool $success,
        public ?string $token,
        public ?UserData $user,
        public ?SubscriptionData $subscription,
        public ?string $error = null,
    ) {
    }
}
