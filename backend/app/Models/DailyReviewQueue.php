<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DailyReviewQueue extends Model
{
    protected $table = 'daily_review_queues';

    protected $fillable = [
        'user_id',
        'queue_date',
        'concept_id',
        'flashcard_id',
        'status',
        'priority',
    ];

    protected $casts = [
        'queue_date' => 'date',
        'priority' => 'integer',
    ];

    public function concept(): BelongsTo
    {
        return $this->belongsTo(Concept::class, 'concept_id');
    }

    public function flashcard(): BelongsTo
    {
        return $this->belongsTo(Flashcard::class, 'flashcard_id');
    }
}
