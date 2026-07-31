<?php

namespace App\Jobs;

use App\Models\DebtReminder;
use App\Services\DebtReminderService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendDebtReminderJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(private string $reminderId) {}

    public function handle(DebtReminderService $reminderService): void
    {
        $reminder = DebtReminder::where('status', 'PENDING')->find($this->reminderId);
        if (!$reminder) {
            return;
        }

        $reminderService->dispatch($reminder);
    }
}
