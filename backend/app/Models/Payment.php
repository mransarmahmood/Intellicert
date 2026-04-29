<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    protected $table = 'payments';

    protected $fillable = [
        'user_id', 'subscription_id', 'amount', 'currency',
        'payment_method', 'transaction_id', 'status', 'coupon_code',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public $timestamps = false;
    const CREATED_AT = 'created_at';

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
