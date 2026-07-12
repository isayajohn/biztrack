<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Models\Concerns\BelongsToActiveBranch;

class Expense extends Model
{
    use HasUuids, BelongsToActiveBranch;

    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['business_id', 'branch_id', 'category', 'description', 'amount', 'payment_method', 'expense_date', 'notes'];

    protected $casts = [
        'amount' => 'decimal:2',
        'expense_date' => 'date',
    ];

    public function business()
    {
        return $this->belongsTo(Business::class);
    }
}
