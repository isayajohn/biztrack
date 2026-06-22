<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Expense;
use App\Models\InventoryNotification;
use App\Models\Product;
use App\Models\Sale;
use App\Models\StockMovement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    private function getBusiness(): ?Business
    {
        return Business::where('user_id', auth()->id())->first();
    }

    public function getDashboard(Request $request): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) {
            return response()->json(['success' => true, 'data' => $this->emptyDashboard()]);
        }

        $now = now();
        $startOfMonth = $now->copy()->startOfMonth()->toDateString();
        $endOfMonth = $now->copy()->endOfMonth()->toDateString();
        $startOfLastMonth = $now->copy()->subMonth()->startOfMonth()->toDateString();
        $endOfLastMonth = $now->copy()->subMonth()->endOfMonth()->toDateString();

        $totalRevenue = Sale::where('business_id', $business->id)
            ->whereBetween('sale_date', [$startOfMonth, $endOfMonth])
            ->sum('total_amount');

        $lastMonthRevenue = Sale::where('business_id', $business->id)
            ->whereBetween('sale_date', [$startOfLastMonth, $endOfLastMonth])
            ->sum('total_amount');

        $totalExpenses = Expense::where('business_id', $business->id)
            ->whereBetween('expense_date', [$startOfMonth, $endOfMonth])
            ->sum('amount');

        $lastMonthExpenses = Expense::where('business_id', $business->id)
            ->whereBetween('expense_date', [$startOfLastMonth, $endOfLastMonth])
            ->sum('amount');

        $totalSalesCount = Sale::where('business_id', $business->id)
            ->whereBetween('sale_date', [$startOfMonth, $endOfMonth])
            ->count();

        $lastMonthSalesCount = Sale::where('business_id', $business->id)
            ->whereBetween('sale_date', [$startOfLastMonth, $endOfLastMonth])
            ->count();

        $totalProducts = Product::where('business_id', $business->id)->where('is_active', true)->count();
        $lowStockCount = Product::where('business_id', $business->id)
            ->where('is_active', true)
            ->whereRaw('stock_quantity <= low_stock_level')
            ->count();

        $recentSales = Sale::where('business_id', $business->id)
            ->with('product')
            ->orderByDesc('sale_date')
            ->orderByDesc('created_at')
            ->take(5)
            ->get()
            ->map(fn($s) => [
                'id' => $s->id,
                'totalAmount' => (float) $s->total_amount,
                'saleDate' => $s->sale_date?->format('Y-m-d'),
                'paymentMethod' => $s->payment_method,
                'product' => $s->product?->id ? ['name' => $s->product->name] : null,
            ]);

        $salesByDay = Sale::where('business_id', $business->id)
            ->whereBetween('sale_date', [$startOfMonth, $endOfMonth])
            ->select(DB::raw('DATE(sale_date) as date'), DB::raw('SUM(total_amount) as total'))
            ->groupBy(DB::raw('DATE(sale_date)'))
            ->orderBy('date')
            ->get()
            ->map(fn($r) => ['date' => $r->date, 'total' => (float) $r->total]);

        $netProfit = (float)$totalRevenue - (float)$totalExpenses;
        $lastMonthProfit = (float)$lastMonthRevenue - (float)$lastMonthExpenses;

        return response()->json([
            'success' => true,
            'data' => [
                'revenue' => [
                    'current' => (float) $totalRevenue,
                    'previous' => (float) $lastMonthRevenue,
                    'change' => $lastMonthRevenue > 0 ? round((($totalRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100, 2) : 0,
                ],
                'expenses' => [
                    'current' => (float) $totalExpenses,
                    'previous' => (float) $lastMonthExpenses,
                    'change' => $lastMonthExpenses > 0 ? round((($totalExpenses - $lastMonthExpenses) / $lastMonthExpenses) * 100, 2) : 0,
                ],
                'sales' => [
                    'current' => $totalSalesCount,
                    'previous' => $lastMonthSalesCount,
                    'change' => $lastMonthSalesCount > 0 ? round((($totalSalesCount - $lastMonthSalesCount) / $lastMonthSalesCount) * 100, 2) : 0,
                ],
                'profit' => [
                    'current' => $netProfit,
                    'previous' => $lastMonthProfit,
                    'change' => $lastMonthProfit != 0 ? round((($netProfit - $lastMonthProfit) / abs($lastMonthProfit)) * 100, 2) : 0,
                ],
                'products' => [
                    'total' => $totalProducts,
                    'lowStock' => $lowStockCount,
                ],
                'recentSales' => $recentSales,
                'salesByDay' => $salesByDay,
            ],
        ]);
    }

    public function getReports(Request $request): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) return response()->json(['success' => true, 'data' => []]);

        $startDate = $request->get('startDate', now()->startOfMonth()->toDateString());
        $endDate = $request->get('endDate', now()->endOfMonth()->toDateString());

        $sales = Sale::where('business_id', $business->id)
            ->whereBetween('sale_date', [$startDate, $endDate])
            ->with('product')
            ->orderByDesc('sale_date')
            ->get();

        $expenses = Expense::where('business_id', $business->id)
            ->whereBetween('expense_date', [$startDate, $endDate])
            ->orderByDesc('expense_date')
            ->get();

        $totalRevenue = $sales->sum('total_amount');
        $totalExpenses = $expenses->sum('amount');
        $profit = $totalRevenue - $totalExpenses;

        $salesByPaymentMethod = $sales->groupBy('payment_method')->map(fn($g) => [
            'count' => $g->count(),
            'total' => (float) $g->sum('total_amount'),
        ]);

        $expensesByCategory = $expenses->groupBy('category')->map(fn($g) => [
            'count' => $g->count(),
            'total' => (float) $g->sum('amount'),
        ]);

        $topProducts = $sales->whereNotNull('product_id')->groupBy('product_id')->map(function ($g) {
            $first = $g->first();
            return [
                'productId' => $first->product_id,
                'productName' => $first->product?->name ?? 'Unknown',
                'totalQuantity' => $g->sum('quantity'),
                'totalRevenue' => (float) $g->sum('total_amount'),
            ];
        })->sortByDesc('totalRevenue')->take(10)->values();

        return response()->json([
            'success' => true,
            'data' => [
                'period' => ['startDate' => $startDate, 'endDate' => $endDate],
                'summary' => [
                    'totalRevenue' => (float) $totalRevenue,
                    'totalExpenses' => (float) $totalExpenses,
                    'profit' => (float) $profit,
                    'totalSales' => $sales->count(),
                    'totalExpenseCount' => $expenses->count(),
                ],
                'salesByPaymentMethod' => $salesByPaymentMethod,
                'expensesByCategory' => $expensesByCategory,
                'topProducts' => $topProducts,
                'sales' => $sales->map(fn($s) => [
                    'id' => $s->id,
                    'productName' => $s->product?->name,
                    'quantity' => $s->quantity,
                    'unitPrice' => (float) $s->unit_price,
                    'totalAmount' => (float) $s->total_amount,
                    'paymentMethod' => $s->payment_method,
                    'saleDate' => $s->sale_date?->format('Y-m-d'),
                ]),
                'expenses' => $expenses->map(fn($e) => [
                    'id' => $e->id,
                    'category' => $e->category,
                    'description' => $e->description,
                    'amount' => (float) $e->amount,
                    'paymentMethod' => $e->payment_method,
                    'expenseDate' => $e->expense_date?->format('Y-m-d'),
                ]),
            ],
        ]);
    }

    public function inventoryDashboard(): JsonResponse
    {
        $business = Business::where('user_id', auth()->id())->first();
        if (!$business) {
            return response()->json(['success' => true, 'data' => [
                'totalProducts' => 0, 'activeProducts' => 0, 'lowStockItems' => 0,
                'outOfStockItems' => 0, 'expiredItems' => 0, 'nearExpiryItems' => 0,
                'totalStockValue' => 0, 'totalRetailValue' => 0, 'todayMovements' => 0,
                'unreadNotifications' => 0, 'topProducts' => [],
            ]]);
        }

        $topProducts = Sale::where('sales.business_id', $business->id)
            ->join('products', 'sales.product_id', '=', 'products.id')
            ->select('sales.product_id', 'products.name as product_name',
                DB::raw('SUM(sales.quantity) as total_qty'),
                DB::raw('SUM(sales.total_amount) as revenue'))
            ->groupBy('sales.product_id', 'products.name')
            ->orderByDesc('total_qty')
            ->take(5)
            ->get()
            ->map(fn($r) => [
                'productId' => $r->product_id,
                'productName' => $r->product_name,
                'totalQty' => (int) $r->total_qty,
                'revenue' => (float) $r->revenue,
            ]);

        return response()->json(['success' => true, 'data' => [
            'totalProducts' => Product::where('business_id', $business->id)->count(),
            'activeProducts' => Product::where('business_id', $business->id)->where('is_active', true)->count(),
            'lowStockItems' => Product::where('business_id', $business->id)
                ->whereRaw('stock_quantity <= reorder_point AND stock_quantity > 0 AND is_active = 1')->count(),
            'outOfStockItems' => Product::where('business_id', $business->id)->where('stock_quantity', 0)->count(),
            'expiredItems' => Product::where('business_id', $business->id)
                ->whereNotNull('expiry_date')->where('expiry_date', '<', now())->count(),
            'nearExpiryItems' => Product::where('business_id', $business->id)
                ->whereNotNull('expiry_date')->whereBetween('expiry_date', [now(), now()->addDays(30)])->count(),
            'totalStockValue' => (float) Product::where('business_id', $business->id)
                ->selectRaw('COALESCE(SUM(stock_quantity * buying_price), 0) as val')->value('val'),
            'totalRetailValue' => (float) Product::where('business_id', $business->id)
                ->selectRaw('COALESCE(SUM(stock_quantity * selling_price), 0) as val')->value('val'),
            'todayMovements' => StockMovement::where('business_id', $business->id)
                ->whereDate('created_at', today())->count(),
            'unreadNotifications' => InventoryNotification::where('business_id', $business->id)
                ->where('is_read', false)->count(),
            'topProducts' => $topProducts,
        ]]);
    }

    private function emptyDashboard(): array
    {
        return [
            'revenue' => ['current' => 0, 'previous' => 0, 'change' => 0],
            'expenses' => ['current' => 0, 'previous' => 0, 'change' => 0],
            'sales' => ['current' => 0, 'previous' => 0, 'change' => 0],
            'profit' => ['current' => 0, 'previous' => 0, 'change' => 0],
            'products' => ['total' => 0, 'lowStock' => 0],
            'recentSales' => [],
            'salesByDay' => [],
        ];
    }
}
