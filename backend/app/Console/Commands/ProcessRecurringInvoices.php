<?php

namespace App\Console\Commands;

use App\Services\RecurringInvoiceService;
use Illuminate\Console\Command;

class ProcessRecurringInvoices extends Command
{
    protected $signature = 'invoices:process-recurring';

    protected $description = 'Generate sales for recurring invoices that are due today';

    public function handle(RecurringInvoiceService $recurringInvoiceService): int
    {
        $generated = $recurringInvoiceService->generateDue();
        $this->info("Generated {$generated} recurring invoice(s).");

        return self::SUCCESS;
    }
}
