<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class DebtPayment extends Model
{
    use HasUuids;

    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'business_id', 'debt_id', 'amount', 'payment_date', 'payment_method',
        'transaction_reference', 'notes', 'recorded_by',
        'reversed_at', 'reversed_by', 'reversal_reason',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'payment_date' => 'date',
        'reversed_at' => 'datetime',
    ];

    public function debt()
    {
        return $this->belongsTo(Debt::class);
    }

    public function recordedBy()
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    public function reversedBy()
    {
        return $this->belongsTo(User::class, 'reversed_by');
    }

    public function attachments()
    {
        return $this->hasMany(DebtAttachment::class);
    }

    public function isReversed(): bool
    {
        return $this->reversed_at !== null;
    }
}
