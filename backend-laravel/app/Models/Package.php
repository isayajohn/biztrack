<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Package extends Model
{
    use HasUuids;

    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'name', 'slug', 'description', 'price_monthly', 'price_yearly', 'currency',
        'trial_days', 'max_businesses', 'max_users', 'max_products',
        'max_sales_per_month', 'max_expenses_per_month',
        'allow_reports', 'allow_pdf_export', 'allow_csv_export',
        'allow_inventory_alerts', 'allow_ai_insights', 'status', 'sort_order',
    ];

    protected $casts = [
        'price_monthly' => 'decimal:2',
        'price_yearly' => 'decimal:2',
        'allow_reports' => 'boolean',
        'allow_pdf_export' => 'boolean',
        'allow_csv_export' => 'boolean',
        'allow_inventory_alerts' => 'boolean',
        'allow_ai_insights' => 'boolean',
    ];

    public function subscriptions()
    {
        return $this->hasMany(BusinessSubscription::class);
    }

    public function paymentTransactions()
    {
        return $this->hasMany(PaymentTransaction::class);
    }
}
