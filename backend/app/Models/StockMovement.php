<?php

namespace App\Models;
use App\Models\Concerns\BelongsToActiveBranch;

use Illuminate\Database\Eloquent\Model;

class StockMovement extends Model
{
    use BelongsToActiveBranch;
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'business_id',
        'branch_id',
        'product_id',
        'movement_type',
        'quantity',
        'stock_before',
        'stock_after',
        'reference_type',
        'reference_id',
        'reason',
        'created_by',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class)->withDefault();
    }
}
