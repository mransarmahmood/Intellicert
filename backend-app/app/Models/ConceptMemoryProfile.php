<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConceptMemoryProfile extends Model
{
    protected $table = 'concept_memory_profiles';

    protected $fillable = [
        'user_id',
        'topic_id',
        'concept_id',
        'mastery_percent',
        'retention_score',
        'forgetting_risk',
        'review_count',
        'streak_days',
        'interval_days',
        'current_stage',
        'last_reviewed_at',
        'next_review_at',
    ];

    protected $casts = [
        'mastery_percent' => 'integer',
        'retention_score' => 'integer',
        'review_count' => 'integer',
        'streak_days' => 'integer',
        'interval_days' => 'integer',
        'current_stage' => 'integer',
        'last_reviewed_at' => 'datetime',
        'next_review_at' => 'datetime',
    ];

    public function concept(): BelongsTo
    {
        return $this->belongsTo(Concept::class, 'concept_id');
    }

    public function topic(): BelongsTo
    {
        return $this->belongsTo(Topic::class, 'topic_id');
    }
}
