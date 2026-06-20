<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Expense;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ExpenseController extends Controller
{
    private function getBusiness(): ?Business
    {
        return Business::where('user_id', auth()->id())->first();
    }

    public function listExpenses(Request $request): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) return response()->json(['success' => true, 'data' => ['expenses' => [], 'total' => 0]]);

        $query = Expense::where('business_id', $business->id);

        if ($request->filled('startDate')) $query->where('expense_date', '>=', $request->startDate);
        if ($request->filled('endDate')) $query->where('expense_date', '<=', $request->endDate);
        if ($request->filled('category')) $query->where('category', $request->category);
        if ($request->filled('paymentMethod')) $query->where('payment_method', $request->paymentMethod);

        $total = $query->count();
        $page = (int) $request->get('page', 1);
        $limit = (int) $request->get('limit', 50);
        $expenses = $query->orderByDesc('expense_date')->orderByDesc('created_at')->skip(($page - 1) * $limit)->take($limit)->get();

        return response()->json([
            'success' => true,
            'data' => [
                'expenses' => $expenses->map(fn($e) => $this->formatExpense($e)),
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
            ],
        ]);
    }

    public function createExpense(Request $request): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) return response()->json(['success' => false, 'error' => 'Business not found'], 404);

        $data = $request->validate([
            'category' => 'required|in:STOCK_PURCHASE,RENT,TRANSPORT,SALARY,ELECTRICITY,INTERNET,FOOD,MARKETING,OTHER',
            'description' => 'required|string',
            'amount' => 'required|numeric|min:0',
            'paymentMethod' => 'required|in:CASH,MOBILE_MONEY,BANK,CREDIT',
            'expenseDate' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        $expense = Expense::create([
            'id' => Str::uuid(),
            'business_id' => $business->id,
            'category' => $data['category'],
            'description' => $data['description'],
            'amount' => $data['amount'],
            'payment_method' => $data['paymentMethod'],
            'expense_date' => $data['expenseDate'],
            'notes' => $data['notes'] ?? null,
        ]);

        AuditService::log([
            'actor_id' => auth()->id(),
            'action' => 'EXPENSE_CREATED',
            'target_type' => 'Expense',
            'target_id' => $expense->id,
        ]);

        return response()->json(['success' => true, 'data' => $this->formatExpense($expense)], 201);
    }

    public function getExpense(Request $request, string $id): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) return response()->json(['success' => false, 'error' => 'Not found'], 404);

        $expense = Expense::where('id', $id)->where('business_id', $business->id)->first();
        if (!$expense) return response()->json(['success' => false, 'error' => 'Expense not found'], 404);

        return response()->json(['success' => true, 'data' => $this->formatExpense($expense)]);
    }

    public function updateExpense(Request $request, string $id): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) return response()->json(['success' => false, 'error' => 'Not found'], 404);

        $expense = Expense::where('id', $id)->where('business_id', $business->id)->first();
        if (!$expense) return response()->json(['success' => false, 'error' => 'Expense not found'], 404);

        $data = $request->validate([
            'category' => 'sometimes|in:STOCK_PURCHASE,RENT,TRANSPORT,SALARY,ELECTRICITY,INTERNET,FOOD,MARKETING,OTHER',
            'description' => 'sometimes|string',
            'amount' => 'sometimes|numeric|min:0',
            'paymentMethod' => 'sometimes|in:CASH,MOBILE_MONEY,BANK,CREDIT',
            'expenseDate' => 'sometimes|date',
            'notes' => 'nullable|string',
        ]);

        $expense->update([
            'category' => $data['category'] ?? $expense->category,
            'description' => $data['description'] ?? $expense->description,
            'amount' => $data['amount'] ?? $expense->amount,
            'payment_method' => $data['paymentMethod'] ?? $expense->payment_method,
            'expense_date' => $data['expenseDate'] ?? $expense->expense_date,
            'notes' => array_key_exists('notes', $data) ? $data['notes'] : $expense->notes,
        ]);

        AuditService::log([
            'actor_id' => auth()->id(),
            'action' => 'EXPENSE_UPDATED',
            'target_type' => 'Expense',
            'target_id' => $expense->id,
        ]);

        return response()->json(['success' => true, 'data' => $this->formatExpense($expense->fresh())]);
    }

    public function deleteExpense(Request $request, string $id): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) return response()->json(['success' => false, 'error' => 'Not found'], 404);

        $expense = Expense::where('id', $id)->where('business_id', $business->id)->first();
        if (!$expense) return response()->json(['success' => false, 'error' => 'Expense not found'], 404);

        $expense->delete();

        AuditService::log([
            'actor_id' => auth()->id(),
            'action' => 'EXPENSE_DELETED',
            'target_type' => 'Expense',
            'target_id' => $id,
        ]);

        return response()->json(['success' => true, 'data' => ['message' => 'Expense deleted']]);
    }

    private function formatExpense(Expense $e): array
    {
        return [
            'id' => $e->id,
            'businessId' => $e->business_id,
            'category' => $e->category,
            'description' => $e->description,
            'amount' => (float) $e->amount,
            'paymentMethod' => $e->payment_method,
            'expenseDate' => $e->expense_date?->format('Y-m-d'),
            'notes' => $e->notes,
            'createdAt' => $e->created_at,
            'updatedAt' => $e->updated_at,
        ];
    }
}
