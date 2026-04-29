<?php

namespace App\Services\Gamification;

use App\Models\GamificationProfile;

class GamificationProfileService
{
    public function __construct(
        private readonly LevelService $levels,
        private readonly ReadinessScoreService $readiness,
    ) {}

    public function getOrCreate(int $userId): GamificationProfile
    {
        return GamificationProfile::firstOrCreate(
            ['user_id' => $userId],
            [
                'total_xp' => 0,
                'current_level' => 1,
                'level_title' => 'Foundation Learner',
                'xp_to_next_level' => 100,
                'level_progress_percent' => 0,
                'current_streak_days' => 0,
                'longest_streak_days' => 0,
                'readiness_score' => 0,
            ]
        );
    }

    public function addXp(int $userId, int $delta): GamificationProfile
    {
        $profile = $this->getOrCreate($userId);
        $profile->total_xp = max(0, (int) $profile->total_xp + $delta);
        $lvl = $this->levels->fromXp((int) $profile->total_xp);
        $profile->current_level = $lvl['level'];
        $profile->level_title = $lvl['title'];
        $profile->level_progress_percent = $lvl['progress_percent'];
        $profile->xp_to_next_level = $lvl['xp_to_next'];
        $profile->readiness_score = $this->readiness->forUser($userId);
        $profile->save();
        return $profile->fresh();
    }
}
