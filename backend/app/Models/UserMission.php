<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserMission extends Model
{
    protected $table = 'user_missions';
    protected $fillable = [
        'user_id', 'mission_id', 'window_start', 'window_end', 'progress_count', 'target_count',
        'status', 'completed_at', 'claimed_at',
    ];
    protected $casts = [
        'window_start' => 'date',
        'window_end' => 'date',
        'completed_at' => 'datetime',
        'claimed_at' => 'datetime',
    ];
}
