<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\DebtSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DebtSettingController extends Controller
{
    private function getBusiness(): ?Business
    {
        return Business::forUser(auth()->user());
    }

    public function show(): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) return response()->json(['success' => false, 'error' => 'Business not found'], 404);

        $settings = DebtSetting::where('business_id', $business->id)->first() ?? DebtSetting::defaultsFor($business->id);

        return response()->json(['success' => true, 'data' => $this->format($settings)]);
    }

    public function update(Request $request): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) return response()->json(['success' => false, 'error' => 'Business not found'], 404);

        $data = $request->validate([
            'allowOverpayments' => 'sometimes|boolean',
            'remindDaysBefore' => 'sometimes|array',
            'remindDaysBefore.*' => 'integer|min:1|max:365',
            'remindOnDueDate' => 'sometimes|boolean',
            'remindAfterDueRepeatDays' => 'sometimes|integer|min:1|max:365',
            'remindAfterDueMaxTimes' => 'sometimes|integer|min:0|max:100',
            'enabledChannels' => 'sometimes|array',
            'enabledChannels.*' => 'in:SMS,WHATSAPP,EMAIL,IN_APP',
        ]);

        $settings = DebtSetting::where('business_id', $business->id)->first();
        $payload = [
            'allow_overpayments' => $data['allowOverpayments'] ?? $settings?->allow_overpayments ?? false,
            'remind_days_before' => $data['remindDaysBefore'] ?? $settings?->remind_days_before ?? [7, 3, 1],
            'remind_on_due_date' => $data['remindOnDueDate'] ?? $settings?->remind_on_due_date ?? true,
            'remind_after_due_repeat_days' => $data['remindAfterDueRepeatDays'] ?? $settings?->remind_after_due_repeat_days ?? 7,
            'remind_after_due_max_times' => $data['remindAfterDueMaxTimes'] ?? $settings?->remind_after_due_max_times ?? 3,
            'enabled_channels' => $data['enabledChannels'] ?? $settings?->enabled_channels ?? ['EMAIL', 'IN_APP'],
        ];

        if ($settings) {
            $settings->update($payload);
        } else {
            $settings = DebtSetting::create(['id' => Str::uuid(), 'business_id' => $business->id, ...$payload]);
        }

        return response()->json(['success' => true, 'data' => $this->format($settings)]);
    }

    private function format(DebtSetting $s): array
    {
        return [
            'allowOverpayments' => (bool) $s->allow_overpayments,
            'remindDaysBefore' => $s->remind_days_before ?? [7, 3, 1],
            'remindOnDueDate' => (bool) $s->remind_on_due_date,
            'remindAfterDueRepeatDays' => (int) $s->remind_after_due_repeat_days,
            'remindAfterDueMaxTimes' => (int) $s->remind_after_due_max_times,
            'enabledChannels' => $s->enabled_channels ?? ['EMAIL', 'IN_APP'],
        ];
    }
}
