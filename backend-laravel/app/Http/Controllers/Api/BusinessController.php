<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BusinessController extends Controller
{
    public function getBusinessProfile(Request $request): JsonResponse
    {
        $user = auth()->user();
        $business = Business::where('user_id', $user->id)->with('activeSubscription.package')->first();

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
        ]);

        $business = Business::where('user_id', $user->id)->first();

        if (!$business) {
            $business = Business::create([
                'id' => Str::uuid(),
                'user_id' => $user->id,
                'name' => $data['name'],
                'currency' => strtoupper($data['currency']),
                'country' => $data['country'],
            ]);
        } else {
            $business->update([
                'name' => $data['name'],
                'currency' => strtoupper($data['currency']),
                'country' => $data['country'],
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
