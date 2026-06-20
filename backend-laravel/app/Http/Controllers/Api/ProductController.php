<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Product;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    private function getBusiness(): ?Business
    {
        return Business::where('user_id', auth()->id())->first();
    }

    public function listProducts(Request $request): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) return response()->json(['success' => true, 'data' => ['products' => [], 'total' => 0]]);

        $query = Product::where('business_id', $business->id);

        if ($request->filled('search')) {
            $q = $request->search;
            $query->where(function ($q2) use ($q) {
                $q2->where('name', 'like', "%$q%")->orWhere('sku', 'like', "%$q%");
            });
        }
        if ($request->filled('isActive')) {
            $query->where('is_active', filter_var($request->isActive, FILTER_VALIDATE_BOOLEAN));
        }
        if ($request->filled('lowStock') && $request->lowStock === 'true') {
            $query->whereRaw('stock_quantity <= low_stock_level AND is_active = 1');
        }

        $total = $query->count();
        $page = (int) $request->get('page', 1);
        $limit = (int) $request->get('limit', 50);
        $products = $query->orderByDesc('created_at')->skip(($page - 1) * $limit)->take($limit)->get();

        return response()->json([
            'success' => true,
            'data' => [
                'products' => $products->map(fn($p) => $this->formatProduct($p)),
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
            ],
        ]);
    }

    public function createProduct(Request $request): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) return response()->json(['success' => false, 'error' => 'Business not found'], 404);

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'nullable|string',
            'buyingPrice' => 'required|numeric|min:0',
            'sellingPrice' => 'required|numeric|min:0',
            'stockQuantity' => 'integer|min:0',
            'lowStockLevel' => 'integer|min:0',
            'isActive' => 'boolean',
        ]);

        if (!empty($data['sku'])) {
            $exists = Product::where('business_id', $business->id)->where('sku', $data['sku'])->exists();
            if ($exists) return response()->json(['success' => false, 'error' => 'SKU already exists'], 409);
        }

        $product = Product::create([
            'id' => Str::uuid(),
            'business_id' => $business->id,
            'name' => $data['name'],
            'sku' => $data['sku'] ?? null,
            'buying_price' => $data['buyingPrice'],
            'selling_price' => $data['sellingPrice'],
            'stock_quantity' => $data['stockQuantity'] ?? 0,
            'low_stock_level' => $data['lowStockLevel'] ?? 0,
            'is_active' => $data['isActive'] ?? true,
        ]);

        AuditService::log([
            'actor_id' => auth()->id(),
            'action' => 'PRODUCT_CREATED',
            'target_type' => 'Product',
            'target_id' => $product->id,
        ]);

        return response()->json(['success' => true, 'data' => $this->formatProduct($product)], 201);
    }

    public function getProduct(Request $request, string $id): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) return response()->json(['success' => false, 'error' => 'Not found'], 404);

        $product = Product::where('id', $id)->where('business_id', $business->id)->first();
        if (!$product) return response()->json(['success' => false, 'error' => 'Product not found'], 404);

        return response()->json(['success' => true, 'data' => $this->formatProduct($product)]);
    }

    public function updateProduct(Request $request, string $id): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) return response()->json(['success' => false, 'error' => 'Not found'], 404);

        $product = Product::where('id', $id)->where('business_id', $business->id)->first();
        if (!$product) return response()->json(['success' => false, 'error' => 'Product not found'], 404);

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'sku' => 'nullable|string',
            'buyingPrice' => 'sometimes|numeric|min:0',
            'sellingPrice' => 'sometimes|numeric|min:0',
            'stockQuantity' => 'sometimes|integer|min:0',
            'lowStockLevel' => 'sometimes|integer|min:0',
            'isActive' => 'sometimes|boolean',
        ]);

        $product->update([
            'name' => $data['name'] ?? $product->name,
            'sku' => array_key_exists('sku', $data) ? $data['sku'] : $product->sku,
            'buying_price' => $data['buyingPrice'] ?? $product->buying_price,
            'selling_price' => $data['sellingPrice'] ?? $product->selling_price,
            'stock_quantity' => $data['stockQuantity'] ?? $product->stock_quantity,
            'low_stock_level' => $data['lowStockLevel'] ?? $product->low_stock_level,
            'is_active' => $data['isActive'] ?? $product->is_active,
        ]);

        AuditService::log([
            'actor_id' => auth()->id(),
            'action' => 'PRODUCT_UPDATED',
            'target_type' => 'Product',
            'target_id' => $product->id,
        ]);

        return response()->json(['success' => true, 'data' => $this->formatProduct($product->fresh())]);
    }

    public function deleteProduct(Request $request, string $id): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) return response()->json(['success' => false, 'error' => 'Not found'], 404);

        $product = Product::where('id', $id)->where('business_id', $business->id)->first();
        if (!$product) return response()->json(['success' => false, 'error' => 'Product not found'], 404);

        $product->delete();

        AuditService::log([
            'actor_id' => auth()->id(),
            'action' => 'PRODUCT_DELETED',
            'target_type' => 'Product',
            'target_id' => $id,
        ]);

        return response()->json(['success' => true, 'data' => ['message' => 'Product deleted']]);
    }

    private function formatProduct(Product $p): array
    {
        return [
            'id' => $p->id,
            'businessId' => $p->business_id,
            'name' => $p->name,
            'sku' => $p->sku,
            'buyingPrice' => (float) $p->buying_price,
            'sellingPrice' => (float) $p->selling_price,
            'stockQuantity' => $p->stock_quantity,
            'lowStockLevel' => $p->low_stock_level,
            'isActive' => (bool) $p->is_active,
            'createdAt' => $p->created_at,
            'updatedAt' => $p->updated_at,
        ];
    }
}
