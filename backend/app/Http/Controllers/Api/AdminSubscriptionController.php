<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\BusinessSubscription;
use App\Models\Package;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminSubscriptionController extends Controller
{
    public function listSubscriptions(Request $request): JsonResponse
    {
        $query = BusinessSubscription::with('business.user', 'package');

        if ($request->filled('status')) $query->where('status', $request->status);
        if ($request->filled('businessId')) $query->where('business_id', $request->businessId);

        $total = $query->count();
        $page = (int) $request->get('page', 1);
        $limit = (int) $request->get('limit', 20);
        $subs = $query->orderByDesc('created_at')->skip(($page - 1) * $limit)->take($limit)->get();

        return response()->json([
            'success' => true,
            'data' => ['subscriptions' => $subs->map(fn($s) => $this->formatSub($s)), 'total' => $total, 'page' => $page, 'limit' => $limit],
        ]);
    }

    public function assignSubscription(Request $request): JsonResponse
    {
        $data = $request->validate([
            'businessId' => 'required|uuid',
            'packageId' => 'required|uuid',
            'billingCycle' => 'required|in:MONTHLY,YEARLY,LIFETIME,MANUAL',
            'status' => 'required|in:TRIAL,ACTIVE,SUSPENDED,CANCELLED,EXPIRED',
            'startsAt' => 'required|date',
            'endsAt' => 'nullable|date',
            'trialEndsAt' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        $sub = BusinessSubscription::create([
            'id' => Str::uuid(),
            'business_id' => $data['businessId'],
            'package_id' => $data['packageId'],
            'billing_cycle' => $data['billingCycle'],
            'status' => $data['status'],
            'starts_at' => $data['startsAt'],
            'ends_at' => $data['endsAt'] ?? null,
            'trial_ends_at' => $data['trialEndsAt'] ?? null,
            'notes' => $data['notes'] ?? null,
        ]);

        AuditService::log([
            'actor_id' => auth()->id(),
            'action' => 'SUBSCRIPTION_ASSIGNED',
            'target_type' => 'BusinessSubscription',
            'target_id' => $sub->id,
        ]);

        return response()->json(['success' => true, 'data' => $this->formatSub($sub->load('business.user', 'package'))], 201);
    }

    public function getSubscriptionById(Request $request, string $id): JsonResponse
    {
        $sub = BusinessSubscription::with('business.user', 'package')->find($id);
        if (!$sub) return response()->json(['success' => false, 'error' => 'Not found'], 404);
        return response()->json(['success' => true, 'data' => $this->formatSub($sub)]);
    }

    public function updateSubscriptionStatus(Request $request, string $id): JsonResponse
    {
        $data = $request->validate(['status' => 'required|in:TRIAL,ACTIVE,SUSPENDED,CANCELLED,EXPIRED']);
        $sub = BusinessSubscription::find($id);
        if (!$sub) return response()->json(['success' => false, 'error' => 'Not found'], 404);

        $sub->update(['status' => $data['status']]);

        AuditService::log([
            'actor_id' => auth()->id(),
            'action' => 'SUBSCRIPTION_STATUS_UPDATED',
            'target_type' => 'BusinessSubscription',
            'target_id' => $id,
            'details' => ['status' => $data['status']],
        ]);

        return response()->json(['success' => true, 'data' => $this->formatSub($sub->fresh()->load('business.user', 'package'))]);
    }

    public function extendSubscription(Request $request, string $id): JsonResponse
    {
        $data = $request->validate(['endsAt' => 'required|date']);
        $sub = BusinessSubscription::find($id);
        if (!$sub) return response()->json(['success' => false, 'error' => 'Not found'], 404);

        $sub->update(['ends_at' => $data['endsAt'], 'status' => 'ACTIVE']);

        AuditService::log([
            'actor_id' => auth()->id(),
            'action' => 'SUBSCRIPTION_EXTENDED',
            'target_type' => 'BusinessSubscription',
            'target_id' => $id,
        ]);

        return response()->json(['success' => true, 'data' => $this->formatSub($sub->fresh()->load('business.user', 'package'))]);
    }

    public function changeBusinessPackage(Request $request, string $businessId): JsonResponse
    {
        $data = $request->validate([
            'packageId' => 'required|uuid',
            'billingCycle' => 'required|in:MONTHLY,YEARLY,LIFETIME,MANUAL',
        ]);

        $business = Business::find($businessId);
        if (!$business) return response()->json(['success' => false, 'error' => 'Business not found'], 404);

        BusinessSubscription::where('business_id', $businessId)->whereIn('status', ['TRIAL', 'ACTIVE'])->update(['status' => 'CANCELLED']);

        $sub = BusinessSubscription::create([
            'id' => Str::uuid(),
            'business_id' => $businessId,
            'package_id' => $data['packageId'],
            'billing_cycle' => $data['billingCycle'],
            'status' => 'ACTIVE',
            'starts_at' => now(),
        ]);

        AuditService::log([
            'actor_id' => auth()->id(),
            'action' => 'BUSINESS_PACKAGE_CHANGED',
            'target_type' => 'Business',
            'target_id' => $businessId,
        ]);

        return response()->json(['success' => true, 'data' => $this->formatSub($sub->load('business.user', 'package'))]);
    }

    private function formatSub(BusinessSubscription $s): array
    {
        return [
            'id' => $s->id,
            'businessId' => $s->business_id,
            'packageId' => $s->package_id,
            'status' => $s->status,
            'billingCycle' => $s->billing_cycle,
            'startsAt' => $s->starts_at,
            'endsAt' => $s->ends_at,
            'trialEndsAt' => $s->trial_ends_at,
            'notes' => $s->notes,
            'createdAt' => $s->created_at,
            'business' => $s->business ? ['id' => $s->business->id, 'name' => $s->business->name, 'user' => $s->business->user ? ['name' => $s->business->user->name, 'email' => $s->business->user->email] : null] : null,
            'package' => $s->package ? ['id' => $s->package->id, 'name' => $s->package->name] : null,
        ];
    }
}
