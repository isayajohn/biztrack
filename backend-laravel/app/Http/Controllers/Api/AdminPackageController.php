<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Package;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminPackageController extends Controller
{
    public function listPackages(Request $request): JsonResponse
    {
        $packages = Package::orderBy('sort_order')->orderBy('price_monthly')->get();
        return response()->json(['success' => true, 'data' => ['packages' => $packages->map(fn($p) => $this->formatPackage($p))]]);
    }

    public function createPackage(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string',
            'slug' => 'required|string|unique:packages,slug',
            'description' => 'nullable|string',
            'priceMonthly' => 'required|numeric|min:0',
            'priceYearly' => 'nullable|numeric|min:0',
            'currency' => 'required|string',
            'trialDays' => 'integer|min:0',
            'maxBusinesses' => 'required|integer|min:1',
            'maxUsers' => 'required|integer|min:1',
            'maxProducts' => 'required|integer|min:1',
            'maxSalesPerMonth' => 'required|integer|min:1',
            'maxExpensesPerMonth' => 'required|integer|min:1',
            'allowReports' => 'boolean',
            'allowPdfExport' => 'boolean',
            'allowCsvExport' => 'boolean',
            'allowInventoryAlerts' => 'boolean',
            'allowAiInsights' => 'boolean',
            'status' => 'in:ACTIVE,INACTIVE',
            'sortOrder' => 'integer',
        ]);

        $package = Package::create([
            'id' => Str::uuid(),
            'name' => $data['name'],
            'slug' => $data['slug'],
            'description' => $data['description'] ?? null,
            'price_monthly' => $data['priceMonthly'],
            'price_yearly' => $data['priceYearly'] ?? null,
            'currency' => $data['currency'],
            'trial_days' => $data['trialDays'] ?? 0,
            'max_businesses' => $data['maxBusinesses'],
            'max_users' => $data['maxUsers'],
            'max_products' => $data['maxProducts'],
            'max_sales_per_month' => $data['maxSalesPerMonth'],
            'max_expenses_per_month' => $data['maxExpensesPerMonth'],
            'allow_reports' => $data['allowReports'] ?? false,
            'allow_pdf_export' => $data['allowPdfExport'] ?? false,
            'allow_csv_export' => $data['allowCsvExport'] ?? false,
            'allow_inventory_alerts' => $data['allowInventoryAlerts'] ?? false,
            'allow_ai_insights' => $data['allowAiInsights'] ?? false,
            'status' => $data['status'] ?? 'ACTIVE',
            'sort_order' => $data['sortOrder'] ?? 0,
        ]);

        AuditService::log([
            'actor_id' => auth()->id(),
            'action' => 'PACKAGE_CREATED',
            'target_type' => 'Package',
            'target_id' => $package->id,
        ]);

        return response()->json(['success' => true, 'data' => $this->formatPackage($package)], 201);
    }

    public function getPackageById(Request $request, string $id): JsonResponse
    {
        $package = Package::find($id);
        if (!$package) return response()->json(['success' => false, 'error' => 'Not found'], 404);
        return response()->json(['success' => true, 'data' => $this->formatPackage($package)]);
    }

    public function updatePackage(Request $request, string $id): JsonResponse
    {
        $package = Package::find($id);
        if (!$package) return response()->json(['success' => false, 'error' => 'Not found'], 404);

        $data = $request->validate([
            'name' => 'sometimes|string',
            'description' => 'nullable|string',
            'priceMonthly' => 'sometimes|numeric|min:0',
            'priceYearly' => 'nullable|numeric|min:0',
            'currency' => 'sometimes|string',
            'trialDays' => 'sometimes|integer|min:0',
            'maxBusinesses' => 'sometimes|integer|min:1',
            'maxUsers' => 'sometimes|integer|min:1',
            'maxProducts' => 'sometimes|integer|min:1',
            'maxSalesPerMonth' => 'sometimes|integer|min:1',
            'maxExpensesPerMonth' => 'sometimes|integer|min:1',
            'allowReports' => 'sometimes|boolean',
            'allowPdfExport' => 'sometimes|boolean',
            'allowCsvExport' => 'sometimes|boolean',
            'allowInventoryAlerts' => 'sometimes|boolean',
            'allowAiInsights' => 'sometimes|boolean',
            'sortOrder' => 'sometimes|integer',
        ]);

        $payload = [];
        $map = [
            'name' => 'name', 'description' => 'description', 'priceMonthly' => 'price_monthly',
            'priceYearly' => 'price_yearly', 'currency' => 'currency', 'trialDays' => 'trial_days',
            'maxBusinesses' => 'max_businesses', 'maxUsers' => 'max_users', 'maxProducts' => 'max_products',
            'maxSalesPerMonth' => 'max_sales_per_month', 'maxExpensesPerMonth' => 'max_expenses_per_month',
            'allowReports' => 'allow_reports', 'allowPdfExport' => 'allow_pdf_export',
            'allowCsvExport' => 'allow_csv_export', 'allowInventoryAlerts' => 'allow_inventory_alerts',
            'allowAiInsights' => 'allow_ai_insights', 'sortOrder' => 'sort_order',
        ];

        foreach ($data as $k => $v) {
            if (isset($map[$k])) $payload[$map[$k]] = $v;
        }

        $package->update($payload);

        AuditService::log([
            'actor_id' => auth()->id(),
            'action' => 'PACKAGE_UPDATED',
            'target_type' => 'Package',
            'target_id' => $package->id,
        ]);

        return response()->json(['success' => true, 'data' => $this->formatPackage($package->fresh())]);
    }

    public function updatePackageStatus(Request $request, string $id): JsonResponse
    {
        $data = $request->validate(['status' => 'required|in:ACTIVE,INACTIVE']);
        $package = Package::find($id);
        if (!$package) return response()->json(['success' => false, 'error' => 'Not found'], 404);

        $package->update(['status' => $data['status']]);
        return response()->json(['success' => true, 'data' => $this->formatPackage($package)]);
    }

    public function deletePackage(Request $request, string $id): JsonResponse
    {
        $package = Package::find($id);
        if (!$package) return response()->json(['success' => false, 'error' => 'Not found'], 404);

        $package->delete();

        AuditService::log([
            'actor_id' => auth()->id(),
            'action' => 'PACKAGE_DELETED',
            'target_type' => 'Package',
            'target_id' => $id,
        ]);

        return response()->json(['success' => true, 'data' => ['message' => 'Package deleted']]);
    }

    private function formatPackage(Package $p): array
    {
        return [
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
            'status' => $p->status,
            'sortOrder' => $p->sort_order,
            'createdAt' => $p->created_at,
            'updatedAt' => $p->updated_at,
        ];
    }
}
