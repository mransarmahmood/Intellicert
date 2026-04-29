<?php

namespace App\Data;

use Spatie\TypeScriptTransformer\Attributes\TypeScript;

/**
 * A user's active subscription (if any).
 * Returned by /api/auth/login, /api/auth/me, /api/subscriptions.
 */
#[TypeScript]
class SubscriptionData
{
    public function __construct(
        public ?string $plan,
        public ?string $status,
        public ?string $expires_at,
        public ?int $days_remaining,
    ) {
    }
}
