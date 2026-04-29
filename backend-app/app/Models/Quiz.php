<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Quiz extends Model
{
    protected $table = 'quizzes';

    protected $fillable = [
        'quiz_key',
        'domain_id',
        'question',
        'option_a',
        'option_b',
        'option_c',
        'option_d',
        'correct_index',
        'explanation',
        // Track 1 — kind / topic_key / difficulty already added in 2026_04_09_000005
        'kind',
        'topic_key',
        'difficulty',
        // Track 1 — 4-component rationale standard
        'option_a_rationale',
        'option_b_rationale',
        'option_c_rationale',
        'option_d_rationale',
        'common_trap',
        'memory_hook_topic_id',
        'bloom_level',
        'sub_domain_code',
        'status',
        'source_reference',
        'last_reviewed_at',
        'last_reviewed_by_user_id',
    ];

    protected $casts = [
        'correct_index'            => 'integer',
        'memory_hook_topic_id'     => 'integer',
        'bloom_level'              => 'integer',
        'last_reviewed_at'         => 'datetime',
        'last_reviewed_by_user_id' => 'integer',
    ];

    public $timestamps = true;

    public function domain(): BelongsTo
    {
        return $this->belongsTo(Domain::class, 'domain_id');
    }

    public function memoryHookTopic(): BelongsTo
    {
        return $this->belongsTo(Topic::class, 'memory_hook_topic_id');
    }

    public function calibration(): HasOne
    {
        return $this->hasOne(QuizCalibration::class, 'quiz_id');
    }
}
