<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Models\Concerns\BelongsToActiveBranch;

class Debt extends Model
{
    use HasUuids, BelongsToActiveBranch;

    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'business_id', 'branch_id', 'debt_number', 'type', 'customer_id', 'supplier_id',
        'sale_id', 'purchase_order_id', 'source', 'original_amount', 'total_paid', 'outstanding_balance',
        'debt_date', 'due_date', 'description', 'notes', 'status', 'created_by',
    ];

    protected $casts = [
        'original_amount' => 'decimal:2',
        'total_paid' => 'decimal:2',
        'outstanding_balance' => 'decimal:2',
        'debt_date' => 'date',
        'due_date' => 'date',
    ];

    public const TERMINAL_MANUAL_STATUSES = ['DISPUTED', 'WRITTEN_OFF', 'CANCELLED'];

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

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }

    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function payments()
    {
        return $this->hasMany(DebtPayment::class);
    }

    public function attachments()
    {
        return $this->hasMany(DebtAttachment::class);
    }

    public function reminders()
    {
        return $this->hasMany(DebtReminder::class);
    }

    public function isOverdue(): bool
    {
        return $this->due_date !== null
            && $this->due_date->isPast()
            && (float) $this->outstanding_balance > 0
            && !in_array($this->status, self::TERMINAL_MANUAL_STATUSES, true)
            && $this->status !== 'PAID';
    }

    /**
     * Recompute outstanding_balance and derive status from total_paid/due_date.
     * Does not persist — caller is responsible for save()/update().
     */
    public function recalculateBalance(): void
    {
        $this->outstanding_balance = round((float) $this->original_amount - (float) $this->total_paid, 2);

        if (in_array($this->status, self::TERMINAL_MANUAL_STATUSES, true)) {
            return;
        }

        if ($this->outstanding_balance <= 0) {
            $this->status = 'PAID';
        } elseif ((float) $this->total_paid > 0) {
            $this->status = 'PARTIALLY_PAID';
        } elseif ($this->due_date && $this->due_date->isPast()) {
            $this->status = 'OVERDUE';
        } elseif ($this->status !== 'DRAFT') {
            $this->status = 'ACTIVE';
        }
    }
}
