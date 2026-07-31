<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SaleItem extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'sale_id',
        'product_id',
        'product_name',
        'quantity',
        'buying_price',
        'selling_price',
        'discount',
        'profit',
        'total',
    ];

    protected $casts = [
        'buying_price' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'discount' => 'decimal:2',
        'profit' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class)->withDefault();
    }

    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }
}
