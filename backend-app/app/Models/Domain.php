<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Domain extends Model
{
    protected $table = 'domains';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'number',
        'name',
        'short_name',
        'weight',
        'color_hex',
        'icon',
        'description',
    ];

    public $timestamps = true;
}
