<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Product;
use App\Models\Sale;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SaleController extends Controller
{
    private function getBusiness(): ?Business
    {
        return Business::where('user_id', auth()->id())->first();
    }

    public function listSales(Request $request): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) return response()->json(['success' => true, 'data' => ['sales' => [], 'total' => 0]]);

        $query = Sale::where('business_id', $business->id)->with('product');

        if ($request->filled('startDate')) $query->where('sale_date', '>=', $request->startDate);
        if ($request->filled('endDate')) $query->where('sale_date', '<=', $request->endDate);
        if ($request->filled('paymentMethod')) $query->where('payment_method', $request->paymentMethod);
        if ($request->filled('productId')) $query->where('product_id', $request->productId);

        $total = $query->count();
        $page = (int) $request->get('page', 1);
        $limit = (int) $request->get('limit', 50);
        $sales = $query->orderByDesc('sale_date')->orderByDesc('created_at')->skip(($page - 1) * $limit)->take($limit)->get();

        return response()->json([
            'success' => true,
            'data' => [
                'sales' => $sales->map(fn($s) => $this->formatSale($s)),
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
            ],
        ]);
    }

    public function createSale(Request $request): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) return response()->json(['success' => false, 'error' => 'Business not found'], 404);

        $data = $request->validate([
            'productId' => 'nullable|uuid',
            'quantity' => 'required|integer|min:1',
            'unitPrice' => 'required|numeric|min:0',
            'paymentMethod' => 'required|in:CASH,MOBILE_MONEY,BANK,CREDIT',
            'saleDate' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        $totalAmount = $data['quantity'] * $data['unitPrice'];

        if (!empty($data['productId'])) {
            $product = Product::where('id', $data['productId'])->where('business_id', $business->id)->first();
            if (!$product) return response()->json(['success' => false, 'error' => 'Product not found'], 404);
            if ($product->stock_quantity < $data['quantity']) {
                return response()->json(['success' => false, 'error' => 'Insufficient stock'], 400);
            }
            $product->decrement('stock_quantity', $data['quantity']);
        }

        $sale = Sale::create([
            'id' => Str::uuid(),
            'business_id' => $business->id,
            'product_id' => $data['productId'] ?? null,
            'quantity' => $data['quantity'],
            'unit_price' => $data['unitPrice'],
            'total_amount' => $totalAmount,
            'payment_method' => $data['paymentMethod'],
            'sale_date' => $data['saleDate'],
            'notes' => $data['notes'] ?? null,
        ]);

        AuditService::log([
            'actor_id' => auth()->id(),
            'action' => 'SALE_CREATED',
            'target_type' => 'Sale',
            'target_id' => $sale->id,
        ]);

        return response()->json(['success' => true, 'data' => $this->formatSale($sale->load('product'))], 201);
    }

    public function getSale(Request $request, string $id): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) return response()->json(['success' => false, 'error' => 'Not found'], 404);

        $sale = Sale::where('id', $id)->where('business_id', $business->id)->with('product')->first();
        if (!$sale) return response()->json(['success' => false, 'error' => 'Sale not found'], 404);

        return response()->json(['success' => true, 'data' => $this->formatSale($sale)]);
    }

    public function updateSale(Request $request, string $id): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) return response()->json(['success' => false, 'error' => 'Not found'], 404);

        $sale = Sale::where('id', $id)->where('business_id', $business->id)->first();
        if (!$sale) return response()->json(['success' => false, 'error' => 'Sale not found'], 404);

        $data = $request->validate([
            'quantity' => 'sometimes|integer|min:1',
            'unitPrice' => 'sometimes|numeric|min:0',
            'paymentMethod' => 'sometimes|in:CASH,MOBILE_MONEY,BANK,CREDIT',
            'saleDate' => 'sometimes|date',
            'notes' => 'nullable|string',
        ]);

        $quantity = $data['quantity'] ?? $sale->quantity;
        $unitPrice = $data['unitPrice'] ?? $sale->unit_price;

        $sale->update([
            'quantity' => $quantity,
            'unit_price' => $unitPrice,
            'total_amount' => $quantity * $unitPrice,
            'payment_method' => $data['paymentMethod'] ?? $sale->payment_method,
            'sale_date' => $data['saleDate'] ?? $sale->sale_date,
            'notes' => array_key_exists('notes', $data) ? $data['notes'] : $sale->notes,
        ]);

        AuditService::log([
            'actor_id' => auth()->id(),
            'action' => 'SALE_UPDATED',
            'target_type' => 'Sale',
            'target_id' => $sale->id,
        ]);

        return response()->json(['success' => true, 'data' => $this->formatSale($sale->fresh()->load('product'))]);
    }

    public function deleteSale(Request $request, string $id): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) return response()->json(['success' => false, 'error' => 'Not found'], 404);

        $sale = Sale::where('id', $id)->where('business_id', $business->id)->first();
        if (!$sale) return response()->json(['success' => false, 'error' => 'Sale not found'], 404);

        $sale->delete();

        AuditService::log([
            'actor_id' => auth()->id(),
            'action' => 'SALE_DELETED',
            'target_type' => 'Sale',
            'target_id' => $id,
        ]);

        return response()->json(['success' => true, 'data' => ['message' => 'Sale deleted']]);
    }

    private function formatSale(Sale $s): array
    {
        return [
            'id' => $s->id,
            'businessId' => $s->business_id,
            'productId' => $s->product_id,
            'quantity' => $s->quantity,
            'unitPrice' => (float) $s->unit_price,
            'totalAmount' => (float) $s->total_amount,
            'paymentMethod' => $s->payment_method,
            'saleDate' => $s->sale_date?->format('Y-m-d'),
            'notes' => $s->notes,
            'product' => $s->product && $s->product->id ? [
                'id' => $s->product->id,
                'name' => $s->product->name,
                'sku' => $s->product->sku,
            ] : null,
            'createdAt' => $s->created_at,
            'updatedAt' => $s->updated_at,
        ];
    }
}
