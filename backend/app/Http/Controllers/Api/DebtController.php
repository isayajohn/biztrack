<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Business;
use App\Models\Customer;
use App\Models\Debt;
use App\Models\DebtAttachment;
use App\Models\DebtPayment;
use App\Models\Supplier;
use App\Services\AuditService;
use App\Services\DebtService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DebtController extends Controller
{
    public function __construct(private DebtService $debtService) {}

    private function getBusiness(): ?Business
    {
        return Business::forUser(auth()->user());
    }

    public function index(Request $request): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) return response()->json(['success' => true, 'data' => ['debts' => [], 'total' => 0]]);

        $query = Debt::where('business_id', $business->id)->with(['customer', 'supplier']);

        if ($request->filled('type')) $query->where('type', $request->type);
        if ($request->filled('customerId')) $query->where('customer_id', $request->customerId);
        if ($request->filled('supplierId')) $query->where('supplier_id', $request->supplierId);
        if ($request->filled('branchId')) $query->where('branch_id', $request->branchId);
        if ($request->filled('status')) $query->where('status', $request->status);
        if ($request->filled('debtDateFrom')) $query->where('debt_date', '>=', $request->debtDateFrom);
        if ($request->filled('debtDateTo')) $query->where('debt_date', '<=', $request->debtDateTo);
        if ($request->filled('dueDateFrom')) $query->where('due_date', '>=', $request->dueDateFrom);
        if ($request->filled('dueDateTo')) $query->where('due_date', '<=', $request->dueDateTo);

        if ($request->filled('overduePeriod')) {
            $query->whereNotNull('due_date')->where('outstanding_balance', '>', 0);
            match ($request->overduePeriod) {
                'NOT_DUE' => $query->whereRaw('DATEDIFF(CURDATE(), due_date) < 0'),
                '1_7' => $query->whereRaw('DATEDIFF(CURDATE(), due_date) BETWEEN 1 AND 7'),
                '8_30' => $query->whereRaw('DATEDIFF(CURDATE(), due_date) BETWEEN 8 AND 30'),
                '31_60' => $query->whereRaw('DATEDIFF(CURDATE(), due_date) BETWEEN 31 AND 60'),
                '61_90' => $query->whereRaw('DATEDIFF(CURDATE(), due_date) BETWEEN 61 AND 90'),
                'OVER_90' => $query->whereRaw('DATEDIFF(CURDATE(), due_date) > 90'),
                default => null,
            };
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('debt_number', 'like', "%{$search}%")
                    ->orWhereHas('customer', fn ($c) => $c->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('supplier', fn ($s) => $s->where('name', 'like', "%{$search}%"));
            });
        }

        $sortable = ['debtDate' => 'debt_date', 'dueDate' => 'due_date', 'originalAmount' => 'original_amount', 'outstandingBalance' => 'outstanding_balance', 'debtNumber' => 'debt_number', 'createdAt' => 'created_at'];
        $sortBy = $sortable[$request->get('sortBy')] ?? 'debt_date';
        $sortDir = strtolower($request->get('sortDir', 'desc')) === 'asc' ? 'asc' : 'desc';

        $total = $query->count();
        $page = (int) $request->get('page', 1);
        $limit = (int) $request->get('limit', 50);
        $debts = $query->orderBy($sortBy, $sortDir)->orderByDesc('created_at')
            ->skip(($page - 1) * $limit)->take($limit)->get();

        return response()->json([
            'success' => true,
            'data' => [
                'debts' => $debts->map(fn ($d) => $this->formatDebt($d)),
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) return response()->json(['success' => false, 'error' => 'Business not found'], 404);

        $data = $request->validate([
            'type' => 'required|in:CUSTOMER,SUPPLIER',
            'customerId' => 'required_if:type,CUSTOMER|nullable|uuid',
            'supplierId' => 'required_if:type,SUPPLIER|nullable|uuid',
            'originalAmount' => 'required|numeric|min:0.01',
            'debtDate' => 'required|date',
            'dueDate' => 'nullable|date',
            'description' => 'nullable|string|max:2000',
            'notes' => 'nullable|string|max:2000',
            'status' => 'nullable|in:DRAFT,ACTIVE',
        ]);

        if (!empty($data['customerId']) && !Customer::where('id', $data['customerId'])->where('business_id', $business->id)->exists()) {
            return response()->json(['success' => false, 'error' => 'Customer not found'], 422);
        }
        if (!empty($data['supplierId']) && !Supplier::where('id', $data['supplierId'])->where('business_id', $business->id)->exists()) {
            return response()->json(['success' => false, 'error' => 'Supplier not found'], 422);
        }

        $debt = $this->debtService->createManual([
            ...$data,
            'businessId' => $business->id,
            'branchId' => $business->branchIdForUser(auth()->user(), $request->header('X-Branch-Id')),
        ], auth()->id());

        return response()->json(['success' => true, 'data' => $this->formatDebt($debt->load(['customer', 'supplier']))], 201);
    }

    public function show(string $id): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) return response()->json(['success' => false, 'error' => 'Not found'], 404);

        $debt = Debt::where('id', $id)->where('business_id', $business->id)
            ->with(['customer', 'supplier', 'sale', 'purchaseOrder', 'payments' => fn ($q) => $q->orderByDesc('payment_date'), 'reminders' => fn ($q) => $q->orderByDesc('scheduled_for'), 'attachments'])
            ->first();
        if (!$debt) return response()->json(['success' => false, 'error' => 'Debt not found'], 404);

        return response()->json(['success' => true, 'data' => $this->formatDebtDetail($debt)]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) return response()->json(['success' => false, 'error' => 'Not found'], 404);

        $debt = Debt::where('id', $id)->where('business_id', $business->id)->first();
        if (!$debt) return response()->json(['success' => false, 'error' => 'Debt not found'], 404);
        if (in_array($debt->status, ['PAID', 'CANCELLED', 'WRITTEN_OFF'], true)) {
            return response()->json(['success' => false, 'error' => "Cannot edit a debt with status {$debt->status}"], 422);
        }

        $data = $request->validate([
            'dueDate' => 'nullable|date',
            'description' => 'nullable|string|max:2000',
            'notes' => 'nullable|string|max:2000',
        ]);

        $debt->update([
            'due_date' => array_key_exists('dueDate', $data) ? $data['dueDate'] : $debt->due_date,
            'description' => array_key_exists('description', $data) ? $data['description'] : $debt->description,
            'notes' => array_key_exists('notes', $data) ? $data['notes'] : $debt->notes,
        ]);
        $debt->recalculateBalance();
        $debt->save();

        AuditService::log(['actor_id' => auth()->id(), 'action' => 'DEBT_UPDATED', 'target_type' => 'Debt', 'target_id' => $debt->id]);

        return response()->json(['success' => true, 'data' => $this->formatDebt($debt->fresh()->load(['customer', 'supplier']))]);
    }

    public function destroy(string $id): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) return response()->json(['success' => false, 'error' => 'Not found'], 404);

        $debt = Debt::where('id', $id)->where('business_id', $business->id)->first();
        if (!$debt) return response()->json(['success' => false, 'error' => 'Debt not found'], 404);
        if ($debt->status !== 'DRAFT') {
            return response()->json(['success' => false, 'error' => 'Only draft debts can be deleted'], 422);
        }

        $debt->delete();
        AuditService::log(['actor_id' => auth()->id(), 'action' => 'DEBT_DELETED', 'target_type' => 'Debt', 'target_id' => $id]);

        return response()->json(['success' => true, 'data' => ['message' => 'Debt deleted']]);
    }

    public function cancel(Request $request, string $id): JsonResponse
    {
        $debt = $this->findDebt($id);
        if ($debt instanceof JsonResponse) return $debt;

        $data = $request->validate(['reason' => 'required|string|max:1000']);
        try {
            $this->debtService->cancel($debt, $data['reason'], auth()->id());
        } catch (\RuntimeException $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 422);
        }

        return response()->json(['success' => true, 'data' => $this->formatDebt($debt->fresh()->load(['customer', 'supplier']))]);
    }

    public function writeOff(Request $request, string $id): JsonResponse
    {
        $debt = $this->findDebt($id);
        if ($debt instanceof JsonResponse) return $debt;

        $data = $request->validate(['reason' => 'required|string|max:1000']);
        $this->debtService->writeOff($debt, $data['reason'], auth()->id());

        return response()->json(['success' => true, 'data' => $this->formatDebt($debt->fresh()->load(['customer', 'supplier']))]);
    }

    public function dispute(Request $request, string $id): JsonResponse
    {
        $debt = $this->findDebt($id);
        if ($debt instanceof JsonResponse) return $debt;

        $data = $request->validate(['reason' => 'required|string|max:1000']);
        $this->debtService->dispute($debt, $data['reason'], auth()->id());

        return response()->json(['success' => true, 'data' => $this->formatDebt($debt->fresh()->load(['customer', 'supplier']))]);
    }

    public function activity(string $id): JsonResponse
    {
        $debt = $this->findDebt($id);
        if ($debt instanceof JsonResponse) return $debt;

        $logs = AuditLog::where('target_type', 'Debt')->where('target_id', $debt->id)
            ->with('actor')->orderByDesc('created_at')->get();

        return response()->json(['success' => true, 'data' => ['activity' => $logs->map(fn ($log) => [
            'id' => $log->id,
            'action' => $log->action,
            'actor' => $log->actor?->name,
            'metadata' => $log->metadata,
            'createdAt' => $log->created_at,
        ])]]);
    }

    public function uploadAttachment(Request $request, string $id): JsonResponse
    {
        $debt = $this->findDebt($id);
        if ($debt instanceof JsonResponse) return $debt;

        $data = $request->validate(['file' => 'required|file|max:10240']);
        $file = $data['file'];
        $fileName = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('debt-attachments', $fileName, 'public');

        $attachment = DebtAttachment::create([
            'id' => Str::uuid(),
            'business_id' => $debt->business_id,
            'debt_id' => $debt->id,
            'file_path' => $path,
            'file_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getClientMimeType(),
            'file_size' => $file->getSize(),
            'uploaded_by' => auth()->id(),
        ]);

        return response()->json(['success' => true, 'data' => $this->formatAttachment($attachment)], 201);
    }

    public function downloadAttachment(string $id, string $attachmentId)
    {
        $debt = $this->findDebt($id);
        if ($debt instanceof JsonResponse) return $debt;

        $attachment = DebtAttachment::where('id', $attachmentId)->where('debt_id', $debt->id)->first();
        if (!$attachment || !Storage::disk('public')->exists($attachment->file_path)) {
            return response()->json(['success' => false, 'error' => 'Attachment not found'], 404);
        }

        return Storage::disk('public')->download($attachment->file_path, $attachment->file_name);
    }

    public function overview(Request $request): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) return response()->json(['success' => false, 'error' => 'Business not found'], 404);

        $openStatuses = ['ACTIVE', 'PARTIALLY_PAID', 'OVERDUE', 'DISPUTED'];
        $businessId = $business->id;

        $totalCustomerDebts = Debt::where('business_id', $businessId)->where('type', 'CUSTOMER')->whereIn('status', $openStatuses)->sum('outstanding_balance');
        $totalSupplierDebts = Debt::where('business_id', $businessId)->where('type', 'SUPPLIER')->whereIn('status', $openStatuses)->sum('outstanding_balance');
        $customerOverdue = Debt::where('business_id', $businessId)->where('type', 'CUSTOMER')->where('status', 'OVERDUE')->sum('outstanding_balance');
        $supplierOverdue = Debt::where('business_id', $businessId)->where('type', 'SUPPLIER')->where('status', 'OVERDUE')->sum('outstanding_balance');

        $monthStart = now()->startOfMonth();
        $collectedThisMonth = DebtPayment::where('business_id', $businessId)->whereNull('reversed_at')
            ->where('payment_date', '>=', $monthStart)
            ->whereHas('debt', fn ($q) => $q->where('type', 'CUSTOMER'))
            ->sum('amount');
        $paidToSuppliersThisMonth = DebtPayment::where('business_id', $businessId)->whereNull('reversed_at')
            ->where('payment_date', '>=', $monthStart)
            ->whereHas('debt', fn ($q) => $q->where('type', 'SUPPLIER'))
            ->sum('amount');

        $dueTodayQuery = fn () => Debt::where('business_id', $businessId)->whereIn('status', $openStatuses)
            ->whereDate('due_date', now()->toDateString());
        $dueWithin7Query = fn () => Debt::where('business_id', $businessId)->whereIn('status', $openStatuses)
            ->whereBetween('due_date', [now()->toDateString(), now()->addDays(7)->toDateString()]);

        $recentPayments = DebtPayment::where('business_id', $businessId)->whereNull('reversed_at')
            ->with(['debt.customer', 'debt.supplier'])->orderByDesc('payment_date')->orderByDesc('created_at')->limit(10)->get();

        $topCustomers = Debt::where('business_id', $businessId)->where('type', 'CUSTOMER')->whereIn('status', $openStatuses)
            ->selectRaw('customer_id, SUM(outstanding_balance) as total')
            ->groupBy('customer_id')->orderByDesc('total')->limit(10)->with('customer')->get();
        $topSuppliers = Debt::where('business_id', $businessId)->where('type', 'SUPPLIER')->whereIn('status', $openStatuses)
            ->selectRaw('supplier_id, SUM(outstanding_balance) as total')
            ->groupBy('supplier_id')->orderByDesc('total')->limit(10)->with('supplier')->get();

        return response()->json(['success' => true, 'data' => [
            'totalCustomerDebts' => (float) $totalCustomerDebts,
            'totalSupplierDebts' => (float) $totalSupplierDebts,
            'customerOverdueAmount' => (float) $customerOverdue,
            'supplierOverdueAmount' => (float) $supplierOverdue,
            'collectedThisMonth' => (float) $collectedThisMonth,
            'paidToSuppliersThisMonth' => (float) $paidToSuppliersThisMonth,
            'debtsDueToday' => $dueTodayQuery()->count(),
            'debtsDueWithin7Days' => $dueWithin7Query()->count(),
            'recentPayments' => $recentPayments->map(fn ($p) => [
                'id' => $p->id,
                'debtNumber' => $p->debt?->debt_number,
                'party' => $p->debt?->customer?->name ?? $p->debt?->supplier?->name,
                'amount' => (float) $p->amount,
                'paymentDate' => $p->payment_date?->format('Y-m-d'),
                'paymentMethod' => $p->payment_method,
            ]),
            'topCustomers' => $topCustomers->map(fn ($row) => [
                'customerId' => $row->customer_id,
                'name' => $row->customer?->name,
                'outstandingBalance' => (float) $row->total,
            ]),
            'topSuppliers' => $topSuppliers->map(fn ($row) => [
                'supplierId' => $row->supplier_id,
                'name' => $row->supplier?->name,
                'outstandingBalance' => (float) $row->total,
            ]),
        ]]);
    }

    public function agingReport(Request $request): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) return response()->json(['success' => false, 'error' => 'Business not found'], 404);

        $query = Debt::where('business_id', $business->id)->where('outstanding_balance', '>', 0)
            ->whereNotIn('status', ['DRAFT', 'PAID', 'CANCELLED', 'WRITTEN_OFF']);
        if ($request->filled('type')) $query->where('type', $request->type);

        $debts = $query->with(['customer', 'supplier'])->get();

        $buckets = [
            'NOT_DUE' => ['label' => 'Not yet due', 'count' => 0, 'amount' => 0.0],
            '1_7' => ['label' => '1-7 days overdue', 'count' => 0, 'amount' => 0.0],
            '8_30' => ['label' => '8-30 days overdue', 'count' => 0, 'amount' => 0.0],
            '31_60' => ['label' => '31-60 days overdue', 'count' => 0, 'amount' => 0.0],
            '61_90' => ['label' => '61-90 days overdue', 'count' => 0, 'amount' => 0.0],
            'OVER_90' => ['label' => 'More than 90 days overdue', 'count' => 0, 'amount' => 0.0],
        ];

        foreach ($debts as $debt) {
            $daysOverdue = $debt->due_date ? (int) round((strtotime(now()->toDateString()) - strtotime($debt->due_date->toDateString())) / 86400) : -1;
            $bucket = match (true) {
                $daysOverdue <= 0 => 'NOT_DUE',
                $daysOverdue <= 7 => '1_7',
                $daysOverdue <= 30 => '8_30',
                $daysOverdue <= 60 => '31_60',
                $daysOverdue <= 90 => '61_90',
                default => 'OVER_90',
            };
            $buckets[$bucket]['count']++;
            $buckets[$bucket]['amount'] += (float) $debt->outstanding_balance;
        }

        return response()->json(['success' => true, 'data' => ['buckets' => array_values($buckets)]]);
    }

    private function findDebt(string $id): Debt|JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) return response()->json(['success' => false, 'error' => 'Not found'], 404);

        $debt = Debt::where('id', $id)->where('business_id', $business->id)->first();
        if (!$debt) return response()->json(['success' => false, 'error' => 'Debt not found'], 404);

        return $debt;
    }

    private function formatDebt(Debt $d): array
    {
        return [
            'id' => $d->id,
            'debtNumber' => $d->debt_number,
            'type' => $d->type,
            'status' => $d->status,
            'source' => $d->source,
            'businessId' => $d->business_id,
            'branchId' => $d->branch_id,
            'customer' => $d->customer?->id ? ['id' => $d->customer->id, 'name' => $d->customer->name, 'phone' => $d->customer->phone] : null,
            'supplier' => $d->supplier?->id ? ['id' => $d->supplier->id, 'name' => $d->supplier->name, 'phone' => $d->supplier->phone] : null,
            'saleId' => $d->sale_id,
            'purchaseOrderId' => $d->purchase_order_id,
            'originalAmount' => (float) $d->original_amount,
            'totalPaid' => (float) $d->total_paid,
            'outstandingBalance' => (float) $d->outstanding_balance,
            'debtDate' => $d->debt_date?->format('Y-m-d'),
            'dueDate' => $d->due_date?->format('Y-m-d'),
            'description' => $d->description,
            'notes' => $d->notes,
            'isOverdue' => $d->isOverdue(),
            'createdAt' => $d->created_at,
            'updatedAt' => $d->updated_at,
        ];
    }

    private function formatDebtDetail(Debt $d): array
    {
        return [
            ...$this->formatDebt($d),
            'sale' => $d->sale ? ['id' => $d->sale->id, 'receiptNumber' => $d->sale->receipt_number, 'totalAmount' => (float) $d->sale->total_amount] : null,
            'purchaseOrder' => $d->purchaseOrder ? ['id' => $d->purchaseOrder->id, 'orderNumber' => $d->purchaseOrder->order_number, 'totalAmount' => (float) $d->purchaseOrder->total_amount] : null,
            'payments' => $d->payments->map(fn ($p) => [
                'id' => $p->id,
                'amount' => (float) $p->amount,
                'paymentDate' => $p->payment_date?->format('Y-m-d'),
                'paymentMethod' => $p->payment_method,
                'transactionReference' => $p->transaction_reference,
                'notes' => $p->notes,
                'isReversed' => $p->isReversed(),
                'reversalReason' => $p->reversal_reason,
                'createdAt' => $p->created_at,
            ]),
            'reminders' => $d->reminders->map(fn ($r) => [
                'id' => $r->id,
                'channel' => $r->channel,
                'triggerType' => $r->trigger_type,
                'status' => $r->status,
                'scheduledFor' => $r->scheduled_for,
                'sentAt' => $r->sent_at,
                'failureReason' => $r->failure_reason,
            ]),
            'attachments' => $d->attachments->map(fn ($a) => $this->formatAttachment($a)),
        ];
    }

    private function formatAttachment(DebtAttachment $a): array
    {
        return [
            'id' => $a->id,
            'fileName' => $a->file_name,
            'mimeType' => $a->mime_type,
            'fileSize' => $a->file_size,
            'createdAt' => $a->created_at,
        ];
    }
}
