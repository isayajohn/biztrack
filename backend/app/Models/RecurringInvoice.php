<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class RecurringInvoice extends Model
{
    use HasUuids;

    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'business_id', 'branch_id', 'customer_id', 'frequency', 'start_date', 'next_run_date',
        'last_run_date', 'end_date', 'payment_method', 'discount', 'tax_rate', 'notes',
        'status', 'generated_count', 'created_by',
    ];

    protected $casts = [
        'start_date' => 'date',
        'next_run_date' => 'date',
        'last_run_date' => 'date',
        'end_date' => 'date',
        'discount' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'generated_count' => 'integer',
    ];

    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function items()
    {
        return $this->hasMany(RecurringInvoiceItem::class);
    }
}
