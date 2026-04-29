<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserFlashcardReview extends Model
{
    protected $table = 'user_flashcard_reviews';

    protected $fillable = [
        'user_id',
        'flashcard_id',
        'quality',
        'recall_score',
        'correct',
        'interval_days',
        'stage',
        'reviewed_at',
        'next_review_at',
    ];

    protected $casts = [
        'quality' => 'integer',
        'recall_score' => 'integer',
        'correct' => 'boolean',
        'interval_days' => 'integer',
        'stage' => 'integer',
        'reviewed_at' => 'datetime',
        'next_review_at' => 'datetime',
    ];

    public function flashcard(): BelongsTo
    {
        return $this->belongsTo(Flashcard::class, 'flashcard_id');
    }
}
