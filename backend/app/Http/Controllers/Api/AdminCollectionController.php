<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaymentTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminCollectionController extends Controller
{
    public function getCollectionStats(Request $request): JsonResponse
    {
        $totalCollected = PaymentTransaction::where('status', 'PAID')->sum('amount');
        $totalPending = PaymentTransaction::where('status', 'PENDING')->sum('amount');
        $totalFailed = PaymentTransaction::where('status', 'FAILED')->count();
        $totalTransactions = PaymentTransaction::count();

        return response()->json([
            'success' => true,
            'data' => [
                'totalCollected' => (float) $totalCollected,
                'totalPending' => (float) $totalPending,
                'totalFailed' => $totalFailed,
                'totalTransactions' => $totalTransactions,
            ],
        ]);
    }

    public function listCollections(Request $request): JsonResponse
    {
        $query = PaymentTransaction::with('business.user', 'package');

        if ($request->filled('status')) $query->where('status', $request->status);
        if ($request->filled('businessId')) $query->where('business_id', $request->businessId);

        $total = $query->count();
        $page = (int) $request->get('page', 1);
        $limit = (int) $request->get('limit', 20);
        $items = $query->orderByDesc('created_at')->skip(($page - 1) * $limit)->take($limit)->get();

        return response()->json([
            'success' => true,
            'data' => [
                'transactions' => $items->map(fn($t) => [
                    'id' => $t->id,
                    'amount' => (float) $t->amount,
                    'currency' => $t->currency,
                    'status' => $t->status,
                    'provider' => $t->provider,
                    'externalId' => $t->external_id,
                    'billingCycle' => $t->billing_cycle,
                    'paidAt' => $t->paid_at,
                    'createdAt' => $t->created_at,
                    'business' => $t->business ? ['id' => $t->business->id, 'name' => $t->business->name] : null,
                    'package' => $t->package ? ['id' => $t->package->id, 'name' => $t->package->name] : null,
                ]),
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
            ],
        ]);
    }
}
