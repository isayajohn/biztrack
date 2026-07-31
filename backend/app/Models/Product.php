<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Product extends Model
{
    use HasUuids;

    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'business_id', 'name', 'sku', 'barcode', 'brand', 'brand_id', 'unit_type',
        'category_id', 'supplier_id', 'buying_price', 'selling_price',
        'stock_quantity', 'low_stock_level', 'reorder_point',
        'expiry_date', 'image_url', 'notes', 'is_active',
    ];

    protected $casts = [
        'buying_price' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'is_active' => 'boolean',
        'expiry_date' => 'date',
        'reorder_point' => 'integer',
    ];

    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function sales()
    {
        return $this->hasMany(Sale::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class)->withDefault();
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class)->withDefault();
    }

    public function managedBrand()
    {
        return $this->belongsTo(Brand::class, 'brand_id');
    }

    public function stockMovements()
    {
        return $this->hasMany(StockMovement::class);
    }
}
