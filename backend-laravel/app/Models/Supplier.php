<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'business_id',
        'name',
        'phone',
        'email',
        'address',
        'balance',
        'is_active',
    ];

    protected $casts = [
        'balance' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    public function purchaseOrders()
    {
        return $this->hasMany(PurchaseOrder::class);
    }
}
