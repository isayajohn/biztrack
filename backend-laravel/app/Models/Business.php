<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Business extends Model
{
    use HasUuids;

    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['user_id', 'name', 'currency', 'country', 'tax_name', 'tax_number', 'default_tax_rate'];

    protected $casts = ['default_tax_rate' => 'decimal:2'];

    public static function forUser(?User $user): ?self
    {
        if (!$user) return null;
        $owned = static::where('user_id', $user->id)->first();
        if ($owned) return $owned;
        return static::whereHas('memberships', fn ($query) => $query->where('user_id', $user->id)->where('status', 'ACTIVE'))->first();
    }

    public function branchIdForUser(User $user, ?string $requested = null): ?string
    {
        $membership = $this->memberships()->where('user_id', $user->id)->where('status', 'ACTIVE')->first();
        if ($membership?->branch_id) return $membership->branch_id;
        if ($requested && $this->branches()->where('id', $requested)->where('is_active', true)->exists()) return $requested;
        return $this->branches()->where('is_default', true)->value('id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    public function sales()
    {
        return $this->hasMany(Sale::class);
    }

    public function expenses()
    {
        return $this->hasMany(Expense::class);
    }

    public function customers()
    {
        return $this->hasMany(Customer::class);
    }

    public function brands()
    {
        return $this->hasMany(Brand::class);
    }

    public function branches() { return $this->hasMany(Branch::class); }
    public function memberships() { return $this->hasMany(BusinessMembership::class); }

    public function subscriptions()
    {
        return $this->hasMany(BusinessSubscription::class);
    }

    public function paymentTransactions()
    {
        return $this->hasMany(PaymentTransaction::class);
    }

    public function activeSubscription()
    {
        return $this->hasOne(BusinessSubscription::class)
            ->whereIn('status', ['TRIAL', 'ACTIVE'])
            ->latest('starts_at');
    }
}
