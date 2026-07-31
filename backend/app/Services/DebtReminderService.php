<?php

namespace App\Services;

use App\Models\Debt;
use App\Models\DebtReminder;
use App\Models\DebtReminderTemplate;
use App\Models\DebtSetting;
use App\Models\InventoryNotification;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class DebtReminderService
{
    public function __construct(
        private SmsService $smsService,
        private WhatsAppService $whatsAppService,
        private EmailService $emailService,
    ) {}

    private const DEFAULT_BODIES = [
        'BEFORE_DUE' => 'Hello {{customer_name}}{{supplier_name}}, this is a reminder that {{balance}} is due on {{due_date}} for debt {{debt_number}}. - {{business_name}} {{business_phone}}',
        'ON_DUE' => 'Hello {{customer_name}}{{supplier_name}}, your payment of {{balance}} for debt {{debt_number}} is due today. - {{business_name}} {{business_phone}}',
        'AFTER_DUE_RECURRING' => 'Hello {{customer_name}}{{supplier_name}}, debt {{debt_number}} of {{balance}} is overdue since {{due_date}}. Please settle it as soon as possible. - {{business_name}} {{business_phone}}',
    ];

    /**
     * Scan active debts and create any reminder rows that are due to be generated today,
     * per the business's DebtSetting rules. Safe to call repeatedly (skips duplicates).
     */
    public function generateDue(): int
    {
        $created = 0;

        Debt::whereNotIn('status', ['DRAFT', 'PAID', 'CANCELLED', 'WRITTEN_OFF', 'DISPUTED'])
            ->whereNotNull('due_date')
            ->where('outstanding_balance', '>', 0)
            ->with('reminders')
            ->chunkById(200, function ($debts) use (&$created) {
                foreach ($debts as $debt) {
                    $created += $this->generateForDebt($debt);
                }
            });

        return $created;
    }

    private function generateForDebt(Debt $debt): int
    {
        $settings = DebtSetting::where('business_id', $debt->business_id)->first()
            ?? DebtSetting::defaultsFor($debt->business_id);

        $daysUntilDue = (int) round(
            (strtotime($debt->due_date->toDateString()) - strtotime(now()->toDateString())) / 86400
        );

        $triggerType = null;
        if ($daysUntilDue > 0 && in_array($daysUntilDue, $settings->remind_days_before ?? [], true)) {
            $triggerType = 'BEFORE_DUE';
        } elseif ($daysUntilDue === 0 && $settings->remind_on_due_date) {
            $triggerType = 'ON_DUE';
        } elseif ($daysUntilDue < 0) {
            $overdueDays = abs($daysUntilDue);
            $repeatEvery = max(1, (int) $settings->remind_after_due_repeat_days);
            $maxTimes = (int) $settings->remind_after_due_max_times;
            $timesSoFar = $debt->reminders->where('trigger_type', 'AFTER_DUE_RECURRING')->count();
            if ($overdueDays % $repeatEvery === 0 && $timesSoFar < $maxTimes) {
                $triggerType = 'AFTER_DUE_RECURRING';
            }
        }

        if (!$triggerType) {
            return 0;
        }

        $channels = $settings->enabled_channels ?: ['EMAIL', 'IN_APP'];
        $created = 0;
        $today = now()->toDateString();

        foreach ($channels as $channel) {
            $exists = $debt->reminders->contains(fn ($r) => $r->trigger_type === $triggerType
                && $r->channel === $channel
                && $r->scheduled_for->toDateString() === $today);
            if ($exists) {
                continue;
            }

            DebtReminder::create([
                'id' => Str::uuid(),
                'business_id' => $debt->business_id,
                'debt_id' => $debt->id,
                'channel' => $channel,
                'trigger_type' => $triggerType,
                'scheduled_for' => now(),
                'status' => 'PENDING',
            ]);
            $created++;
        }

        return $created;
    }

    public function dispatch(DebtReminder $reminder): bool
    {
        $debt = $reminder->debt()->with(['customer', 'supplier', 'business.user'])->first();
        if (!$debt) {
            $reminder->update(['status' => 'FAILED', 'failure_reason' => 'Debt no longer exists']);
            return false;
        }

        $variables = $this->buildVariables($debt);
        $template = DebtReminderTemplate::where('business_id', $debt->business_id)
            ->where('channel', $reminder->channel)
            ->where('trigger_type', $reminder->trigger_type)
            ->where('is_active', true)
            ->first();

        $body = $this->interpolate($template?->body ?: self::DEFAULT_BODIES[$reminder->trigger_type], $variables);
        $subject = $this->interpolate($template?->subject ?: 'Payment reminder from ' . $variables['business_name'], $variables);

        try {
            $sent = match ($reminder->channel) {
                'SMS' => $this->sendSms($debt, $body),
                'WHATSAPP' => $this->sendWhatsApp($debt, $body),
                'EMAIL' => $this->sendEmail($debt, $subject, $body),
                'IN_APP' => $this->sendInApp($debt, $body),
                default => false,
            };

            $reminder->update([
                'status' => $sent ? 'SENT' : 'FAILED',
                'sent_at' => $sent ? now() : null,
                'failure_reason' => $sent ? null : 'No contact information or channel not configured',
                'message_snapshot' => $body,
            ]);

            return $sent;
        } catch (\Throwable $e) {
            Log::warning('Debt reminder dispatch failed: ' . $e->getMessage());
            $reminder->update(['status' => 'FAILED', 'failure_reason' => $e->getMessage(), 'message_snapshot' => $body]);
            return false;
        }
    }

    private function sendSms(Debt $debt, string $body): bool
    {
        $phone = $debt->customer?->phone ?? $debt->supplier?->phone;
        return $phone ? $this->smsService->send($phone, $body) : false;
    }

    private function sendWhatsApp(Debt $debt, string $body): bool
    {
        $phone = $debt->customer?->phone ?? $debt->supplier?->phone;
        return $phone ? $this->whatsAppService->send($phone, $body) : false;
    }

    private function sendEmail(Debt $debt, string $subject, string $body): bool
    {
        $email = $debt->customer?->email ?? $debt->supplier?->email;
        $name = $debt->customer?->name ?? $debt->supplier?->name ?? 'Customer';
        return $email ? $this->emailService->send($email, $name, $subject, nl2br($body)) : false;
    }

    private function sendInApp(Debt $debt, string $body): bool
    {
        $ownerId = $debt->created_by ?? $debt->business?->user_id;
        if (!$ownerId) {
            return false;
        }

        $prefix = match ($debt->status) {
            'OVERDUE' => 'Debt overdue',
            default => now()->toDateString() === $debt->due_date?->toDateString() ? 'Payment due today' : 'Payment due soon',
        };

        // Uses the existing 'GENERAL' notification type (rather than a new enum value) so this
        // insert is valid under both the MySQL enum and the SQLite CHECK constraint it compiles to.
        InventoryNotification::create([
            'id' => Str::uuid(),
            'business_id' => $debt->business_id,
            'user_id' => $ownerId,
            'title' => "{$prefix}: {$debt->debt_number}",
            'message' => $body,
            'type' => 'GENERAL',
            'reference_id' => $debt->id,
            'is_read' => false,
        ]);

        return true;
    }

    private function buildVariables(Debt $debt): array
    {
        return [
            'customer_name' => $debt->customer?->name ?? '',
            'supplier_name' => $debt->supplier?->name ?? '',
            'business_name' => $debt->business?->name ?? 'BizTrack',
            'business_phone' => $debt->business?->user?->phone ?? '',
            'original_amount' => number_format((float) $debt->original_amount, 2),
            'amount_paid' => number_format((float) $debt->total_paid, 2),
            'balance' => number_format((float) $debt->outstanding_balance, 2),
            'due_date' => $debt->due_date?->format('Y-m-d') ?? '',
            'debt_number' => $debt->debt_number,
        ];
    }

    private function interpolate(string $template, array $vars): string
    {
        foreach ($vars as $key => $value) {
            $template = str_replace('{{' . $key . '}}', (string) $value, $template);
            $template = str_replace('{{ ' . $key . ' }}', (string) $value, $template);
        }
        // Collapse the unused customer_name/supplier_name placeholder pairing used in default bodies.
        return trim(preg_replace('/\s{2,}/', ' ', $template));
    }
}
