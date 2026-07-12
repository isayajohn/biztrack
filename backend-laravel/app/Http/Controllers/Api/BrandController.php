<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Business;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BrandController extends Controller
{
    private function business(): ?Business
    {
        return Business::forUser(auth()->user());
    }

    public function index(Request $request): JsonResponse
    {
        $business = $this->business();
        if (!$business) return response()->json(['success' => true, 'data' => ['brands' => [], 'total' => 0]]);

        $query = Brand::where('business_id', $business->id)->withCount('products');
        if ($request->filled('isActive')) $query->where('is_active', filter_var($request->input('isActive'), FILTER_VALIDATE_BOOLEAN));
        if ($request->filled('search')) $query->where('name', 'like', '%' . $request->input('search') . '%');
        $brands = $query->orderBy('name')->get();

        return response()->json(['success' => true, 'data' => [
            'brands' => $brands->map(fn (Brand $brand) => $this->format($brand)),
            'total' => $brands->count(),
        ]]);
    }

    public function store(Request $request): JsonResponse
    {
        $business = $this->business();
        if (!$business) return response()->json(['success' => false, 'error' => 'Business not found'], 404);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('brands')->where('business_id', $business->id)],
            'description' => 'nullable|string|max:1000',
        ]);
        $brand = Brand::create(['business_id' => $business->id, ...$data, 'is_active' => true]);
        $this->audit('BRAND_CREATED', $brand->id);
        return response()->json(['success' => true, 'data' => $this->format($brand)], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $business = $this->business();
        $brand = $business ? Brand::where('business_id', $business->id)->find($id) : null;
        if (!$brand) return response()->json(['success' => false, 'error' => 'Brand not found'], 404);
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255', Rule::unique('brands')->where('business_id', $business->id)->ignore($brand->id)],
            'description' => 'nullable|string|max:1000',
            'isActive' => 'sometimes|boolean',
        ]);
        $brand->update([
            'name' => $data['name'] ?? $brand->name,
            'description' => array_key_exists('description', $data) ? $data['description'] : $brand->description,
            'is_active' => $data['isActive'] ?? $brand->is_active,
        ]);
        if (array_key_exists('name', $data)) $brand->products()->update(['brand' => $data['name']]);
        $this->audit('BRAND_UPDATED', $brand->id);
        return response()->json(['success' => true, 'data' => $this->format($brand->fresh()->loadCount('products'))]);
    }

    public function destroy(string $id): JsonResponse
    {
        $business = $this->business();
        $brand = $business ? Brand::where('business_id', $business->id)->withCount('products')->find($id) : null;
        if (!$brand) return response()->json(['success' => false, 'error' => 'Brand not found'], 404);
        if ($brand->products_count > 0) {
            return response()->json(['success' => false, 'error' => 'This brand is assigned to products. Reassign them before deleting it.'], 422);
        }
        $brand->delete();
        $this->audit('BRAND_DELETED', $id);
        return response()->json(['success' => true, 'data' => ['message' => 'Brand deleted']]);
    }

    private function format(Brand $brand): array
    {
        return [
            'id' => $brand->id,
            'name' => $brand->name,
            'description' => $brand->description,
            'isActive' => (bool) $brand->is_active,
            'productCount' => $brand->products_count ?? $brand->products()->count(),
            'createdAt' => $brand->created_at,
        ];
    }

    private function audit(string $action, string $id): void
    {
        AuditService::log(['actor_id' => auth()->id(), 'action' => $action, 'target_type' => 'Brand', 'target_id' => $id]);
    }
}
