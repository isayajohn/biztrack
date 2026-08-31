<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Branch;
use App\Models\BusinessMembership;
use App\Models\BusinessSubscription;
use App\Models\Package;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BusinessController extends Controller
{
    public function createWorkspace(Request $request): JsonResponse
    {
        $user = auth()->user();
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'currency' => 'required|in:TZS',
            'country' => 'nullable|string|max:100',
        ]);

        if (($user->registration_verification_method === 'EMAIL' && !$user->email_verified_at)
            || ($user->registration_verification_method === 'PHONE' && !$user->phone_verified_at)) {
            return response()->json(['success' => false, 'error' => 'Verify your account before creating a workspace.'], 403);
        }
        if (Business::forUser($user)) {
            return response()->json(['success' => false, 'error' => 'This account already belongs to a business workspace.'], 409);
        }

        $business = DB::transaction(function () use ($user, $data) {
            $business = Business::create([
                'id' => Str::uuid(),
                'user_id' => $user->id,
                'name' => trim($data['name']),
                'currency' => strtoupper($data['currency']),
                'country' => $data['country'] ?? 'Tanzania',
            ]);
            $branch = Branch::create([
                'business_id' => $business->id,
                'name' => 'Main Branch',
                'code' => 'MAIN',
                'is_default' => true,
                'is_active' => true,
            ]);
            BusinessMembership::create([
                'business_id' => $business->id,
                'user_id' => $user->id,
                'branch_id' => $branch->id,
                'role' => 'OWNER',
                'permissions' => ['*'],
                'status' => 'ACTIVE',
            ]);

            $freePackage = Package::firstOrCreate(['slug' => 'free'], [
                'name' => 'Free',
                'description' => 'Free starter plan assigned during workspace onboarding.',
                'price_monthly' => 0,
                'price_yearly' => 0,
                'currency' => 'TZS',
                'trial_days' => 0,
                'max_businesses' => 1,
                'max_users' => 1,
                'max_products' => 100,
                'max_sales_per_month' => 100,
                'max_expenses_per_month' => 100,
                'allow_reports' => true,
                'allow_pdf_export' => false,
                'allow_csv_export' => false,
                'allow_inventory_alerts' => true,
                'allow_ai_insights' => false,
                'status' => 'ACTIVE',
                'is_visible' => true,
                'sort_order' => 0,
            ]);
            BusinessSubscription::create([
                'id' => Str::uuid(),
                'business_id' => $business->id,
                'package_id' => $freePackage->id,
                'status' => 'ACTIVE',
                'billing_cycle' => 'LIFETIME',
                'starts_at' => now(),
                'notes' => 'Free plan assigned during workspace onboarding.',
            ]);

            return $business;
        });

        AuditService::log([
            'actor_id' => $user->id,
            'action' => 'BUSINESS_WORKSPACE_CREATED',
            'target_type' => 'Business',
            'target_id' => $business->id,
        ]);

        return response()->json(['success' => true, 'data' => $this->formatBusiness($business->load('activeSubscription.package'))], 201);
    }

    public function getBusinessProfile(Request $request): JsonResponse
    {
        $user = auth()->user();
        $business = Business::forUser($user)?->load('activeSubscription.package');

        if (!$business) {
            return response()->json(['success' => false, 'error' => 'Business not found'], 404);
        }

        return response()->json(['success' => true, 'data' => $this->formatBusiness($business)]);
    }

    public function updateBusinessProfile(Request $request): JsonResponse
    {
        $user = auth()->user();
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'currency' => 'required|string|size:3',
            'country' => 'required|string',
            'taxName' => 'nullable|string|max:50',
            'taxNumber' => 'nullable|string|max:100',
            'defaultTaxRate' => 'nullable|numeric|min:0|max:100',
        ]);

        $business = Business::forUser($user);

        if (!$business) {
            $business = Business::create([
                'id' => Str::uuid(),
                'user_id' => $user->id,
                'name' => $data['name'],
                'currency' => strtoupper($data['currency']),
                'country' => $data['country'],
                'tax_name' => $data['taxName'] ?? 'VAT',
                'tax_number' => $data['taxNumber'] ?? null,
                'default_tax_rate' => $data['defaultTaxRate'] ?? 0,
            ]);
        } else {
            $business->update([
                'name' => $data['name'],
                'currency' => strtoupper($data['currency']),
                'country' => $data['country'],
                'tax_name' => $data['taxName'] ?? $business->tax_name,
                'tax_number' => array_key_exists('taxNumber', $data) ? $data['taxNumber'] : $business->tax_number,
                'default_tax_rate' => $data['defaultTaxRate'] ?? $business->default_tax_rate,
            ]);
        }

        AuditService::log([
            'actor_id' => $user->id,
            'action' => 'BUSINESS_UPDATED',
            'target_type' => 'Business',
            'target_id' => $business->id,
        ]);

        $business->load('activeSubscription.package');

        return response()->json(['success' => true, 'data' => $this->formatBusiness($business)]);
    }

    private function formatBusiness(Business $business): array
    {
        $sub = $business->activeSubscription;
        return [
            'id' => $business->id,
            'userId' => $business->user_id,
            'name' => $business->name,
            'currency' => $business->currency,
            'country' => $business->country,
            'taxName' => $business->tax_name,
            'taxNumber' => $business->tax_number,
            'defaultTaxRate' => (float) $business->default_tax_rate,
            'createdAt' => $business->created_at,
            'updatedAt' => $business->updated_at,
            'subscription' => $sub ? [
                'id' => $sub->id,
                'status' => $sub->status,
                'billingCycle' => $sub->billing_cycle,
                'startsAt' => $sub->starts_at,
                'endsAt' => $sub->ends_at,
                'trialEndsAt' => $sub->trial_ends_at,
                'package' => $sub->package ? [
                    'id' => $sub->package->id,
                    'name' => $sub->package->name,
                    'maxProducts' => $sub->package->max_products,
                    'maxSalesPerMonth' => $sub->package->max_sales_per_month,
                    'maxExpensesPerMonth' => $sub->package->max_expenses_per_month,
                    'allowReports' => $sub->package->allow_reports,
                    'allowAiInsights' => $sub->package->allow_ai_insights,
                ] : null,
            ] : null,
        ];
    }
}
