<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Model
{
    protected $table = 'users';

    protected $fillable = [
        'email',
        'password_hash',
        'name',
        'role',
        'email_verified',
        'email_verify_code',
        'email_verify_expires',
    ];

    protected $hidden = [
        'password_hash',
        'email_verify_code',
    ];

    protected $casts = [
        'email_verified' => 'boolean',
        'email_verify_expires' => 'datetime',
    ];

    public $timestamps = true;
    const CREATED_AT = 'created_at';
    const UPDATED_AT = 'updated_at';

    public function sessions(): HasMany
    {
        return $this->hasMany(UserSession::class, 'user_id');
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class, 'user_id');
    }

    public function latestSubscription()
    {
        return $this->subscriptions()->orderByDesc('id')->first();
    }
}
