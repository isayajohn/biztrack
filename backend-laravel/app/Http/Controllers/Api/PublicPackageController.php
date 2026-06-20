<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Package;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicPackageController extends Controller
{
    public function listPackages(Request $request): JsonResponse
    {
        $packages = Package::where('status', 'ACTIVE')
            ->orderBy('sort_order')
            ->orderBy('price_monthly')
            ->get()
            ->map(fn($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'slug' => $p->slug,
                'description' => $p->description,
                'priceMonthly' => (float) $p->price_monthly,
                'priceYearly' => $p->price_yearly ? (float) $p->price_yearly : null,
                'currency' => $p->currency,
                'trialDays' => $p->trial_days,
                'maxBusinesses' => $p->max_businesses,
                'maxUsers' => $p->max_users,
                'maxProducts' => $p->max_products,
                'maxSalesPerMonth' => $p->max_sales_per_month,
                'maxExpensesPerMonth' => $p->max_expenses_per_month,
                'allowReports' => (bool) $p->allow_reports,
                'allowPdfExport' => (bool) $p->allow_pdf_export,
                'allowCsvExport' => (bool) $p->allow_csv_export,
                'allowInventoryAlerts' => (bool) $p->allow_inventory_alerts,
                'allowAiInsights' => (bool) $p->allow_ai_insights,
                'sortOrder' => $p->sort_order,
            ]);

        return response()->json(['success' => true, 'data' => ['packages' => $packages]]);
    }
}
