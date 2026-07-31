<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Promotion extends Model
{
    use HasUuids;
    protected $fillable = ['business_id', 'name', 'code', 'type', 'value', 'minimum_purchase', 'maximum_discount', 'starts_at', 'ends_at', 'usage_limit', 'times_used', 'is_active'];
    protected $casts = ['value' => 'decimal:2', 'minimum_purchase' => 'decimal:2', 'maximum_discount' => 'decimal:2', 'starts_at' => 'datetime', 'ends_at' => 'datetime', 'is_active' => 'boolean'];

    public function isAvailable(float $subtotal): bool
    {
        return $this->is_active && now()->between($this->starts_at, $this->ends_at)
            && $subtotal >= (float) $this->minimum_purchase
            && ($this->usage_limit === null || $this->times_used < $this->usage_limit);
    }

    public function discountFor(float $subtotal): float
    {
        $discount = $this->type === 'PERCENTAGE' ? $subtotal * (float) $this->value / 100 : (float) $this->value;
        if ($this->maximum_discount !== null) $discount = min($discount, (float) $this->maximum_discount);
        return round(min($subtotal, $discount), 2);
    }
}
