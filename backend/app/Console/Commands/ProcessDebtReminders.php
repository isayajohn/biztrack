<?php

namespace App\Console\Commands;

use App\Jobs\SendDebtReminderJob;
use App\Models\DebtReminder;
use App\Services\DebtReminderService;
use App\Services\DebtService;
use Illuminate\Console\Command;

class ProcessDebtReminders extends Command
{
    protected $signature = 'debts:process-reminders';

    protected $description = 'Mark overdue debts, generate due reminders, and queue pending reminder deliveries';

    public function handle(DebtService $debtService, DebtReminderService $reminderService): int
    {
        $overdueCount = $debtService->markOverdue();
        $this->info("Marked {$overdueCount} debt(s) as OVERDUE.");

        $generatedCount = $reminderService->generateDue();
        $this->info("Generated {$generatedCount} reminder(s).");

        $pending = DebtReminder::where('status', 'PENDING')
            ->where('scheduled_for', '<=', now())
            ->get();

        foreach ($pending as $reminder) {
            SendDebtReminderJob::dispatch($reminder->id);
        }
        $this->info("Queued {$pending->count()} reminder(s) for delivery.");

        return self::SUCCESS;
    }
}
