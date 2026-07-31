<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Debt;
use App\Models\DebtReminder;
use App\Services\DebtReminderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DebtReminderController extends Controller
{
    public function __construct(private DebtReminderService $reminderService) {}

    private function getBusiness(): ?Business
    {
        return Business::forUser(auth()->user());
    }

    public function index(string $debtId): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) return response()->json(['success' => false, 'error' => 'Business not found'], 404);

        $debt = Debt::where('id', $debtId)->where('business_id', $business->id)->first();
        if (!$debt) return response()->json(['success' => false, 'error' => 'Debt not found'], 404);

        $reminders = $debt->reminders()->orderByDesc('scheduled_for')->get();

        return response()->json(['success' => true, 'data' => ['reminders' => $reminders->map(fn ($r) => $this->format($r))]]);
    }

    public function schedule(Request $request, string $debtId): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) return response()->json(['success' => false, 'error' => 'Business not found'], 404);

        $debt = Debt::where('id', $debtId)->where('business_id', $business->id)->first();
        if (!$debt) return response()->json(['success' => false, 'error' => 'Debt not found'], 404);

        $data = $request->validate([
            'channel' => 'required|in:SMS,WHATSAPP,EMAIL,IN_APP',
            'scheduledFor' => 'nullable|date',
        ]);

        $reminder = DebtReminder::create([
            'id' => Str::uuid(),
            'business_id' => $debt->business_id,
            'debt_id' => $debt->id,
            'channel' => $data['channel'],
            'trigger_type' => 'MANUAL',
            'scheduled_for' => $data['scheduledFor'] ?? now(),
            'status' => 'PENDING',
            'created_by' => auth()->id(),
        ]);

        return response()->json(['success' => true, 'data' => $this->format($reminder)], 201);
    }

    public function sendNow(string $debtId, string $reminderId): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) return response()->json(['success' => false, 'error' => 'Business not found'], 404);

        $reminder = DebtReminder::where('id', $reminderId)->where('debt_id', $debtId)->where('business_id', $business->id)->first();
        if (!$reminder) return response()->json(['success' => false, 'error' => 'Reminder not found'], 404);

        $sent = $this->reminderService->dispatch($reminder);

        \App\Services\AuditService::log([
            'actor_id' => auth()->id(),
            'action' => 'DEBT_REMINDER_SENT',
            'target_type' => 'Debt',
            'target_id' => $debtId,
            'metadata' => ['reminderId' => $reminder->id, 'channel' => $reminder->channel, 'success' => $sent],
        ]);

        return response()->json(['success' => true, 'data' => $this->format($reminder->fresh())]);
    }

    private function format(DebtReminder $r): array
    {
        return [
            'id' => $r->id,
            'debtId' => $r->debt_id,
            'channel' => $r->channel,
            'triggerType' => $r->trigger_type,
            'status' => $r->status,
            'scheduledFor' => $r->scheduled_for,
            'sentAt' => $r->sent_at,
            'failureReason' => $r->failure_reason,
            'messageSnapshot' => $r->message_snapshot,
        ];
    }
}
