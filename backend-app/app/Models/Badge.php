<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Badge extends Model
{
    protected $table = 'badges';
    protected $fillable = ['code', 'name', 'category', 'description', 'icon', 'xp_reward', 'criteria_json', 'is_active'];
    protected $casts = ['criteria_json' => 'array', 'is_active' => 'boolean'];
}
