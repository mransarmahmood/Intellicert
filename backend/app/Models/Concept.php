<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Concept extends Model
{
    protected $table = 'concepts';

    protected $fillable = [
        'topic_id',
        'title',
        'description',
        'image_url',
        'sort_order',
    ];

    public $timestamps = true;
}
