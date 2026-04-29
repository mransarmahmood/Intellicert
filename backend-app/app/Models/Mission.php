<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Mission extends Model
{
    protected $table = 'missions';
    protected $fillable = ['code', 'name', 'type', 'event_type', 'target_count', 'xp_reward', 'rules_json', 'is_active'];
    protected $casts = ['rules_json' => 'array', 'is_active' => 'boolean'];
}
