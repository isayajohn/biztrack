<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Customer;
use App\Models\Product;
use App\Models\RecurringInvoice;
use App\Models\RecurringInvoiceItem;
use App\Services\AuditService;
use App\Services\RecurringInvoiceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RecurringInvoiceController extends Controller
{
    public function __construct(private RecurringInvoiceService $recurringInvoiceService) {}

    private function getBusiness(): ?Business
    {
        return Business::forUser(auth()->user());
    }

    public function index(Request $request): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) return response()->json(['success' => true, 'data' => ['recurringInvoices' => []]]);

        $query = RecurringInvoice::where('business_id', $business->id)->with(['customer', 'items.product']);
        if ($request->filled('status')) $query->where('status', $request->status);
        if ($request->filled('customerId')) $query->where('customer_id', $request->customerId);

        $recurringInvoices = $query->orderByDesc('created_at')->get();

        return response()->json(['success' => true, 'data' => ['recurringInvoices' => $recurringInvoices->map(fn ($r) => $this->format($r))]]);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $recurringInvoice = $this->find($id);
        if (!$recurringInvoice) return response()->json(['success' => false, 'error' => 'Recurring invoice not found'], 404);

        return response()->json(['success' => true, 'data' => $this->format($recurringInvoice)]);
    }

    public function store(Request $request): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) return response()->json(['success' => false, 'error' => 'Business not found'], 404);

        $data = $request->validate($this->rules());

        [$customer, $error] = $this->resolveReferences($business, $data);
        if ($error) return $error;

        $recurringInvoice = DB::transaction(function () use ($business, $customer, $data) {
            $recurringInvoice = RecurringInvoice::create([
                'id' => Str::uuid(),
                'business_id' => $business->id,
                'branch_id' => $business->branchIdForUser(auth()->user(), request()->header('X-Branch-Id')),
                'customer_id' => $customer->id,
                'frequency' => $data['frequency'],
                'start_date' => $data['startDate'],
                'next_run_date' => $data['startDate'],
                'end_date' => $data['endDate'] ?? null,
                'payment_method' => $data['paymentMethod'],
                'discount' => $data['discount'] ?? 0,
                'tax_rate' => $data['taxRate'] ?? null,
                'notes' => $data['notes'] ?? null,
                'created_by' => auth()->id(),
            ]);

            foreach ($data['items'] as $item) {
                RecurringInvoiceItem::create([
                    'id' => Str::uuid(),
                    'recurring_invoice_id' => $recurringInvoice->id,
                    'product_id' => $item['productId'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unitPrice'],
                ]);
            }

            return $recurringInvoice;
        });

        AuditService::log([
            'actor_id' => auth()->id(),
            'action' => 'RECURRING_INVOICE_CREATED',
            'target_type' => 'RecurringInvoice',
            'target_id' => $recurringInvoice->id,
        ]);

        return response()->json(['success' => true, 'data' => $this->format($recurringInvoice->load(['customer', 'items.product']))], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $business = $this->getBusiness();
        $recurringInvoice = $this->find($id);
        if (!$business || !$recurringInvoice) return response()->json(['success' => false, 'error' => 'Recurring invoice not found'], 404);

        $data = $request->validate($this->rules());

        [$customer, $error] = $this->resolveReferences($business, $data);
        if ($error) return $error;

        DB::transaction(function () use ($recurringInvoice, $customer, $data) {
            $recurringInvoice->update([
                'customer_id' => $customer->id,
                'frequency' => $data['frequency'],
                'start_date' => $data['startDate'],
                'next_run_date' => $recurringInvoice->generated_count === 0 ? $data['startDate'] : $recurringInvoice->next_run_date,
                'end_date' => $data['endDate'] ?? null,
                'payment_method' => $data['paymentMethod'],
                'discount' => $data['discount'] ?? 0,
                'tax_rate' => $data['taxRate'] ?? null,
                'notes' => $data['notes'] ?? null,
            ]);

            $recurringInvoice->items()->delete();
            foreach ($data['items'] as $item) {
                RecurringInvoiceItem::create([
                    'id' => Str::uuid(),
                    'recurring_invoice_id' => $recurringInvoice->id,
                    'product_id' => $item['productId'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unitPrice'],
                ]);
            }
        });

        AuditService::log([
            'actor_id' => auth()->id(),
            'action' => 'RECURRING_INVOICE_UPDATED',
            'target_type' => 'RecurringInvoice',
            'target_id' => $recurringInvoice->id,
        ]);

        return response()->json(['success' => true, 'data' => $this->format($recurringInvoice->fresh(['customer', 'items.product']))]);
    }

    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $recurringInvoice = $this->find($id);
        if (!$recurringInvoice) return response()->json(['success' => false, 'error' => 'Recurring invoice not found'], 404);

        $data = $request->validate(['status' => 'required|in:ACTIVE,PAUSED']);
        $recurringInvoice->update(['status' => $data['status']]);

        AuditService::log([
            'actor_id' => auth()->id(),
            'action' => 'RECURRING_INVOICE_' . $data['status'],
            'target_type' => 'RecurringInvoice',
            'target_id' => $recurringInvoice->id,
        ]);

        return response()->json(['success' => true, 'data' => $this->format($recurringInvoice->fresh(['customer', 'items.product']))]);
    }

    public function runNow(Request $request, string $id): JsonResponse
    {
        $recurringInvoice = $this->find($id);
        if (!$recurringInvoice) return response()->json(['success' => false, 'error' => 'Recurring invoice not found'], 404);

        try {
            $sale = $this->recurringInvoiceService->generateOne($recurringInvoice);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 422);
        }

        return response()->json(['success' => true, 'data' => [
            'recurringInvoice' => $this->format($recurringInvoice->fresh(['customer', 'items.product'])),
            'saleId' => $sale->id,
            'receiptNumber' => $sale->receipt_number,
        ]]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $recurringInvoice = $this->find($id);
        if (!$recurringInvoice) return response()->json(['success' => false, 'error' => 'Recurring invoice not found'], 404);

        $recurringInvoice->delete();

        AuditService::log([
            'actor_id' => auth()->id(),
            'action' => 'RECURRING_INVOICE_DELETED',
            'target_type' => 'RecurringInvoice',
            'target_id' => $id,
        ]);

        return response()->json(['success' => true, 'data' => ['message' => 'Recurring invoice deleted']]);
    }

    private function find(string $id): ?RecurringInvoice
    {
        $business = $this->getBusiness();
        if (!$business) return null;

        return RecurringInvoice::where('id', $id)->where('business_id', $business->id)->with(['customer', 'items.product'])->first();
    }

    private function rules(): array
    {
        return [
            'customerId' => 'required|uuid',
            'frequency' => 'required|in:WEEKLY,MONTHLY,QUARTERLY',
            'startDate' => 'required|date',
            'endDate' => 'nullable|date|after:startDate',
            'paymentMethod' => 'required|in:CASH,MOBILE_MONEY,BANK,CREDIT',
            'discount' => 'nullable|numeric|min:0',
            'taxRate' => 'nullable|numeric|min:0|max:100',
            'notes' => 'nullable|string|max:2000',
            'items' => 'required|array|min:1',
            'items.*.productId' => 'required|uuid|distinct',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unitPrice' => 'required|numeric|min:0',
        ];
    }

    /** @return array{0: ?Customer, 1: ?JsonResponse} */
    private function resolveReferences(Business $business, array $data): array
    {
        $customer = Customer::where('id', $data['customerId'])->where('business_id', $business->id)->where('is_active', true)->first();
        if (!$customer) {
            return [null, response()->json(['success' => false, 'error' => 'Active customer not found'], 422)];
        }

        $productIds = collect($data['items'])->pluck('productId');
        $found = Product::where('business_id', $business->id)->whereIn('id', $productIds)->count();
        if ($found !== $productIds->unique()->count()) {
            return [null, response()->json(['success' => false, 'error' => 'One or more products were not found'], 422)];
        }

        return [$customer, null];
    }

    private function format(RecurringInvoice $r): array
    {
        return [
            'id' => $r->id,
            'businessId' => $r->business_id,
            'branchId' => $r->branch_id,
            'customerId' => $r->customer_id,
            'customerName' => $r->customer?->name,
            'frequency' => $r->frequency,
            'startDate' => $r->start_date?->format('Y-m-d'),
            'nextRunDate' => $r->next_run_date?->format('Y-m-d'),
            'lastRunDate' => $r->last_run_date?->format('Y-m-d'),
            'endDate' => $r->end_date?->format('Y-m-d'),
            'paymentMethod' => $r->payment_method,
            'discount' => (float) $r->discount,
            'taxRate' => $r->tax_rate !== null ? (float) $r->tax_rate : null,
            'notes' => $r->notes,
            'status' => $r->status,
            'generatedCount' => (int) $r->generated_count,
            'subtotal' => (float) $r->items->sum(fn ($item) => (int) $item->quantity * (float) $item->unit_price),
            'items' => $r->items->map(fn (RecurringInvoiceItem $item) => [
                'id' => $item->id,
                'productId' => $item->product_id,
                'productName' => $item->product?->name,
                'quantity' => (int) $item->quantity,
                'unitPrice' => (float) $item->unit_price,
                'total' => (float) $item->quantity * (float) $item->unit_price,
            ])->values(),
            'createdAt' => $r->created_at,
            'updatedAt' => $r->updated_at,
        ];
    }
}
