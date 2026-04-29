<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MasteryTopic extends Model
{
    protected $table = 'mastery_topics';

    protected $fillable = [
        'mastery_id', 'mastery_category_code', 'slug', 'name', 'subtitle',
        'primary_blueprint_code', 'secondary_blueprint_code',
        'hook_text', 'learning_objectives_json', 'overview_html',
        'concepts_json', 'worked_example_json', 'field_application_json',
        'mnemonics_json', 'common_pitfalls_json', 'cross_domain_links_json',
        'citations_json', 'flow_steps_json',
        'method_card_json', 'method_card_pdf_path',
        'decision_tree_json', 'decision_tree_svg_path',
        'calculation_sandbox_json', 'application_workshop_json',
        'mastery_threshold', 'requires_calculator', 'is_calculation_topic',
        'defensibility_checklist_json', 'status',
        'sme_reviewed_at', 'sme_reviewed_by_user_id', 'sme_notes',
        'sort_order',
    ];

    protected $casts = [
        'learning_objectives_json'      => 'array',
        'concepts_json'                 => 'array',
        'worked_example_json'           => 'array',
        'field_application_json'        => 'array',
        'mnemonics_json'                => 'array',
        'common_pitfalls_json'          => 'array',
        'cross_domain_links_json'       => 'array',
        'citations_json'                => 'array',
        'flow_steps_json'               => 'array',
        'method_card_json'              => 'array',
        'decision_tree_json'            => 'array',
        'calculation_sandbox_json'      => 'array',
        'application_workshop_json'     => 'array',
        'defensibility_checklist_json'  => 'array',
        'mastery_threshold'             => 'float',
        'requires_calculator'           => 'boolean',
        'is_calculation_topic'          => 'boolean',
        'sme_reviewed_at'               => 'datetime',
        'sort_order'                    => 'integer',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(MasteryCategory::class, 'mastery_category_code', 'code');
    }

    public function items(): HasMany
    {
        return $this->hasMany(MasteryItem::class, 'mastery_topic_id')->orderBy('sort_order');
    }

    /** Convenience scope for surfacing only published topics to learners. */
    public function scopeLive($q)
    {
        return $q->where('status', 'mastery_gold');
    }
}
