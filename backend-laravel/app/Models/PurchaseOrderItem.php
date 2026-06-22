<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseOrderItem extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'purchase_order_id',
        'product_id',
        'product_name',
        'quantity',
        'received_quantity',
        'unit_price',
        'total_price',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'total_price' => 'decimal:2',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class)->withDefault();
    }

    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class);
    }
}
