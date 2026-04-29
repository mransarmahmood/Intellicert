<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MemoryEvent extends Model
{
    protected $table = 'memory_events';

    protected $fillable = [
        'user_id',
        'topic_id',
        'concept_id',
        'flashcard_id',
        'event_type',
        'payload_json',
        'occurred_at',
    ];

    protected $casts = [
        'payload_json' => 'array',
        'occurred_at' => 'datetime',
    ];
}
