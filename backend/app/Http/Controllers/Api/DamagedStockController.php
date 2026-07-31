<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\DamagedStock;
use App\Models\Product;
use App\Services\StockService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DamagedStockController extends Controller
{
    private function getBusiness(): ?Business
    {
        return Business::forUser(auth()->user());
    }

    public function list(Request $request): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) {
            return response()->json(['success' => true, 'data' => ['records' => [], 'total' => 0]]);
        }

        $query = DamagedStock::where('business_id', $business->id)->with('product');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('productId')) {
            $query->where('product_id', $request->productId);
        }

        $total  = $query->count();
        $page   = (int) $request->get('page', 1);
        $limit  = (int) $request->get('limit', 50);

        $records = $query->orderByDesc('created_at')
            ->skip(($page - 1) * $limit)
            ->take($limit)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'records' => $records->map(fn($r) => $this->formatRecord($r)),
                'total'   => $total,
                'page'    => $page,
                'limit'   => $limit,
            ],
        ]);
    }

    public function create(Request $request): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) {
            return response()->json(['success' => false, 'error' => 'Business not found'], 404);
        }

        $data = $request->validate([
            'productId' => 'required|uuid',
            'quantity'  => 'required|integer|min:1',
            'reason'    => 'required|string|max:500',
            'comment'   => 'nullable|string|max:1000',
        ]);

        $product = Product::where('id', $data['productId'])
            ->where('business_id', $business->id)
            ->first();

        if (!$product) {
            return response()->json(['success' => false, 'error' => 'Product not found'], 404);
        }

        $record = DamagedStock::create([
            'id'          => Str::uuid()->toString(),
            'business_id' => $business->id,
            'product_id'  => $product->id,
            'quantity'    => $data['quantity'],
            'reason'      => $data['reason'],
            'comment'     => $data['comment'] ?? null,
            'status'      => 'PENDING',
            'created_by'  => auth()->id(),
        ]);

        return response()->json([
            'success' => true,
            'data'    => $this->formatRecord($record->load('product')),
        ], 201);
    }

    public function approve(string $id): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) {
            return response()->json(['success' => false, 'error' => 'Business not found'], 404);
        }

        $record = DamagedStock::where('id', $id)
            ->where('business_id', $business->id)
            ->with('product')
            ->first();

        if (!$record) {
            return response()->json(['success' => false, 'error' => 'Damaged stock record not found'], 404);
        }

        if ($record->status !== 'PENDING') {
            return response()->json([
                'success' => false,
                'error'   => "Record is already {$record->status}",
            ], 422);
        }

        $product = Product::find($record->product_id);
        if (!$product) {
            return response()->json(['success' => false, 'error' => 'Product not found'], 404);
        }

        // Deduct from stock
        StockService::recordMovement(
            $product,
            'DAMAGED',
            -(int) $record->quantity,
            'damaged_stock',
            $record->id,
            $record->reason,
            auth()->id()
        );

        $record->update([
            'status'      => 'APPROVED',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'data'    => $this->formatRecord($record->fresh()->load('product')),
        ]);
    }

    public function reject(string $id): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) {
            return response()->json(['success' => false, 'error' => 'Business not found'], 404);
        }

        $record = DamagedStock::where('id', $id)
            ->where('business_id', $business->id)
            ->first();

        if (!$record) {
            return response()->json(['success' => false, 'error' => 'Damaged stock record not found'], 404);
        }

        if ($record->status !== 'PENDING') {
            return response()->json([
                'success' => false,
                'error'   => "Record is already {$record->status}",
            ], 422);
        }

        $record->update([
            'status'      => 'REJECTED',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'data'    => $this->formatRecord($record->fresh()->load('product')),
        ]);
    }

    private function formatRecord(DamagedStock $r): array
    {
        return [
            'id'         => $r->id,
            'product'    => $r->product?->id ? [
                'id'   => $r->product->id,
                'name' => $r->product->name,
            ] : null,
            'quantity'   => $r->quantity,
            'reason'     => $r->reason,
            'comment'    => $r->comment,
            'status'     => $r->status,
            'approvedBy' => $r->approved_by,
            'approvedAt' => $r->approved_at,
            'createdBy'  => $r->created_by,
            'createdAt'  => $r->created_at,
        ];
    }
}
