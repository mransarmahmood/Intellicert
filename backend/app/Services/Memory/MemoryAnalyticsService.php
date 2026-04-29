<?php

namespace App\Services\Memory;

use Illuminate\Support\Facades\DB;

class MemoryAnalyticsService
{
    public function summary(int $userId): array
    {
        $profiles = DB::table('concept_memory_profiles')->where('user_id', $userId);
        $dueToday = (clone $profiles)->whereNotNull('next_review_at')->where('next_review_at', '<=', now())->count();
        $overdue = (clone $profiles)->whereNotNull('next_review_at')->where('next_review_at', '<', now()->subDay())->count();
        $mastered = (clone $profiles)->where('mastery_percent', '>=', 80)->count();
        $weak = (clone $profiles)->where('mastery_percent', '<', 50)->count();
        $retention = (int) round((float) ((clone $profiles)->avg('retention_score') ?? 0));
        $streak = (int) ((clone $profiles)->max('streak_days') ?? 0);

        return [
            'retention_score' => $retention,
            'mastered_concepts' => (int) $mastered,
            'weak_concepts' => (int) $weak,
            'due_today' => (int) $dueToday,
            'overdue' => (int) $overdue,
            'review_streak' => (int) $streak,
        ];
    }
}
