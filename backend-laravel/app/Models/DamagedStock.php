<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DamagedStock extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'business_id',
        'product_id',
        'quantity',
        'reason',
        'comment',
        'status',
        'approved_by',
        'approved_at',
        'created_by',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class)->withDefault();
    }
}
