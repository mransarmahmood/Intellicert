<?php

namespace App\Services\Memory;

use App\Models\ConceptMemoryProfile;

class MemoryProfileService
{
    public function initialize(int $userId, int $topicId, int $conceptId): ConceptMemoryProfile
    {
        return ConceptMemoryProfile::firstOrCreate(
            ['user_id' => $userId, 'concept_id' => $conceptId],
            [
                'topic_id' => $topicId,
                'mastery_percent' => 20,
                'retention_score' => 35,
                'forgetting_risk' => 'moderate',
                'review_count' => 0,
                'streak_days' => 0,
                'current_stage' => 0,
                'interval_days' => 0,
                'next_review_at' => now(),
            ]
        );
    }

    public function updateAfterReview(ConceptMemoryProfile $profile, int $recallScore, int $stage, int $intervalDays, string $risk): ConceptMemoryProfile
    {
        $reviews = $profile->review_count + 1;
        $mastery = min(100, max(0, (int) round(($profile->mastery_percent * 0.6) + ($recallScore * 0.4))));
        $retention = min(100, max(0, (int) round(($profile->retention_score * 0.5) + ($recallScore * 0.5))));

        $profile->update([
            'review_count' => $reviews,
            'mastery_percent' => $mastery,
            'retention_score' => $retention,
            'forgetting_risk' => $risk,
            'current_stage' => $stage,
            'interval_days' => $intervalDays,
            'last_reviewed_at' => now(),
            'next_review_at' => now()->addDays($intervalDays),
        ]);

        return $profile->fresh();
    }
}
