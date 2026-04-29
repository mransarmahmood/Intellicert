<?php

// In production, set CORS_ALLOWED_ORIGINS to a comma-separated list:
//   CORS_ALLOWED_ORIGINS="https://intellicert.com,https://www.intellicert.com"
//
// In dev (no env var set), allow ANY localhost / 127.0.0.1 origin regardless
// of port — Vite hops between 5174/5175/5176/5177/... when ports are taken.

$origins = env('CORS_ALLOWED_ORIGINS');

if ($origins) {
    $allowed         = array_map('trim', explode(',', $origins));
    $allowedPatterns = [];
} else {
    $allowed         = [];
    $allowedPatterns = [
        '#^https?://localhost(:\d+)?$#',
        '#^https?://127\.0\.0\.1(:\d+)?$#',
    ];
}

return [
    'paths' => ['api/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => $allowed,
    'allowed_origins_patterns' => $allowedPatterns,
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
