<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class PaymentTransaction extends Model
{
    use HasUuids;

    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'business_id', 'package_id', 'subscription_id', 'status', 'billing_cycle',
        'amount', 'currency', 'provider', 'external_id', 'provider_reference',
        'checkout_url', 'raw_request', 'raw_response', 'paid_at', 'failed_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'raw_request' => 'array',
        'raw_response' => 'array',
        'paid_at' => 'datetime',
        'failed_at' => 'datetime',
    ];

    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function package()
    {
        return $this->belongsTo(Package::class);
    }
}
