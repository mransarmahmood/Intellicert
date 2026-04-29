<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MasteryCategory extends Model
{
    protected $table = 'mastery_categories';

    protected $fillable = [
        'code', 'name', 'short_name', 'description',
        'topic_count_target', 'priority', 'sort_order',
    ];

    protected $casts = [
        'topic_count_target' => 'integer',
        'sort_order'         => 'integer',
    ];

    public function topics(): HasMany
    {
        return $this->hasMany(MasteryTopic::class, 'mastery_category_code', 'code')
            ->orderBy('sort_order');
    }
}
