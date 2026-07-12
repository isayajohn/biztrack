<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\Supplier;
use App\Services\StockService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PurchaseController extends Controller
{
    private function getBusiness(): ?Business
    {
        return Business::forUser(auth()->user());
    }

    public function listPurchases(Request $request): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) {
            return response()->json(['success' => true, 'data' => ['purchases' => [], 'total' => 0]]);
        }

        $query = PurchaseOrder::where('business_id', $business->id)
            ->with(['supplier', 'items'])
            ->withCount('items');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('supplierId')) {
            $query->where('supplier_id', $request->supplierId);
        }

        if ($request->filled('startDate')) {
            $query->whereDate('created_at', '>=', $request->startDate);
        }

        if ($request->filled('endDate')) {
            $query->whereDate('created_at', '<=', $request->endDate);
        }

        $total  = $query->count();
        $page   = (int) $request->get('page', 1);
        $limit  = (int) $request->get('limit', 50);

        $purchases = $query->orderByDesc('created_at')
            ->skip(($page - 1) * $limit)
            ->take($limit)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'purchases' => $purchases->map(fn($p) => $this->formatPurchase($p)),
                'total'     => $total,
                'page'      => $page,
                'limit'     => $limit,
            ],
        ]);
    }

    public function createPurchase(Request $request): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) {
            return response()->json(['success' => false, 'error' => 'Business not found'], 404);
        }

        $data = $request->validate([
            'supplierId'    => 'nullable|uuid',
            'items'         => 'required|array|min:1',
            'items.*.productId'  => 'nullable|uuid',
            'items.*.productName' => 'required_without:items.*.productId|nullable|string',
            'items.*.quantity'   => 'required|integer|min:1',
            'items.*.unitPrice'  => 'required|numeric|min:0',
            'notes'         => 'nullable|string',
            'expectedDate'  => 'nullable|date',
            'paidAmount'    => 'sometimes|numeric|min:0',
        ]);

        // Validate supplier belongs to business
        if (!empty($data['supplierId'])) {
            $supplier = Supplier::where('id', $data['supplierId'])
                ->where('business_id', $business->id)
                ->first();
            if (!$supplier) {
                return response()->json(['success' => false, 'error' => 'Supplier not found'], 404);
            }
        }

        // Generate order number
        $orderNumber = 'PO-' . now()->format('Ymd') . '-' . strtoupper(Str::random(4));
        while (PurchaseOrder::where('order_number', $orderNumber)->exists()) {
            $orderNumber = 'PO-' . now()->format('Ymd') . '-' . strtoupper(Str::random(4));
        }

        // Calculate total
        $totalAmount = 0;
        $itemsData   = [];
        foreach ($data['items'] as $item) {
            $productName = null;
            $productId   = $item['productId'] ?? null;

            if ($productId) {
                $product = Product::where('id', $productId)
                    ->where('business_id', $business->id)
                    ->first();
                if (!$product) {
                    return response()->json(['success' => false, 'error' => "Product $productId not found"], 404);
                }
                $productName = $product->name;
            } else {
                $productName = $item['productName'] ?? 'Unknown Product';
            }

            $itemTotal     = (int) $item['quantity'] * (float) $item['unitPrice'];
            $totalAmount  += $itemTotal;

            $itemsData[] = [
                'id'                => Str::uuid()->toString(),
                'product_id'        => $productId,
                'product_name'      => $productName,
                'quantity'          => (int) $item['quantity'],
                'received_quantity' => 0,
                'unit_price'        => (float) $item['unitPrice'],
                'total_price'       => $itemTotal,
            ];
        }

        $paidAmount = (float) ($data['paidAmount'] ?? 0);

        $purchase = PurchaseOrder::create([
            'id'            => Str::uuid()->toString(),
            'business_id'   => $business->id,
            'branch_id'     => $business->branchIdForUser(auth()->user(), $request->header('X-Branch-Id')),
            'supplier_id'   => $data['supplierId'] ?? null,
            'order_number'  => $orderNumber,
            'total_amount'  => $totalAmount,
            'paid_amount'   => $paidAmount,
            'status'        => 'PENDING',
            'expected_date' => $data['expectedDate'] ?? null,
            'notes'         => $data['notes'] ?? null,
            'created_by'    => auth()->id(),
        ]);

        foreach ($itemsData as $itemData) {
            $itemData['purchase_order_id'] = $purchase->id;
            PurchaseOrderItem::create($itemData);
        }

        $purchase->load(['supplier', 'items.product']);

        return response()->json([
            'success' => true,
            'data'    => $this->formatPurchase($purchase),
        ], 201);
    }

    public function getPurchase(string $id): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) {
            return response()->json(['success' => false, 'error' => 'Business not found'], 404);
        }

        $purchase = PurchaseOrder::where('id', $id)
            ->where('business_id', $business->id)
            ->with(['supplier', 'items.product'])
            ->first();

        if (!$purchase) {
            return response()->json(['success' => false, 'error' => 'Purchase order not found'], 404);
        }

        return response()->json(['success' => true, 'data' => $this->formatPurchase($purchase)]);
    }

    public function updatePurchase(Request $request, string $id): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) {
            return response()->json(['success' => false, 'error' => 'Business not found'], 404);
        }

        $purchase = PurchaseOrder::where('id', $id)
            ->where('business_id', $business->id)
            ->first();

        if (!$purchase) {
            return response()->json(['success' => false, 'error' => 'Purchase order not found'], 404);
        }

        if ($purchase->status !== 'PENDING') {
            return response()->json([
                'success' => false,
                'error'   => "Cannot update purchase order with status: {$purchase->status}. Only PENDING orders can be updated.",
            ], 422);
        }

        $data = $request->validate([
            'supplierId'   => 'nullable|uuid',
            'notes'        => 'nullable|string',
            'expectedDate' => 'nullable|date',
            'status'       => 'sometimes|in:PENDING,ORDERED,CANCELLED',
        ]);

        if (!empty($data['supplierId'])) {
            $supplier = Supplier::where('id', $data['supplierId'])
                ->where('business_id', $business->id)
                ->first();
            if (!$supplier) {
                return response()->json(['success' => false, 'error' => 'Supplier not found'], 404);
            }
        }

        $purchase->update([
            'supplier_id'   => array_key_exists('supplierId', $data) ? $data['supplierId'] : $purchase->supplier_id,
            'notes'         => array_key_exists('notes', $data) ? $data['notes'] : $purchase->notes,
            'expected_date' => $data['expectedDate'] ?? $purchase->expected_date,
            'status'        => $data['status'] ?? $purchase->status,
        ]);

        $purchase->load(['supplier', 'items.product']);

        return response()->json(['success' => true, 'data' => $this->formatPurchase($purchase->fresh()->load(['supplier', 'items.product']))]);
    }

    public function receivePurchase(Request $request, string $id): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) {
            return response()->json(['success' => false, 'error' => 'Business not found'], 404);
        }

        $purchase = PurchaseOrder::where('id', $id)
            ->where('business_id', $business->id)
            ->with(['supplier', 'items.product'])
            ->first();

        if (!$purchase) {
            return response()->json(['success' => false, 'error' => 'Purchase order not found'], 404);
        }

        if ($purchase->status === 'RECEIVED' || $purchase->status === 'CANCELLED') {
            return response()->json([
                'success' => false,
                'error'   => "Cannot receive purchase order with status: {$purchase->status}",
            ], 422);
        }

        $data = $request->validate([
            'items'       => 'sometimes|array',
            'items.*.id'  => 'required_with:items|uuid',
            'items.*.receivedQuantity' => 'required_with:items|integer|min:0',
            'paidAmount'  => 'sometimes|numeric|min:0',
            'notes'       => 'nullable|string',
        ]);

        $allReceived = true;
        $anyReceived = false;

        foreach ($purchase->items as $item) {
            $receivedQty = $item->received_quantity;

            // Check if caller provided specific quantities for this item
            if (!empty($data['items'])) {
                $inputItem = collect($data['items'])->firstWhere('id', $item->id);
                if ($inputItem) {
                    $receivedQty = (int) $inputItem['receivedQuantity'];
                }
            } else {
                // Mark all items as fully received
                $receivedQty = $item->quantity;
            }

            $item->update(['received_quantity' => $receivedQty]);

            if ($receivedQty < $item->quantity) {
                $allReceived = false;
            }
            if ($receivedQty > 0) {
                $anyReceived = true;
            }

            // Record stock movement for newly received units
            $newlyReceived = $receivedQty - ($item->getOriginal('received_quantity') ?? 0);
            if ($newlyReceived > 0 && $item->product_id) {
                $product = Product::find($item->product_id);
                if ($product) {
                    StockService::recordMovement(
                        $product,
                        'PURCHASE',
                        $newlyReceived,
                        'purchase',
                        $purchase->id,
                        "Purchase order {$purchase->order_number}",
                        auth()->id()
                    );

                    // Update buying price if changed
                    if ($item->unit_price > 0 && (float) $product->buying_price !== (float) $item->unit_price) {
                        $product->fresh()->update(['buying_price' => $item->unit_price]);
                    }
                }
            }
        }

        // Update supplier balance if there's outstanding amount
        $paidAmount = isset($data['paidAmount']) ? (float) $data['paidAmount'] : (float) $purchase->paid_amount;
        $outstanding = (float) $purchase->total_amount - $paidAmount;

        if ($purchase->supplier_id && $outstanding > 0) {
            $supplier = Supplier::find($purchase->supplier_id);
            if ($supplier) {
                $supplier->increment('balance', $outstanding);
            }
        }

        $newStatus = $allReceived ? 'RECEIVED' : ($anyReceived ? 'PARTIAL' : $purchase->status);

        $purchase->update([
            'status'        => $newStatus,
            'paid_amount'   => $paidAmount,
            'received_date' => $allReceived ? now()->toDateString() : $purchase->received_date,
            'notes'         => $data['notes'] ?? $purchase->notes,
        ]);

        $purchase = $purchase->fresh()->load(['supplier', 'items.product']);

        return response()->json(['success' => true, 'data' => $this->formatPurchase($purchase)]);
    }

    public function deletePurchase(string $id): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) {
            return response()->json(['success' => false, 'error' => 'Business not found'], 404);
        }

        $purchase = PurchaseOrder::where('id', $id)
            ->where('business_id', $business->id)
            ->first();

        if (!$purchase) {
            return response()->json(['success' => false, 'error' => 'Purchase order not found'], 404);
        }

        if (!in_array($purchase->status, ['PENDING', 'CANCELLED'])) {
            return response()->json([
                'success' => false,
                'error'   => "Cannot delete purchase order with status: {$purchase->status}. Only PENDING or CANCELLED orders can be deleted.",
            ], 422);
        }

        $purchase->delete();

        return response()->json(['success' => true, 'data' => ['message' => 'Purchase order deleted']]);
    }

    private function formatPurchase(PurchaseOrder $p): array
    {
        return [
            'id'           => $p->id,
            'orderNumber'  => $p->order_number,
            'supplier'     => $p->supplier?->id ? [
                'id'   => $p->supplier->id,
                'name' => $p->supplier->name,
            ] : null,
            'status'       => $p->status,
            'totalAmount'  => (float) $p->total_amount,
            'paidAmount'   => (float) $p->paid_amount,
            'expectedDate' => $p->expected_date?->format('Y-m-d'),
            'receivedDate' => $p->received_date?->format('Y-m-d'),
            'notes'        => $p->notes,
            'items'        => $p->items ? $p->items->map(fn($i) => [
                'id'               => $i->id,
                'productId'        => $i->product_id,
                'productName'      => $i->product_name,
                'quantity'         => $i->quantity,
                'receivedQuantity' => $i->received_quantity,
                'unitPrice'        => (float) $i->unit_price,
                'totalPrice'       => (float) $i->total_price,
            ])->values() : [],
            'createdAt'    => $p->created_at,
        ];
    }
}
