<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Product;
use App\Models\StockAdjustment;
use App\Models\StockMovement;
use App\Services\StockService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class StockController extends Controller
{
    private function getBusiness(): ?Business
    {
        return Business::where('user_id', auth()->id())->first();
    }

    public function stockIn(Request $request): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) {
            return response()->json(['success' => false, 'error' => 'Business not found'], 404);
        }

        $data = $request->validate([
            'productId' => 'required|uuid',
            'quantity'  => 'required|integer|min:1',
            'reason'    => 'nullable|string|max:1000',
        ]);

        $product = Product::where('id', $data['productId'])
            ->where('business_id', $business->id)
            ->first();

        if (!$product) {
            return response()->json(['success' => false, 'error' => 'Product not found'], 404);
        }

        $movement = StockService::recordMovement(
            $product,
            'STOCK_IN',
            (int) $data['quantity'],
            'manual',
            null,
            $data['reason'] ?? null,
            auth()->id()
        );

        $product = $product->fresh();

        return response()->json([
            'success' => true,
            'data' => [
                'movement'   => $this->formatMovement($movement->load('product')),
                'product'    => [
                    'id'            => $product->id,
                    'name'          => $product->name,
                    'stockQuantity' => $product->stock_quantity,
                ],
            ],
        ], 201);
    }

    public function stockOut(Request $request): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) {
            return response()->json(['success' => false, 'error' => 'Business not found'], 404);
        }

        $data = $request->validate([
            'productId' => 'required|uuid',
            'quantity'  => 'required|integer|min:1',
            'reason'    => 'nullable|string|max:1000',
        ]);

        $product = Product::where('id', $data['productId'])
            ->where('business_id', $business->id)
            ->first();

        if (!$product) {
            return response()->json(['success' => false, 'error' => 'Product not found'], 404);
        }

        if ($product->stock_quantity < $data['quantity']) {
            return response()->json([
                'success' => false,
                'error'   => "Insufficient stock. Available: {$product->stock_quantity}, Requested: {$data['quantity']}",
            ], 400);
        }

        $movement = StockService::recordMovement(
            $product,
            'STOCK_OUT',
            -(int) $data['quantity'],
            'manual',
            null,
            $data['reason'] ?? null,
            auth()->id()
        );

        $product = $product->fresh();

        return response()->json([
            'success' => true,
            'data' => [
                'movement' => $this->formatMovement($movement->load('product')),
                'product'  => [
                    'id'            => $product->id,
                    'name'          => $product->name,
                    'stockQuantity' => $product->stock_quantity,
                ],
            ],
        ], 201);
    }

    public function getMovements(Request $request): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) {
            return response()->json(['success' => true, 'data' => ['movements' => [], 'total' => 0]]);
        }

        $query = StockMovement::where('business_id', $business->id)->with('product');

        if ($request->filled('productId')) {
            $query->where('product_id', $request->productId);
        }

        if ($request->filled('movementType')) {
            $query->where('movement_type', $request->movementType);
        }

        if ($request->filled('startDate')) {
            $query->whereDate('created_at', '>=', $request->startDate);
        }

        if ($request->filled('endDate')) {
            $query->whereDate('created_at', '<=', $request->endDate);
        }

        $total = $query->count();
        $page  = (int) $request->get('page', 1);
        $limit = (int) $request->get('limit', 50);

        $movements = $query->orderByDesc('created_at')
            ->skip(($page - 1) * $limit)
            ->take($limit)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'movements' => $movements->map(fn($m) => $this->formatMovement($m)),
                'total'     => $total,
                'page'      => $page,
                'limit'     => $limit,
            ],
        ]);
    }

    public function getLowStock(): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) {
            return response()->json(['success' => true, 'data' => ['products' => [], 'total' => 0]]);
        }

        $products = Product::where('business_id', $business->id)
            ->where('is_active', true)
            ->whereRaw('stock_quantity <= reorder_point')
            ->with(['category', 'supplier'])
            ->orderBy('stock_quantity')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'products' => $products->map(fn($p) => [
                    'id'            => $p->id,
                    'name'          => $p->name,
                    'sku'           => $p->sku,
                    'stockQuantity' => $p->stock_quantity,
                    'reorderPoint'  => $p->reorder_point,
                    'category'      => $p->category?->id ? ['id' => $p->category->id, 'name' => $p->category->name] : null,
                    'supplier'      => $p->supplier?->id ? ['id' => $p->supplier->id, 'name' => $p->supplier->name] : null,
                ]),
                'total' => $products->count(),
            ],
        ]);
    }

    public function getExpired(): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) {
            return response()->json(['success' => true, 'data' => ['products' => [], 'total' => 0]]);
        }

        $threshold = now()->addDays(30);

        $products = Product::where('business_id', $business->id)
            ->whereNotNull('expiry_date')
            ->where('expiry_date', '<=', $threshold)
            ->with(['category', 'supplier'])
            ->orderBy('expiry_date')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'products' => $products->map(fn($p) => [
                    'id'            => $p->id,
                    'name'          => $p->name,
                    'sku'           => $p->sku,
                    'stockQuantity' => $p->stock_quantity,
                    'expiryDate'    => $p->expiry_date?->format('Y-m-d'),
                    'isExpired'     => $p->expiry_date?->isPast(),
                    'category'      => $p->category?->id ? ['id' => $p->category->id, 'name' => $p->category->name] : null,
                    'supplier'      => $p->supplier?->id ? ['id' => $p->supplier->id, 'name' => $p->supplier->name] : null,
                ]),
                'total' => $products->count(),
            ],
        ]);
    }

    public function createAdjustment(Request $request): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) {
            return response()->json(['success' => false, 'error' => 'Business not found'], 404);
        }

        $data = $request->validate([
            'productId'     => 'required|uuid',
            'physicalCount' => 'required|integer|min:0',
            'reason'        => 'nullable|string|max:1000',
        ]);

        $product = Product::where('id', $data['productId'])
            ->where('business_id', $business->id)
            ->first();

        if (!$product) {
            return response()->json(['success' => false, 'error' => 'Product not found'], 404);
        }

        $systemStock   = (int) $product->stock_quantity;
        $physicalCount = (int) $data['physicalCount'];
        $difference    = $physicalCount - $systemStock;

        // Determine adjustment type
        if ($difference > 0) {
            $adjustmentType = 'ADD';
        } elseif ($difference < 0) {
            $adjustmentType = 'REDUCE';
        } else {
            $adjustmentType = 'SET';
        }

        $adjustment = StockAdjustment::create([
            'id'              => Str::uuid()->toString(),
            'business_id'     => $business->id,
            'product_id'      => $product->id,
            'system_stock'    => $systemStock,
            'physical_count'  => $physicalCount,
            'difference'      => $difference,
            'adjustment_type' => $adjustmentType,
            'reason'          => $data['reason'] ?? null,
            'status'          => 'PENDING',
            'created_by'      => auth()->id(),
        ]);

        return response()->json([
            'success' => true,
            'data'    => $this->formatAdjustment($adjustment->load('product')),
        ], 201);
    }

    public function approveAdjustment(string $id): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) {
            return response()->json(['success' => false, 'error' => 'Business not found'], 404);
        }

        $adjustment = StockAdjustment::where('id', $id)
            ->where('business_id', $business->id)
            ->with('product')
            ->first();

        if (!$adjustment) {
            return response()->json(['success' => false, 'error' => 'Adjustment not found'], 404);
        }

        if ($adjustment->status !== 'PENDING') {
            return response()->json([
                'success' => false,
                'error'   => "Adjustment is already {$adjustment->status}",
            ], 422);
        }

        // Apply adjustment — re-fetch product to get fresh stock
        $product = Product::find($adjustment->product_id);
        if (!$product) {
            return response()->json(['success' => false, 'error' => 'Product not found'], 404);
        }

        StockService::recordMovement(
            $product,
            'ADJUSTMENT',
            $adjustment->difference,
            'adjustment',
            $adjustment->id,
            $adjustment->reason,
            auth()->id()
        );

        $adjustment->update([
            'status'      => 'APPROVED',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'data'    => $this->formatAdjustment($adjustment->fresh()->load('product')),
        ]);
    }

    public function rejectAdjustment(string $id): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) {
            return response()->json(['success' => false, 'error' => 'Business not found'], 404);
        }

        $adjustment = StockAdjustment::where('id', $id)
            ->where('business_id', $business->id)
            ->with('product')
            ->first();

        if (!$adjustment) {
            return response()->json(['success' => false, 'error' => 'Adjustment not found'], 404);
        }

        if ($adjustment->status !== 'PENDING') {
            return response()->json([
                'success' => false,
                'error'   => "Adjustment is already {$adjustment->status}",
            ], 422);
        }

        $adjustment->update([
            'status'      => 'REJECTED',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'data'    => $this->formatAdjustment($adjustment->fresh()->load('product')),
        ]);
    }

    private function formatMovement(StockMovement $m): array
    {
        return [
            'id'            => $m->id,
            'productId'     => $m->product_id,
            'productName'   => $m->product?->name,
            'movementType'  => $m->movement_type,
            'quantity'      => $m->quantity,
            'stockBefore'   => $m->stock_before,
            'stockAfter'    => $m->stock_after,
            'referenceType' => $m->reference_type,
            'referenceId'   => $m->reference_id,
            'reason'        => $m->reason,
            'createdBy'     => $m->created_by,
            'createdAt'     => $m->created_at,
        ];
    }

    private function formatAdjustment(StockAdjustment $a): array
    {
        return [
            'id'             => $a->id,
            'productId'      => $a->product_id,
            'product'        => $a->product?->id ? ['id' => $a->product->id, 'name' => $a->product->name] : null,
            'systemStock'    => $a->system_stock,
            'physicalCount'  => $a->physical_count,
            'difference'     => $a->difference,
            'adjustmentType' => $a->adjustment_type,
            'reason'         => $a->reason,
            'status'         => $a->status,
            'approvedBy'     => $a->approved_by,
            'approvedAt'     => $a->approved_at,
            'createdBy'      => $a->created_by,
            'createdAt'      => $a->created_at,
        ];
    }
}
