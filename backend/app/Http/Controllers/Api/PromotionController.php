<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Promotion;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PromotionController extends Controller
{
    private function business(): ?Business { return Business::forUser(auth()->user()); }

    public function index(Request $request): JsonResponse
    {
        $business = $this->business();
        if (!$business) return response()->json(['success' => true, 'data' => ['promotions' => []]]);
        $query = Promotion::where('business_id', $business->id);
        if ($request->boolean('available')) $query->where('is_active', true)->where('starts_at', '<=', now())->where('ends_at', '>=', now())->where(fn ($q) => $q->whereNull('usage_limit')->orWhereColumn('times_used', '<', 'usage_limit'));
        return response()->json(['success' => true, 'data' => ['promotions' => $query->orderByDesc('created_at')->get()->map(fn ($promotion) => $this->format($promotion))]]);
    }

    public function store(Request $request): JsonResponse
    {
        $business = $this->business(); if (!$business) return response()->json(['success' => false, 'error' => 'Business not found'], 404);
        $data = $this->validateData($request, $business->id);
        $promotion = Promotion::create(['business_id' => $business->id, ...$this->mapData($data)]);
        $this->audit('PROMOTION_CREATED', $promotion->id);
        return response()->json(['success' => true, 'data' => $this->format($promotion)], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $business = $this->business(); $promotion = $business ? Promotion::where('business_id', $business->id)->find($id) : null;
        if (!$promotion) return response()->json(['success' => false, 'error' => 'Promotion not found'], 404);
        $data = $this->validateData($request, $business->id, $promotion->id, true);
        $promotion->update($this->mapData($data)); $this->audit('PROMOTION_UPDATED', $promotion->id);
        return response()->json(['success' => true, 'data' => $this->format($promotion->fresh())]);
    }

    public function destroy(string $id): JsonResponse
    {
        $business = $this->business(); $promotion = $business ? Promotion::where('business_id', $business->id)->find($id) : null;
        if (!$promotion) return response()->json(['success' => false, 'error' => 'Promotion not found'], 404);
        $promotion->delete(); $this->audit('PROMOTION_DELETED', $id);
        return response()->json(['success' => true, 'data' => ['message' => 'Promotion deleted']]);
    }

    private function validateData(Request $request, string $businessId, ?string $ignore = null, bool $partial = false): array
    {
        $sometimes = $partial ? 'sometimes|' : '';
        return $request->validate([
            'name' => $sometimes . 'required|string|max:255',
            'code' => [$partial ? 'sometimes' : 'required', 'string', 'max:50', Rule::unique('promotions')->where('business_id', $businessId)->ignore($ignore)],
            'type' => $sometimes . 'required|in:PERCENTAGE,FIXED',
            'value' => $sometimes . 'required|numeric|min:0.01',
            'minimumPurchase' => 'nullable|numeric|min:0', 'maximumDiscount' => 'nullable|numeric|min:0.01',
            'startsAt' => $sometimes . 'required|date', 'endsAt' => $sometimes . 'required|date|after:startsAt',
            'usageLimit' => 'nullable|integer|min:1', 'isActive' => 'sometimes|boolean',
        ]);
    }

    private function mapData(array $data): array
    {
        $mapped = [];
        foreach (['name', 'type', 'value'] as $key) if (array_key_exists($key, $data)) $mapped[$key] = $data[$key];
        if (array_key_exists('code', $data)) $mapped['code'] = strtoupper($data['code']);
        foreach (['minimumPurchase' => 'minimum_purchase', 'maximumDiscount' => 'maximum_discount', 'startsAt' => 'starts_at', 'endsAt' => 'ends_at', 'usageLimit' => 'usage_limit', 'isActive' => 'is_active'] as $from => $to) if (array_key_exists($from, $data)) $mapped[$to] = $data[$from];
        return $mapped;
    }

    private function format(Promotion $p): array { return ['id' => $p->id, 'name' => $p->name, 'code' => $p->code, 'type' => $p->type, 'value' => (float) $p->value, 'minimumPurchase' => (float) $p->minimum_purchase, 'maximumDiscount' => $p->maximum_discount === null ? null : (float) $p->maximum_discount, 'startsAt' => $p->starts_at?->toISOString(), 'endsAt' => $p->ends_at?->toISOString(), 'usageLimit' => $p->usage_limit, 'timesUsed' => $p->times_used, 'isActive' => (bool) $p->is_active, 'isAvailable' => $p->isAvailable((float) $p->minimum_purchase)]; }
    private function audit(string $action, string $id): void { AuditService::log(['actor_id' => auth()->id(), 'action' => $action, 'target_type' => 'Promotion', 'target_id' => $id]); }
}
