<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Supplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SupplierController extends Controller
{
    private function getBusiness(): ?Business
    {
        return Business::where('user_id', auth()->id())->first();
    }

    public function listSuppliers(Request $request): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) {
            return response()->json(['success' => true, 'data' => ['suppliers' => [], 'total' => 0]]);
        }

        $query = Supplier::where('business_id', $business->id);

        if ($request->filled('isActive')) {
            $query->where('is_active', filter_var($request->isActive, FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('search')) {
            $q = $request->search;
            $query->where(function ($q2) use ($q) {
                $q2->where('name', 'like', "%$q%")
                    ->orWhere('phone', 'like', "%$q%")
                    ->orWhere('email', 'like', "%$q%");
            });
        }

        $suppliers = $query
            ->withCount(['products', 'purchaseOrders'])
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'suppliers' => $suppliers->map(fn($s) => $this->formatSupplier($s)),
                'total' => $suppliers->count(),
            ],
        ]);
    }

    public function createSupplier(Request $request): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) {
            return response()->json(['success' => false, 'error' => 'Business not found'], 404);
        }

        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'phone'    => 'nullable|string|max:50',
            'email'    => 'nullable|email|max:255',
            'address'  => 'nullable|string',
            'isActive' => 'sometimes|boolean',
        ]);

        $supplier = Supplier::create([
            'id'          => Str::uuid()->toString(),
            'business_id' => $business->id,
            'name'        => $data['name'],
            'phone'       => $data['phone'] ?? null,
            'email'       => $data['email'] ?? null,
            'address'     => $data['address'] ?? null,
            'balance'     => 0,
            'is_active'   => $data['isActive'] ?? true,
        ]);

        $supplier->loadCount(['products', 'purchaseOrders']);

        return response()->json(['success' => true, 'data' => $this->formatSupplier($supplier)], 201);
    }

    public function getSupplier(string $id): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) {
            return response()->json(['success' => false, 'error' => 'Business not found'], 404);
        }

        $supplier = Supplier::where('id', $id)
            ->where('business_id', $business->id)
            ->withCount(['products', 'purchaseOrders'])
            ->first();

        if (!$supplier) {
            return response()->json(['success' => false, 'error' => 'Supplier not found'], 404);
        }

        return response()->json(['success' => true, 'data' => $this->formatSupplier($supplier)]);
    }

    public function updateSupplier(Request $request, string $id): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) {
            return response()->json(['success' => false, 'error' => 'Business not found'], 404);
        }

        $supplier = Supplier::where('id', $id)->where('business_id', $business->id)->first();
        if (!$supplier) {
            return response()->json(['success' => false, 'error' => 'Supplier not found'], 404);
        }

        $data = $request->validate([
            'name'     => 'sometimes|string|max:255',
            'phone'    => 'nullable|string|max:50',
            'email'    => 'nullable|email|max:255',
            'address'  => 'nullable|string',
            'balance'  => 'sometimes|numeric|min:0',
            'isActive' => 'sometimes|boolean',
        ]);

        $supplier->update([
            'name'      => $data['name'] ?? $supplier->name,
            'phone'     => array_key_exists('phone', $data) ? $data['phone'] : $supplier->phone,
            'email'     => array_key_exists('email', $data) ? $data['email'] : $supplier->email,
            'address'   => array_key_exists('address', $data) ? $data['address'] : $supplier->address,
            'balance'   => $data['balance'] ?? $supplier->balance,
            'is_active' => $data['isActive'] ?? $supplier->is_active,
        ]);

        $supplier = $supplier->fresh()->loadCount(['products', 'purchaseOrders']);

        return response()->json(['success' => true, 'data' => $this->formatSupplier($supplier)]);
    }

    public function deleteSupplier(string $id): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) {
            return response()->json(['success' => false, 'error' => 'Business not found'], 404);
        }

        $supplier = Supplier::where('id', $id)->where('business_id', $business->id)->first();
        if (!$supplier) {
            return response()->json(['success' => false, 'error' => 'Supplier not found'], 404);
        }

        $activePurchaseOrders = $supplier->purchaseOrders()
            ->whereIn('status', ['PENDING', 'ORDERED', 'PARTIAL'])
            ->count();

        if ($activePurchaseOrders > 0) {
            return response()->json([
                'success' => false,
                'error'   => "Cannot delete supplier: $activePurchaseOrders active purchase order(s) exist. Complete or cancel them first.",
            ], 422);
        }

        $supplier->delete();

        return response()->json(['success' => true, 'data' => ['message' => 'Supplier deleted']]);
    }

    private function formatSupplier(Supplier $s): array
    {
        return [
            'id'                 => $s->id,
            'name'               => $s->name,
            'phone'              => $s->phone,
            'email'              => $s->email,
            'address'            => $s->address,
            'balance'            => (float) $s->balance,
            'isActive'           => (bool) $s->is_active,
            'productCount'       => $s->products_count ?? 0,
            'purchaseOrderCount' => $s->purchase_orders_count ?? 0,
            'createdAt'          => $s->created_at,
        ];
    }
}
