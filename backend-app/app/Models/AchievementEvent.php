<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AchievementEvent extends Model
{
    protected $table = 'achievement_events';
    protected $fillable = [
        'user_id', 'event_type', 'title', 'description', 'badge_id', 'mission_id',
        'xp_delta', 'meta_json', 'occurred_at',
    ];
    protected $casts = ['meta_json' => 'array', 'occurred_at' => 'datetime'];
}
