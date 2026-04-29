<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class XpEvent extends Model
{
    protected $table = 'xp_events';
    protected $fillable = ['user_id', 'event_type', 'xp_awarded', 'topic_id', 'concept_id', 'meta_json', 'occurred_at'];
    protected $casts = ['meta_json' => 'array', 'occurred_at' => 'datetime'];
}
