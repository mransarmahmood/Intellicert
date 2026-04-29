<?php

namespace App\Services\Gamification;

use App\Models\AchievementEvent;

class AchievementFeedService
{
    public function push(int $userId, string $type, string $title, string $description = '', int $xpDelta = 0, ?int $badgeId = null, ?int $missionId = null, array $meta = []): void
    {
        AchievementEvent::create([
            'user_id' => $userId,
            'event_type' => $type,
            'title' => $title,
            'description' => $description,
            'xp_delta' => $xpDelta,
            'badge_id' => $badgeId,
            'mission_id' => $missionId,
            'meta_json' => $meta,
            'occurred_at' => now(),
        ]);
    }
}
