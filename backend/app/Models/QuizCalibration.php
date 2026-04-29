<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Cached calibration statistics for a quiz item, populated by the
 * CalibrateItemBank artisan command from the existing quiz_attempts table.
 *
 * No new logging is required — this just aggregates what's already there.
 *
 * Interpretation:
 *   p_value          0.30–0.85 = good. <0.30 too hard, >0.85 too easy.
 *   discrimination   >0.30 = good item. <0.20 = flag for SME review.
 *   distractor_*     {a: 0.10, b: 0.55, c: 0.25, d: 0.10}.
 *                    Any wrong option <0.05 is a dead distractor.
 */
class QuizCalibration extends Model
{
    protected $table = 'quiz_calibrations';

    protected $fillable = [
        'quiz_id',
        'attempts',
        'p_value',
        'discrimination',
        'distractor_choice_pct',
        'avg_seconds',
        'computed_at',
    ];

    protected $casts = [
        'attempts'              => 'integer',
        'p_value'               => 'float',
        'discrimination'        => 'float',
        'distractor_choice_pct' => 'array',
        'avg_seconds'           => 'float',
        'computed_at'           => 'datetime',
    ];

    public function quiz(): BelongsTo
    {
        return $this->belongsTo(Quiz::class, 'quiz_id');
    }
}
