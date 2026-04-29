<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Flashcard extends Model
{
    protected $table = 'flashcards';

    protected $fillable = [
        'card_key',
        'domain_id',
        'concept_id',
        'source',
        'card_type',
        'front',
        'back',
        'image_url',
    ];

    public $timestamps = true;

    public function domain(): BelongsTo
    {
        return $this->belongsTo(Domain::class, 'domain_id');
    }
}
