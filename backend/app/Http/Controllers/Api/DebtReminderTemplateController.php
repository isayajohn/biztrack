<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\DebtReminderTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DebtReminderTemplateController extends Controller
{
    private const CHANNELS = ['SMS', 'WHATSAPP', 'EMAIL', 'IN_APP'];
    private const TRIGGERS = ['BEFORE_DUE', 'ON_DUE', 'AFTER_DUE_RECURRING'];

    private const DEFAULT_BODIES = [
        'BEFORE_DUE' => 'Hello {{customer_name}}{{supplier_name}}, this is a reminder that {{balance}} is due on {{due_date}} for debt {{debt_number}}. - {{business_name}} {{business_phone}}',
        'ON_DUE' => 'Hello {{customer_name}}{{supplier_name}}, your payment of {{balance}} for debt {{debt_number}} is due today. - {{business_name}} {{business_phone}}',
        'AFTER_DUE_RECURRING' => 'Hello {{customer_name}}{{supplier_name}}, debt {{debt_number}} of {{balance}} is overdue since {{due_date}}. Please settle it as soon as possible. - {{business_name}} {{business_phone}}',
    ];

    public const SUPPORTED_VARIABLES = [
        'customer_name', 'supplier_name', 'business_name', 'original_amount',
        'amount_paid', 'balance', 'due_date', 'debt_number', 'business_phone',
    ];

    private function getBusiness(): ?Business
    {
        return Business::forUser(auth()->user());
    }

    public function index(): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) return response()->json(['success' => false, 'error' => 'Business not found'], 404);

        $saved = DebtReminderTemplate::where('business_id', $business->id)->get()
            ->keyBy(fn ($t) => $t->channel . ':' . $t->trigger_type);

        $templates = [];
        foreach (self::CHANNELS as $channel) {
            foreach (self::TRIGGERS as $trigger) {
                $existing = $saved->get("{$channel}:{$trigger}");
                $templates[] = $this->format($channel, $trigger, $existing);
            }
        }

        return response()->json(['success' => true, 'data' => ['templates' => $templates, 'supportedVariables' => self::SUPPORTED_VARIABLES]]);
    }

    public function update(Request $request, string $channel, string $trigger): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) return response()->json(['success' => false, 'error' => 'Business not found'], 404);

        if (!in_array($channel, self::CHANNELS, true) || !in_array($trigger, self::TRIGGERS, true)) {
            return response()->json(['success' => false, 'error' => 'Unknown channel or trigger type'], 404);
        }

        $data = $request->validate([
            'subject' => 'nullable|string|max:255',
            'body' => 'required|string|max:2000',
            'isActive' => 'sometimes|boolean',
        ]);

        $template = DebtReminderTemplate::where('business_id', $business->id)
            ->where('channel', $channel)->where('trigger_type', $trigger)->first();

        if ($template) {
            $template->update([
                'subject' => $data['subject'] ?? $template->subject,
                'body' => $data['body'],
                'is_active' => $data['isActive'] ?? $template->is_active,
            ]);
        } else {
            $template = DebtReminderTemplate::create([
                'id' => Str::uuid(),
                'business_id' => $business->id,
                'channel' => $channel,
                'trigger_type' => $trigger,
                'subject' => $data['subject'] ?? null,
                'body' => $data['body'],
                'is_active' => $data['isActive'] ?? true,
            ]);
        }

        return response()->json(['success' => true, 'data' => $this->format($channel, $trigger, $template)]);
    }

    private function format(string $channel, string $trigger, ?DebtReminderTemplate $template): array
    {
        return [
            'channel' => $channel,
            'triggerType' => $trigger,
            'subject' => $template?->subject,
            'body' => $template?->body ?: self::DEFAULT_BODIES[$trigger],
            'isActive' => $template?->is_active ?? true,
            'isCustomized' => $template !== null,
        ];
    }
}
