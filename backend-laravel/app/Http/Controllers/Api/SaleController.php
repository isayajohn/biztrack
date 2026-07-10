<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Sale;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

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

        $query = Sale::where('business_id', $business->id)->with(['product', 'customer']);

        if ($request->filled('startDate')) $query->where('sale_date', '>=', $request->startDate);
        if ($request->filled('endDate')) $query->where('sale_date', '<=', $request->endDate);
        if ($request->filled('paymentMethod')) $query->where('payment_method', $request->paymentMethod);
        if ($request->filled('productId')) $query->where('product_id', $request->productId);
        if ($request->filled('customerId')) $query->where('customer_id', $request->customerId);

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
            'customerId' => 'nullable|uuid',
            'quantity' => 'required|integer|min:1',
            'unitPrice' => 'required|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'taxRate' => 'nullable|numeric|min:0|max:100',
            'paidAmount' => 'nullable|numeric|min:0',
            'paymentDueDate' => 'nullable|date',
            'paymentMethod' => 'required|in:CASH,MOBILE_MONEY,BANK,CREDIT',
            'saleDate' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        $totalAmount = $data['quantity'] * $data['unitPrice'];
        $discount = (float) ($data['discount'] ?? 0);
        if ($discount > $totalAmount) {
            return response()->json(['success' => false, 'error' => 'Discount cannot exceed the sale subtotal'], 422);
        }
        $taxRate = (float) ($data['taxRate'] ?? $business->default_tax_rate ?? 0);
        $taxAmount = round(($totalAmount - $discount) * $taxRate / 100, 2);
        $netAmount = $totalAmount - $discount + $taxAmount;
        $paidAmount = array_key_exists('paidAmount', $data)
            ? (float) $data['paidAmount']
            : ($data['paymentMethod'] === 'CREDIT' ? 0 : $netAmount);
        if ($paidAmount > $netAmount) {
            return response()->json(['success' => false, 'error' => 'Paid amount cannot exceed the amount due'], 422);
        }
        $balanceDue = $netAmount - $paidAmount;

        $customer = null;
        if (!empty($data['customerId'])) {
            $customer = Customer::where('id', $data['customerId'])->where('business_id', $business->id)->first();
            if (!$customer || !$customer->is_active) {
                return response()->json(['success' => false, 'error' => 'Active customer not found'], 422);
            }
        }
        if ($balanceDue > 0 && !$customer) {
            return response()->json(['success' => false, 'error' => 'Select a customer when recording an unpaid or credit sale'], 422);
        }
        if ($customer && $balanceDue > 0 && (float) $customer->credit_limit > 0
            && (float) $customer->credit_balance + $balanceDue > (float) $customer->credit_limit) {
            return response()->json(['success' => false, 'error' => 'This sale exceeds the customer credit limit'], 422);
        }

        $sale = DB::transaction(function () use ($business, $customer, $data, $totalAmount, $discount, $taxRate, $taxAmount, $paidAmount, $balanceDue) {
            if (!empty($data['productId'])) {
                $product = Product::where('id', $data['productId'])->where('business_id', $business->id)->lockForUpdate()->firstOrFail();
                if ($product->stock_quantity < $data['quantity']) {
                    abort(422, 'Insufficient stock');
                }
                $product->decrement('stock_quantity', $data['quantity']);
            }

            $sequence = Sale::where('business_id', $business->id)->lockForUpdate()->count() + 1;
            $sale = Sale::create([
                'id' => Str::uuid(),
                'business_id' => $business->id,
                'customer_id' => $customer?->id,
                'customer_name' => $customer?->name,
                'receipt_number' => sprintf('BT-%s-%05d', now()->format('Ym'), $sequence),
                'product_id' => $data['productId'] ?? null,
                'quantity' => $data['quantity'],
                'unit_price' => $data['unitPrice'],
                'total_amount' => $totalAmount,
                'discount' => $discount,
                'tax_rate' => $taxRate,
                'tax_amount' => $taxAmount,
                'paid_amount' => $paidAmount,
                'payment_due_date' => $balanceDue > 0 ? ($data['paymentDueDate'] ?? null) : null,
                'payment_method' => $data['paymentMethod'],
                'sale_date' => $data['saleDate'],
                'notes' => $data['notes'] ?? null,
                'created_by' => auth()->id(),
            ]);

            if ($customer && $balanceDue > 0) {
                $customer->increment('credit_balance', $balanceDue);
            }
            return $sale;
        });

        AuditService::log([
            'actor_id' => auth()->id(),
            'action' => 'SALE_CREATED',
            'target_type' => 'Sale',
            'target_id' => $sale->id,
        ]);

        return response()->json(['success' => true, 'data' => $this->formatSale($sale->load(['product', 'customer']))], 201);
    }

    public function getSale(Request $request, string $id): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) return response()->json(['success' => false, 'error' => 'Not found'], 404);

        $sale = Sale::where('id', $id)->where('business_id', $business->id)->with(['product', 'customer'])->first();
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
            'customerId' => 'nullable|uuid',
            'discount' => 'sometimes|numeric|min:0',
            'taxRate' => 'sometimes|numeric|min:0|max:100',
            'paidAmount' => 'sometimes|numeric|min:0',
            'paymentDueDate' => 'nullable|date',
            'paymentMethod' => 'sometimes|in:CASH,MOBILE_MONEY,BANK,CREDIT',
            'saleDate' => 'sometimes|date',
            'notes' => 'nullable|string',
        ]);

        $quantity = $data['quantity'] ?? $sale->quantity;
        $unitPrice = $data['unitPrice'] ?? $sale->unit_price;
        $totalAmount = $quantity * $unitPrice;
        $discount = (float) ($data['discount'] ?? $sale->discount);
        $taxRate = (float) ($data['taxRate'] ?? $sale->tax_rate);
        $taxAmount = round(($totalAmount - $discount) * $taxRate / 100, 2);
        $paidAmount = (float) ($data['paidAmount'] ?? $sale->paid_amount);
        if ($discount > $totalAmount || $paidAmount > $totalAmount - $discount + $taxAmount) {
            return response()->json(['success' => false, 'error' => 'Discount or paid amount is greater than the sale amount'], 422);
        }

        $oldBalance = max(0, (float) $sale->total_amount - (float) $sale->discount + (float) $sale->tax_amount - (float) $sale->paid_amount);
        $newBalance = max(0, $totalAmount - $discount + $taxAmount - $paidAmount);
        $customerId = array_key_exists('customerId', $data) ? $data['customerId'] : $sale->customer_id;
        $customer = $customerId ? Customer::where('id', $customerId)->where('business_id', $business->id)->first() : null;
        if ($newBalance > 0 && !$customer) {
            return response()->json(['success' => false, 'error' => 'Select a customer for an unpaid sale'], 422);
        }
        if ($customer && $newBalance > 0) {
            $existingCustomerBalance = (float) $customer->credit_balance;
            if ($sale->customer_id === $customer->id) $existingCustomerBalance -= $oldBalance;
            if ((float) $customer->credit_limit > 0 && $existingCustomerBalance + $newBalance > (float) $customer->credit_limit) {
                return response()->json(['success' => false, 'error' => 'This sale exceeds the customer credit limit'], 422);
            }
        }

        DB::transaction(function () use ($sale, $data, $quantity, $unitPrice, $totalAmount, $discount, $taxRate, $taxAmount, $paidAmount, $oldBalance, $newBalance, $customer) {
            if ($sale->product_id && $quantity !== (int) $sale->quantity) {
                $product = Product::where('id', $sale->product_id)->lockForUpdate()->first();
                $difference = $quantity - (int) $sale->quantity;
                if ($difference > 0 && (!$product || $product->stock_quantity < $difference)) {
                    abort(422, 'Insufficient stock');
                }
                if ($product && $difference > 0) $product->decrement('stock_quantity', $difference);
                if ($product && $difference < 0) $product->increment('stock_quantity', abs($difference));
            }
            if ($sale->customer_id && $oldBalance > 0) {
                Customer::where('id', $sale->customer_id)->decrement('credit_balance', $oldBalance);
            }
            if ($customer && $newBalance > 0) {
                $customer->increment('credit_balance', $newBalance);
            }
            $sale->update([
                'customer_id' => $customer?->id,
                'customer_name' => $customer?->name,
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'total_amount' => $totalAmount,
                'discount' => $discount,
                'tax_rate' => $taxRate,
                'tax_amount' => $taxAmount,
                'paid_amount' => $paidAmount,
                'payment_due_date' => $newBalance > 0 ? ($data['paymentDueDate'] ?? $sale->payment_due_date) : null,
                'payment_method' => $data['paymentMethod'] ?? $sale->payment_method,
                'sale_date' => $data['saleDate'] ?? $sale->sale_date,
                'notes' => array_key_exists('notes', $data) ? $data['notes'] : $sale->notes,
            ]);
        });

        AuditService::log([
            'actor_id' => auth()->id(),
            'action' => 'SALE_UPDATED',
            'target_type' => 'Sale',
            'target_id' => $sale->id,
        ]);

        return response()->json(['success' => true, 'data' => $this->formatSale($sale->fresh()->load(['product', 'customer']))]);
    }

    public function deleteSale(Request $request, string $id): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) return response()->json(['success' => false, 'error' => 'Not found'], 404);

        $sale = Sale::where('id', $id)->where('business_id', $business->id)->first();
        if (!$sale) return response()->json(['success' => false, 'error' => 'Sale not found'], 404);

        DB::transaction(function () use ($sale) {
            $balance = max(0, (float) $sale->total_amount - (float) $sale->discount + (float) $sale->tax_amount - (float) $sale->paid_amount);
            if ($sale->customer_id && $balance > 0) {
                Customer::where('id', $sale->customer_id)->decrement('credit_balance', $balance);
            }
            if ($sale->product_id) {
                Product::where('id', $sale->product_id)->increment('stock_quantity', $sale->quantity);
            }
            $sale->delete();
        });

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
            'receiptNumber' => $s->receipt_number,
            'customerId' => $s->customer_id,
            'customerName' => $s->customer?->name ?? $s->customer_name,
            'productId' => $s->product_id,
            'quantity' => $s->quantity,
            'unitPrice' => (float) $s->unit_price,
            'totalAmount' => (float) $s->total_amount,
            'discount' => (float) $s->discount,
            'taxRate' => (float) $s->tax_rate,
            'taxAmount' => (float) $s->tax_amount,
            'paidAmount' => (float) $s->paid_amount,
            'balanceDue' => max(0, (float) $s->total_amount - (float) $s->discount + (float) $s->tax_amount - (float) $s->paid_amount),
            'paymentDueDate' => $s->payment_due_date?->format('Y-m-d'),
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
