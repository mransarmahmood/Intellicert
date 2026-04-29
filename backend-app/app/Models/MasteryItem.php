<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MasteryItem extends Model
{
    protected $table = 'mastery_items';

    protected $fillable = [
        'mastery_topic_id', 'item_kind', 'cognitive_level',
        'stem', 'options_json', 'correct_index', 'calculation_inputs_json',
        'correct_rationale', 'option_rationales_json', 'common_trap',
        'memory_hook', 'bloom_level', 'source_reference', 'status', 'sort_order',
    ];

    protected $casts = [
        'options_json'             => 'array',
        'calculation_inputs_json'  => 'array',
        'option_rationales_json'   => 'array',
        'correct_index'            => 'integer',
        'bloom_level'              => 'integer',
        'sort_order'               => 'integer',
    ];

    public function topic(): BelongsTo
    {
        return $this->belongsTo(MasteryTopic::class, 'mastery_topic_id');
    }
}
