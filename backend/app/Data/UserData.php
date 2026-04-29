<?php

namespace App\Data;

use Spatie\TypeScriptTransformer\Attributes\TypeScript;

/**
 * Shape of the user object returned by /api/auth/login, /api/auth/me,
 * and embedded inside many other API responses.
 *
 * Keep in sync with App\Http\Controllers\AuthController::respondWithUser().
 */
#[TypeScript]
class UserData
{
    public function __construct(
        public int $id,
        public string $email,
        public string $name,
        public string $role,
        public bool $email_verified,
    ) {
    }
}
