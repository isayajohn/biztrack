<?php

namespace App\Services;

use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Support\Str;

class StockService
{
    /**
     * Record a stock movement and update the product's stock quantity.
     *
     * @param  Product  $product       The product (should be fresh before calling).
     * @param  string   $movementType  One of STOCK_IN, STOCK_OUT, SALE, PURCHASE, RETURN, DAMAGED, EXPIRED, TRANSFER, ADJUSTMENT.
     * @param  int      $quantity      Positive for stock in, negative for stock out.
     * @param  string|null $referenceType  e.g. 'sale', 'purchase', 'adjustment', 'damaged_stock'
     * @param  string|null $referenceId    UUID of the related record.
     * @param  string|null $reason         Human-readable reason.
     * @param  string|null $createdBy      UUID of the user performing the action.
     */
    public static function recordMovement(
        Product $product,
        string $movementType,
        int $quantity,
        ?string $referenceType = null,
        ?string $referenceId = null,
        ?string $reason = null,
        ?string $createdBy = null
    ): StockMovement {
        $before = (int) $product->stock_quantity;
        $after = $before + $quantity;
        if ($after < 0) {
            $after = 0;
        }

        $movement = StockMovement::create([
            'id'             => Str::uuid()->toString(),
            'business_id'    => $product->business_id,
            'product_id'     => $product->id,
            'movement_type'  => $movementType,
            'quantity'       => $quantity,
            'stock_before'   => $before,
            'stock_after'    => $after,
            'reference_type' => $referenceType,
            'reference_id'   => $referenceId,
            'reason'         => $reason,
            'created_by'     => $createdBy,
        ]);

        $product->update(['stock_quantity' => $after]);

        return $movement;
    }
}
