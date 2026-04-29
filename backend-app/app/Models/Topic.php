<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Topic extends Model
{
    protected $table = 'topics';

    protected $fillable = [
        'topic_key',
        'domain_id',
        'name',
        'subtitle',
        'icon',
        'overview',
        'image_url',
        'sort_order',
        // Track 1 — 9-layer anatomy fields
        'hook_text',
        'hook_image_url',
        'learning_objectives_json',
        'worked_example_json',
        'field_application_json',
        'mastery_threshold',
    ];

    protected $casts = [
        'sort_order'               => 'integer',
        'learning_objectives_json' => 'array',
        'worked_example_json'      => 'array',
        'field_application_json'   => 'array',
        'mastery_threshold'        => 'float',
    ];

    public $timestamps = true;

    public function domain(): BelongsTo
    {
        return $this->belongsTo(Domain::class, 'domain_id');
    }

    public function concepts(): HasMany
    {
        return $this->hasMany(Concept::class, 'topic_id')->orderBy('sort_order');
    }

    public function extras(): HasMany
    {
        return $this->hasMany(TopicExtra::class, 'topic_id')->orderBy('sort_order');
    }
}
