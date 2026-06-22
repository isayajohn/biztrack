<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    private function getBusiness(): ?Business
    {
        return Business::where('user_id', auth()->id())->first();
    }

    public function listCategories(Request $request): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) {
            return response()->json(['success' => true, 'data' => ['categories' => [], 'total' => 0]]);
        }

        $query = Category::where('business_id', $business->id);

        if ($request->filled('isActive')) {
            $query->where('is_active', filter_var($request->isActive, FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('search')) {
            $q = $request->search;
            $query->where('name', 'like', "%$q%");
        }

        $categories = $query->withCount('products')->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => [
                'categories' => $categories->map(fn($c) => $this->formatCategory($c)),
                'total' => $categories->count(),
            ],
        ]);
    }

    public function createCategory(Request $request): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) {
            return response()->json(['success' => false, 'error' => 'Business not found'], 404);
        }

        $data = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'isActive'    => 'sometimes|boolean',
        ]);

        $exists = Category::where('business_id', $business->id)
            ->where('name', $data['name'])
            ->exists();
        if ($exists) {
            return response()->json(['success' => false, 'error' => 'Category with this name already exists'], 409);
        }

        $category = Category::create([
            'id'          => Str::uuid()->toString(),
            'business_id' => $business->id,
            'name'        => $data['name'],
            'description' => $data['description'] ?? null,
            'is_active'   => $data['isActive'] ?? true,
        ]);

        $category->loadCount('products');

        return response()->json(['success' => true, 'data' => $this->formatCategory($category)], 201);
    }

    public function updateCategory(Request $request, string $id): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) {
            return response()->json(['success' => false, 'error' => 'Business not found'], 404);
        }

        $category = Category::where('id', $id)->where('business_id', $business->id)->first();
        if (!$category) {
            return response()->json(['success' => false, 'error' => 'Category not found'], 404);
        }

        $data = $request->validate([
            'name'        => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:1000',
            'isActive'    => 'sometimes|boolean',
        ]);

        if (!empty($data['name']) && $data['name'] !== $category->name) {
            $exists = Category::where('business_id', $business->id)
                ->where('name', $data['name'])
                ->where('id', '!=', $id)
                ->exists();
            if ($exists) {
                return response()->json(['success' => false, 'error' => 'Category with this name already exists'], 409);
            }
        }

        $category->update([
            'name'        => $data['name'] ?? $category->name,
            'description' => array_key_exists('description', $data) ? $data['description'] : $category->description,
            'is_active'   => $data['isActive'] ?? $category->is_active,
        ]);

        $category->loadCount('products');

        return response()->json(['success' => true, 'data' => $this->formatCategory($category->fresh()->loadCount('products'))]);
    }

    public function deleteCategory(string $id): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) {
            return response()->json(['success' => false, 'error' => 'Business not found'], 404);
        }

        $category = Category::where('id', $id)->where('business_id', $business->id)->first();
        if (!$category) {
            return response()->json(['success' => false, 'error' => 'Category not found'], 404);
        }

        $productCount = $category->products()->count();
        if ($productCount > 0) {
            return response()->json([
                'success' => false,
                'error'   => "Cannot delete category: $productCount product(s) are using it. Reassign them first.",
            ], 422);
        }

        $category->delete();

        return response()->json(['success' => true, 'data' => ['message' => 'Category deleted']]);
    }

    private function formatCategory(Category $c): array
    {
        return [
            'id'           => $c->id,
            'name'         => $c->name,
            'description'  => $c->description,
            'isActive'     => (bool) $c->is_active,
            'productCount' => $c->products_count ?? 0,
            'createdAt'    => $c->created_at,
        ];
    }
}
