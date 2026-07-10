<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Customer;
use App\Models\CustomerPayment;
use App\Models\Sale;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CustomerController extends Controller
{
    private function getBusiness(): ?Business
    {
        return Business::where('user_id', auth()->id())->first();
    }

    public function index(Request $request): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) {
            return response()->json(['success' => true, 'data' => ['customers' => [], 'total' => 0]]);
        }

        $query = Customer::where('business_id', $business->id)->withCount('sales');

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function ($builder) use ($search) {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('isActive')) {
            $query->where('is_active', filter_var($request->input('isActive'), FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->boolean('withCredit')) {
            $query->where('credit_balance', '>', 0);
        }

        $customers = $query->orderBy('name')->get();

        return response()->json(['success' => true, 'data' => [
            'customers' => $customers->map(fn (Customer $customer) => $this->formatCustomer($customer)),
            'total' => $customers->count(),
            'totalCreditOutstanding' => (float) $customers->sum('credit_balance'),
        ]]);
    }

    public function store(Request $request): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) {
            return response()->json(['success' => false, 'error' => 'Business not found'], 404);
        }

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string|max:1000',
            'creditLimit' => 'nullable|numeric|min:0',
            'isActive' => 'sometimes|boolean',
        ]);

        $customer = Customer::create([
            'business_id' => $business->id,
            'name' => $data['name'],
            'phone' => $data['phone'] ?? null,
            'email' => $data['email'] ?? null,
            'address' => $data['address'] ?? null,
            'credit_limit' => $data['creditLimit'] ?? 0,
            'credit_balance' => 0,
            'is_active' => $data['isActive'] ?? true,
        ]);

        AuditService::log([
            'actor_id' => auth()->id(),
            'action' => 'CUSTOMER_CREATED',
            'target_type' => 'Customer',
            'target_id' => $customer->id,
        ]);

        return response()->json(['success' => true, 'data' => $this->formatCustomer($customer)], 201);
    }

    public function show(string $id): JsonResponse
    {
        $customer = $this->findCustomer($id);
        if (!$customer) {
            return response()->json(['success' => false, 'error' => 'Customer not found'], 404);
        }

        $customer->loadCount('sales');

        return response()->json(['success' => true, 'data' => $this->formatCustomer($customer)]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $customer = $this->findCustomer($id);
        if (!$customer) {
            return response()->json(['success' => false, 'error' => 'Customer not found'], 404);
        }

        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string|max:1000',
            'creditLimit' => 'nullable|numeric|min:0',
            'isActive' => 'sometimes|boolean',
        ]);

        $customer->update([
            'name' => $data['name'] ?? $customer->name,
            'phone' => array_key_exists('phone', $data) ? $data['phone'] : $customer->phone,
            'email' => array_key_exists('email', $data) ? $data['email'] : $customer->email,
            'address' => array_key_exists('address', $data) ? $data['address'] : $customer->address,
            'credit_limit' => array_key_exists('creditLimit', $data) ? $data['creditLimit'] : $customer->credit_limit,
            'is_active' => $data['isActive'] ?? $customer->is_active,
        ]);

        AuditService::log([
            'actor_id' => auth()->id(),
            'action' => 'CUSTOMER_UPDATED',
            'target_type' => 'Customer',
            'target_id' => $customer->id,
        ]);

        return response()->json(['success' => true, 'data' => $this->formatCustomer($customer->fresh())]);
    }

    public function destroy(string $id): JsonResponse
    {
        $customer = $this->findCustomer($id);
        if (!$customer) {
            return response()->json(['success' => false, 'error' => 'Customer not found'], 404);
        }

        if ((float) $customer->credit_balance > 0) {
            return response()->json([
                'success' => false,
                'error' => 'Cannot delete a customer with outstanding credit. Record payment or deactivate the customer instead.',
            ], 422);
        }

        $customer->delete();

        AuditService::log([
            'actor_id' => auth()->id(),
            'action' => 'CUSTOMER_DELETED',
            'target_type' => 'Customer',
            'target_id' => $id,
        ]);

        return response()->json(['success' => true, 'data' => ['message' => 'Customer deleted']]);
    }

    public function statement(string $id): JsonResponse
    {
        $customer = $this->findCustomer($id);
        if (!$customer) {
            return response()->json(['success' => false, 'error' => 'Customer not found'], 404);
        }

        $creditSales = Sale::where('customer_id', $customer->id)
            ->whereRaw('total_amount - discount + tax_amount > paid_amount')
            ->orderByDesc('sale_date')
            ->get()
            ->map(fn (Sale $sale) => [
                'id' => $sale->id,
                'receiptNumber' => $sale->receipt_number,
                'date' => $sale->sale_date?->format('Y-m-d'),
                'total' => (float) $sale->total_amount - (float) $sale->discount + (float) $sale->tax_amount,
                'paid' => (float) $sale->paid_amount,
                'balance' => max(0, (float) $sale->total_amount - (float) $sale->discount + (float) $sale->tax_amount - (float) $sale->paid_amount),
                'dueDate' => $sale->payment_due_date?->format('Y-m-d'),
            ]);

        $payments = CustomerPayment::where('customer_id', $customer->id)
            ->orderByDesc('payment_date')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (CustomerPayment $payment) => $this->formatPayment($payment));

        return response()->json(['success' => true, 'data' => [
            'customer' => $this->formatCustomer($customer),
            'creditSales' => $creditSales,
            'payments' => $payments,
        ]]);
    }

    public function recordPayment(Request $request, string $id): JsonResponse
    {
        $customer = $this->findCustomer($id);
        if (!$customer) {
            return response()->json(['success' => false, 'error' => 'Customer not found'], 404);
        }

        $data = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'paymentMethod' => 'required|in:CASH,MOBILE_MONEY,BANK',
            'paymentDate' => 'required|date',
            'saleId' => 'nullable|uuid',
            'reference' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:1000',
        ]);

        if ((float) $data['amount'] > (float) $customer->credit_balance) {
            return response()->json(['success' => false, 'error' => 'Payment cannot exceed the outstanding customer balance'], 422);
        }

        if (!empty($data['saleId'])) {
            $saleExists = Sale::where('id', $data['saleId'])
                ->where('customer_id', $customer->id)
                ->where('business_id', $customer->business_id)
                ->exists();
            if (!$saleExists) {
                return response()->json(['success' => false, 'error' => 'Credit sale not found for this customer'], 422);
            }
        }

        $payment = DB::transaction(function () use ($customer, $data) {
            $payment = CustomerPayment::create([
                'business_id' => $customer->business_id,
                'customer_id' => $customer->id,
                'sale_id' => $data['saleId'] ?? null,
                'amount' => $data['amount'],
                'payment_method' => $data['paymentMethod'],
                'payment_date' => $data['paymentDate'],
                'reference' => $data['reference'] ?? null,
                'notes' => $data['notes'] ?? null,
                'created_by' => auth()->id(),
            ]);

            $remaining = (float) $data['amount'];
            $sales = Sale::where('customer_id', $customer->id)
                ->whereRaw('total_amount - discount + tax_amount > paid_amount')
                ->when(!empty($data['saleId']), fn ($query) => $query->where('id', $data['saleId']))
                ->orderBy('sale_date')
                ->lockForUpdate()
                ->get();

            foreach ($sales as $sale) {
                if ($remaining <= 0) break;
                $saleBalance = max(0, (float) $sale->total_amount - (float) $sale->discount + (float) $sale->tax_amount - (float) $sale->paid_amount);
                $applied = min($remaining, $saleBalance);
                $sale->increment('paid_amount', $applied);
                $remaining -= $applied;
            }

            $customer->decrement('credit_balance', (float) $data['amount']);
            return $payment;
        });

        AuditService::log([
            'actor_id' => auth()->id(),
            'action' => 'CUSTOMER_PAYMENT_RECORDED',
            'target_type' => 'CustomerPayment',
            'target_id' => $payment->id,
        ]);

        return response()->json(['success' => true, 'data' => [
            'payment' => $this->formatPayment($payment),
            'customer' => $this->formatCustomer($customer->fresh()),
        ]], 201);
    }

    private function findCustomer(string $id): ?Customer
    {
        $business = $this->getBusiness();
        if (!$business) return null;

        return Customer::where('id', $id)->where('business_id', $business->id)->first();
    }

    private function formatCustomer(Customer $customer): array
    {
        return [
            'id' => $customer->id,
            'name' => $customer->name,
            'phone' => $customer->phone,
            'email' => $customer->email,
            'address' => $customer->address,
            'creditLimit' => (float) $customer->credit_limit,
            'creditBalance' => (float) $customer->credit_balance,
            'availableCredit' => max(0, (float) $customer->credit_limit - (float) $customer->credit_balance),
            'isActive' => (bool) $customer->is_active,
            'salesCount' => $customer->sales_count ?? $customer->sales()->count(),
            'createdAt' => $customer->created_at,
            'updatedAt' => $customer->updated_at,
        ];
    }

    private function formatPayment(CustomerPayment $payment): array
    {
        return [
            'id' => $payment->id,
            'customerId' => $payment->customer_id,
            'saleId' => $payment->sale_id,
            'amount' => (float) $payment->amount,
            'paymentMethod' => $payment->payment_method,
            'paymentDate' => $payment->payment_date?->format('Y-m-d'),
            'reference' => $payment->reference,
            'notes' => $payment->notes,
            'createdAt' => $payment->created_at,
        ];
    }
}
