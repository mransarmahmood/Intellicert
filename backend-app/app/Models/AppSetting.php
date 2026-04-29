<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppSetting extends Model
{
    protected $table = 'app_settings';
    protected $primaryKey = 'setting_key';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['setting_key', 'setting_value'];

    public $timestamps = true;
    const CREATED_AT = null;
    const UPDATED_AT = 'updated_at';
}
