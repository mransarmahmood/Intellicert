<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LearningStep extends Model
{
    protected $table = 'learning_steps';

    protected $fillable = [
        'topic_id',
        'step_type',
        'content_json',
    ];

    protected function casts(): array
    {
        return [
            'content_json' => 'array',
        ];
    }

    public $timestamps = true;

    public const STEP_TYPES = [
        'hook', 'try', 'core', 'visual', 'example',
        'memory', 'recall', 'apply', 'teach', 'summary',
    ];
}
