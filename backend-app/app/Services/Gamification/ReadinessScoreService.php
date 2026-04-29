<?php

namespace App\Services\Gamification;

use Illuminate\Support\Facades\DB;

class ReadinessScoreService
{
    public function forUser(int $userId): int
    {
        $retention = (float) (DB::table('concept_memory_profiles')->where('user_id', $userId)->avg('retention_score') ?? 0);
        $mastery = (float) (DB::table('concept_memory_profiles')->where('user_id', $userId)->avg('mastery_percent') ?? 0);
        $qAttempts = (int) DB::table('quiz_attempts')->where('user_id', $userId)->where('taken_at', '>=', now()->subDays(30))->count();
        $qCorrect = (int) DB::table('quiz_attempts')->where('user_id', $userId)->where('taken_at', '>=', now()->subDays(30))->where('correct', 1)->count();
        $qAcc = $qAttempts > 0 ? ($qCorrect / $qAttempts) * 100 : 0;
        $score = (int) round(($retention * 0.35) + ($mastery * 0.35) + ($qAcc * 0.30));
        return max(0, min(100, $score));
    }
}
