<?php

namespace App\Services\Gamification;

use App\Models\Badge;
use App\Models\UserBadge;
use Illuminate\Support\Facades\DB;

class BadgeService
{
    /** @return array<int, array{id:int,name:string,xp_reward:int}> */
    public function evaluate(int $userId): array
    {
        $awarded = [];
        $badges = Badge::where('is_active', true)->get();
        foreach ($badges as $badge) {
            if (UserBadge::where('user_id', $userId)->where('badge_id', $badge->id)->exists()) continue;
            $criteria = $badge->criteria_json ?? [];
            if ($this->meets($userId, $criteria)) {
                UserBadge::create([
                    'user_id' => $userId,
                    'badge_id' => $badge->id,
                    'awarded_at' => now(),
                ]);
                $awarded[] = ['id' => $badge->id, 'name' => $badge->name, 'xp_reward' => (int) $badge->xp_reward];
            }
        }
        return $awarded;
    }

    private function meets(int $userId, array $criteria): bool
    {
        if (isset($criteria['min_xp'])) {
            $xp = (int) (DB::table('gamification_profiles')->where('user_id', $userId)->value('total_xp') ?? 0);
            if ($xp < (int) $criteria['min_xp']) return false;
        }
        if (isset($criteria['min_streak'])) {
            $streak = (int) (DB::table('gamification_profiles')->where('user_id', $userId)->value('current_streak_days') ?? 0);
            if ($streak < (int) $criteria['min_streak']) return false;
        }
        if (isset($criteria['quiz_accuracy_30d'])) {
            $attempts = (int) DB::table('quiz_attempts')->where('user_id', $userId)->where('taken_at', '>=', now()->subDays(30))->count();
            $correct = (int) DB::table('quiz_attempts')->where('user_id', $userId)->where('taken_at', '>=', now()->subDays(30))->where('correct', 1)->count();
            $acc = $attempts > 0 ? ($correct / $attempts) * 100 : 0;
            if ($acc < (float) $criteria['quiz_accuracy_30d']) return false;
        }
        return true;
    }
}
