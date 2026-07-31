<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Debt;
use App\Models\DebtAttachment;
use App\Models\DebtPayment;
use App\Services\DebtService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DebtPaymentController extends Controller
{
    public function __construct(private DebtService $debtService) {}

    private function getBusiness(): ?Business
    {
        return Business::forUser(auth()->user());
    }

    public function index(Request $request): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) return response()->json(['success' => true, 'data' => ['payments' => [], 'total' => 0]]);

        $query = DebtPayment::where('business_id', $business->id)->with(['debt.customer', 'debt.supplier']);

        if ($request->filled('debtId')) $query->where('debt_id', $request->debtId);
        if ($request->filled('type')) $query->whereHas('debt', fn ($q) => $q->where('type', $request->type));
        if ($request->filled('paymentMethod')) $query->where('payment_method', $request->paymentMethod);
        if ($request->filled('dateFrom')) $query->where('payment_date', '>=', $request->dateFrom);
        if ($request->filled('dateTo')) $query->where('payment_date', '<=', $request->dateTo);
        if ($request->filled('includeReversed') && !filter_var($request->includeReversed, FILTER_VALIDATE_BOOLEAN)) {
            $query->whereNull('reversed_at');
        }

        $total = $query->count();
        $page = (int) $request->get('page', 1);
        $limit = (int) $request->get('limit', 50);
        $payments = $query->orderByDesc('payment_date')->orderByDesc('created_at')
            ->skip(($page - 1) * $limit)->take($limit)->get();

        return response()->json(['success' => true, 'data' => [
            'payments' => $payments->map(fn ($p) => [
                ...$this->formatPayment($p),
                'debtNumber' => $p->debt?->debt_number,
                'debtType' => $p->debt?->type,
                'party' => $p->debt?->customer?->name ?? $p->debt?->supplier?->name,
            ]),
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
        ]]);
    }

    public function store(Request $request, string $debtId): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) return response()->json(['success' => false, 'error' => 'Business not found'], 404);

        $debt = Debt::where('id', $debtId)->where('business_id', $business->id)->first();
        if (!$debt) return response()->json(['success' => false, 'error' => 'Debt not found'], 404);

        $data = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'paymentDate' => 'required|date',
            'paymentMethod' => 'required|in:CASH,MOBILE_MONEY,BANK,OTHER',
            'transactionReference' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:1000',
            'attachment' => 'nullable|file|max:10240',
        ]);

        try {
            $payment = $this->debtService->recordPayment($debt, $data, auth()->id());
        } catch (\RuntimeException $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 422);
        }

        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $fileName = Str::uuid() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('debt-attachments', $fileName, 'public');
            DebtAttachment::create([
                'id' => Str::uuid(),
                'business_id' => $debt->business_id,
                'debt_id' => $debt->id,
                'debt_payment_id' => $payment->id,
                'file_path' => $path,
                'file_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getClientMimeType(),
                'file_size' => $file->getSize(),
                'uploaded_by' => auth()->id(),
            ]);
        }

        return response()->json(['success' => true, 'data' => [
            'payment' => $this->formatPayment($payment),
            'debt' => [
                'id' => $debt->fresh()->id,
                'status' => $debt->fresh()->status,
                'totalPaid' => (float) $debt->fresh()->total_paid,
                'outstandingBalance' => (float) $debt->fresh()->outstanding_balance,
            ],
        ]], 201);
    }

    public function reverse(Request $request, string $paymentId): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) return response()->json(['success' => false, 'error' => 'Business not found'], 404);

        $payment = DebtPayment::where('id', $paymentId)->where('business_id', $business->id)->first();
        if (!$payment) return response()->json(['success' => false, 'error' => 'Payment not found'], 404);

        $data = $request->validate(['reason' => 'required|string|max:1000']);

        try {
            $payment = $this->debtService->reversePayment($payment, $data['reason'], auth()->id());
        } catch (\RuntimeException $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 422);
        }

        return response()->json(['success' => true, 'data' => $this->formatPayment($payment)]);
    }

    private function formatPayment(DebtPayment $p): array
    {
        return [
            'id' => $p->id,
            'debtId' => $p->debt_id,
            'amount' => (float) $p->amount,
            'paymentDate' => $p->payment_date?->format('Y-m-d'),
            'paymentMethod' => $p->payment_method,
            'transactionReference' => $p->transaction_reference,
            'notes' => $p->notes,
            'isReversed' => $p->isReversed(),
            'reversalReason' => $p->reversal_reason,
            'createdAt' => $p->created_at,
        ];
    }
}
