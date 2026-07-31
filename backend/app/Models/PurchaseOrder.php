<?php

namespace App\Models;
use App\Models\Concerns\BelongsToActiveBranch;

use Illuminate\Database\Eloquent\Model;

class PurchaseOrder extends Model
{
    use BelongsToActiveBranch;
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'business_id',
        'branch_id',
        'supplier_id',
        'order_number',
        'total_amount',
        'paid_amount',
        'status',
        'expected_date',
        'received_date',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'expected_date' => 'date',
        'received_date' => 'date',
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class)->withDefault();
    }

    public function items()
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }
}
