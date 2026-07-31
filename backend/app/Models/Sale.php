<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Models\Concerns\BelongsToActiveBranch;

class Sale extends Model
{
    use HasUuids, BelongsToActiveBranch;

    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'business_id', 'branch_id', 'customer_id', 'promotion_id', 'product_id', 'receipt_number', 'customer_name',
        'quantity', 'unit_price', 'total_amount', 'discount', 'promotion_discount', 'tax_rate', 'tax_amount', 'paid_amount', 'initial_paid_amount',
        'payment_due_date', 'payment_method', 'sale_date', 'notes', 'created_by',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'discount' => 'decimal:2',
        'promotion_discount' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'initial_paid_amount' => 'decimal:2',
        'payment_due_date' => 'date',
        'sale_date' => 'date',
    ];

    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class)->withDefault();
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function promotion() { return $this->belongsTo(Promotion::class); }

    public function items()
    {
        return $this->hasMany(SaleItem::class);
    }
}
