<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Brand;
use App\Models\Product;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    private function getBusiness(): ?Business
    {
        return Business::forUser(auth()->user());
    }

    public function listProducts(Request $request): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) return response()->json(['success' => true, 'data' => ['products' => [], 'total' => 0]]);

        $query = Product::where('business_id', $business->id);

        if ($request->filled('search')) {
            $q = $request->search;
            $query->where(function ($q2) use ($q) {
                $q2->where('name', 'like', "%$q%")->orWhere('sku', 'like', "%$q%")->orWhere('barcode', 'like', "%$q%");
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
        $products = $query->with(['category', 'supplier', 'managedBrand'])->orderByDesc('created_at')->skip(($page - 1) * $limit)->take($limit)->get();

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
            'name'         => 'required|string|max:255',
            'sku'          => 'nullable|string',
            'barcode'      => 'nullable|string|max:255',
            'brand'        => 'nullable|string|max:255',
            'brandId'      => 'nullable|uuid',
            'unitType'     => 'nullable|in:pcs,box,kg,litre,pack,dozen',
            'categoryId'   => 'nullable|uuid',
            'supplierId'   => 'nullable|uuid',
            'buyingPrice'  => 'required|numeric|min:0',
            'sellingPrice' => 'required|numeric|min:0',
            'stockQuantity'=> 'integer|min:0',
            'lowStockLevel'=> 'integer|min:0',
            'reorderPoint' => 'sometimes|integer|min:0',
            'expiryDate'   => 'nullable|date',
            'imageUrl'     => 'nullable|string|max:1000',
            'notes'        => 'nullable|string',
            'isActive'     => 'boolean',
        ]);

        if (!empty($data['sku'])) {
            $exists = Product::where('business_id', $business->id)->where('sku', $data['sku'])->exists();
            if ($exists) return response()->json(['success' => false, 'error' => 'SKU already exists'], 409);
        }
        if (!empty($data['barcode']) && Product::where('business_id', $business->id)->where('barcode', $data['barcode'])->exists()) {
            return response()->json(['success' => false, 'error' => 'Barcode already exists'], 409);
        }

        $brand = !empty($data['brandId'])
            ? Brand::where('id', $data['brandId'])->where('business_id', $business->id)->first()
            : null;
        if (!empty($data['brandId']) && !$brand) return response()->json(['success' => false, 'error' => 'Brand not found'], 422);

        $product = Product::create([
            'id'            => Str::uuid()->toString(),
            'business_id'   => $business->id,
            'name'          => $data['name'],
            'sku'           => $data['sku'] ?? null,
            'barcode'       => $data['barcode'] ?? null,
            'brand'         => $brand?->name ?? ($data['brand'] ?? null),
            'brand_id'      => $brand?->id,
            'unit_type'     => $data['unitType'] ?? 'pcs',
            'category_id'   => $data['categoryId'] ?? null,
            'supplier_id'   => $data['supplierId'] ?? null,
            'buying_price'  => $data['buyingPrice'],
            'selling_price' => $data['sellingPrice'],
            'stock_quantity'=> $data['stockQuantity'] ?? 0,
            'low_stock_level' => $data['lowStockLevel'] ?? 0,
            'reorder_point' => $data['reorderPoint'] ?? 0,
            'expiry_date'   => $data['expiryDate'] ?? null,
            'image_url'     => $data['imageUrl'] ?? null,
            'notes'         => $data['notes'] ?? null,
            'is_active'     => $data['isActive'] ?? true,
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

        $product = Product::with(['category', 'supplier', 'managedBrand'])->where('id', $id)->where('business_id', $business->id)->first();
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
            'name'         => 'sometimes|string|max:255',
            'sku'          => 'nullable|string',
            'barcode'      => 'nullable|string|max:255',
            'brand'        => 'nullable|string|max:255',
            'brandId'      => 'nullable|uuid',
            'unitType'     => 'nullable|in:pcs,box,kg,litre,pack,dozen',
            'categoryId'   => 'nullable|uuid',
            'supplierId'   => 'nullable|uuid',
            'buyingPrice'  => 'sometimes|numeric|min:0',
            'sellingPrice' => 'sometimes|numeric|min:0',
            'stockQuantity'=> 'sometimes|integer|min:0',
            'lowStockLevel'=> 'sometimes|integer|min:0',
            'reorderPoint' => 'sometimes|integer|min:0',
            'expiryDate'   => 'nullable|date',
            'imageUrl'     => 'nullable|string|max:1000',
            'notes'        => 'nullable|string',
            'isActive'     => 'sometimes|boolean',
        ]);

        if (!empty($data['barcode']) && Product::where('business_id', $business->id)->where('barcode', $data['barcode'])->where('id', '<>', $product->id)->exists()) {
            return response()->json(['success' => false, 'error' => 'Barcode already exists'], 409);
        }

        $brand = array_key_exists('brandId', $data) && $data['brandId']
            ? Brand::where('id', $data['brandId'])->where('business_id', $business->id)->first()
            : null;
        if (!empty($data['brandId']) && !$brand) return response()->json(['success' => false, 'error' => 'Brand not found'], 422);

        $product->update([
            'name'          => $data['name'] ?? $product->name,
            'sku'           => array_key_exists('sku', $data) ? $data['sku'] : $product->sku,
            'barcode'       => array_key_exists('barcode', $data) ? $data['barcode'] : $product->barcode,
            'brand'         => $brand?->name ?? (array_key_exists('brand', $data) ? $data['brand'] : $product->brand),
            'brand_id'      => array_key_exists('brandId', $data) ? $brand?->id : $product->brand_id,
            'unit_type'     => $data['unitType'] ?? $product->unit_type,
            'category_id'   => array_key_exists('categoryId', $data) ? $data['categoryId'] : $product->category_id,
            'supplier_id'   => array_key_exists('supplierId', $data) ? $data['supplierId'] : $product->supplier_id,
            'buying_price'  => $data['buyingPrice'] ?? $product->buying_price,
            'selling_price' => $data['sellingPrice'] ?? $product->selling_price,
            'stock_quantity'  => $data['stockQuantity'] ?? $product->stock_quantity,
            'low_stock_level' => $data['lowStockLevel'] ?? $product->low_stock_level,
            'reorder_point'   => $data['reorderPoint'] ?? $product->reorder_point,
            'expiry_date'     => array_key_exists('expiryDate', $data) ? $data['expiryDate'] : $product->expiry_date,
            'image_url'       => array_key_exists('imageUrl', $data) ? $data['imageUrl'] : $product->image_url,
            'notes'           => array_key_exists('notes', $data) ? $data['notes'] : $product->notes,
            'is_active'       => $data['isActive'] ?? $product->is_active,
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
        $p->loadMissing(['category', 'supplier', 'managedBrand']);
        return [
            'id' => $p->id,
            'businessId' => $p->business_id,
            'name' => $p->name,
            'sku' => $p->sku,
            'barcode' => $p->barcode,
            'brand' => $p->managedBrand?->name ?? $p->brand,
            'brandId' => $p->brand_id,
            'managedBrand' => $p->managedBrand?->id ? ['id' => $p->managedBrand->id, 'name' => $p->managedBrand->name] : null,
            'categoryId' => $p->category_id,
            'category' => $p->category_id ? ['id' => $p->category->id, 'name' => $p->category->name] : null,
            'supplierId' => $p->supplier_id,
            'supplier' => $p->supplier_id ? ['id' => $p->supplier->id, 'name' => $p->supplier->name] : null,
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
