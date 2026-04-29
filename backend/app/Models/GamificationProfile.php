<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GamificationProfile extends Model
{
    protected $table = 'gamification_profiles';

    protected $fillable = [
        'user_id',
        'total_xp',
        'current_level',
        'level_title',
        'xp_to_next_level',
        'level_progress_percent',
        'current_streak_days',
        'longest_streak_days',
        'last_activity_date',
        'readiness_score',
    ];
}
