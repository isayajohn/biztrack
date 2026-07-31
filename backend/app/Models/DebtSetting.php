<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class DebtSetting extends Model
{
    use HasUuids;

    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'business_id', 'allow_overpayments', 'remind_days_before', 'remind_on_due_date',
        'remind_after_due_repeat_days', 'remind_after_due_max_times', 'enabled_channels',
    ];

    protected $casts = [
        'allow_overpayments' => 'boolean',
        'remind_days_before' => 'array',
        'remind_on_due_date' => 'boolean',
        'remind_after_due_repeat_days' => 'integer',
        'remind_after_due_max_times' => 'integer',
        'enabled_channels' => 'array',
    ];

    public static function defaultsFor(string $businessId): self
    {
        return new self([
            'business_id' => $businessId,
            'allow_overpayments' => false,
            'remind_days_before' => [7, 3, 1],
            'remind_on_due_date' => true,
            'remind_after_due_repeat_days' => 7,
            'remind_after_due_max_times' => 3,
            'enabled_channels' => ['EMAIL', 'IN_APP'],
        ]);
    }

    public function business()
    {
        return $this->belongsTo(Business::class);
    }
}
