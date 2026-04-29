<?php

namespace App\Services\Gamification;

use Carbon\Carbon;

class StreakService
{
    public function updateMeaningfulActivity(\App\Models\GamificationProfile $profile): int
    {
        $today = Carbon::today();
        $last = $profile->last_activity_date ? Carbon::parse($profile->last_activity_date) : null;
        if (!$last) {
            $profile->current_streak_days = 1;
        } elseif ($last->isSameDay($today)) {
            // no change
        } elseif ($last->copy()->addDay()->isSameDay($today)) {
            $profile->current_streak_days += 1;
        } else {
            $profile->current_streak_days = 1;
        }
        $profile->last_activity_date = $today->toDateString();
        $profile->longest_streak_days = max((int) $profile->longest_streak_days, (int) $profile->current_streak_days);
        $profile->save();

        // Bonus for milestones
        return match ((int) $profile->current_streak_days) {
            7 => 50,
            14 => 100,
            30 => 250,
            default => 0,
        };
    }
}
