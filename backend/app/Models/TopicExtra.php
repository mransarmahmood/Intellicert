<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TopicExtra extends Model
{
    protected $table = 'topic_extras';

    protected $fillable = [
        'topic_id',
        'extra_type',
        'content_json',
        'sort_order',
    ];

    public $timestamps = false;

    protected function casts(): array
    {
        return ['content_json' => 'array'];
    }
}
