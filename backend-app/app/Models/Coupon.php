<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Coupon extends Model
{
    protected $table = 'coupons';

    protected $fillable = [
        'code',
        'discount_type',
        'discount_value',
        'plan_type',
        'max_uses',
        'used_count',
        'valid_from',
        'valid_until',
        'created_by',
        'is_active',
        'is_gift',
        'recipient_email',
        'recipient_name',
        'sender_name',
        'gift_message',
        'redeemed_at',
        'redeemed_by_user_id',
    ];

    protected $casts = [
        'discount_value' => 'decimal:2',
        'max_uses'   => 'integer',
        'used_count' => 'integer',
        'valid_from'  => 'datetime',
        'valid_until' => 'datetime',
        'is_active'  => 'boolean',
        'is_gift'    => 'boolean',
        'redeemed_at' => 'datetime',
    ];

    public $timestamps = false;
}
