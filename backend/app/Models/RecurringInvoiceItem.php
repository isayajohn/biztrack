<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class RecurringInvoiceItem extends Model
{
    use HasUuids;

    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['recurring_invoice_id', 'product_id', 'quantity', 'unit_price'];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
    ];

    public function recurringInvoice()
    {
        return $this->belongsTo(RecurringInvoice::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class)->withDefault();
    }
}
