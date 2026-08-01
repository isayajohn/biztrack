<?php

namespace App\Services;

use App\Models\InventoryNotification;
use App\Models\Product;
use App\Models\RecurringInvoice;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class RecurringInvoiceService
{
    public function __construct(private DebtService $debtService) {}

    /**
     * Generate a Sale for every active recurring invoice whose next_run_date is due,
     * advancing each one to its next occurrence. Safe to call repeatedly per day.
     */
    public function generateDue(): int
    {
        $generated = 0;

        RecurringInvoice::where('status', 'ACTIVE')
            ->whereDate('next_run_date', '<=', now()->toDateString())
            ->where(function ($query) {
                $query->whereNull('end_date')->orWhereDate('end_date', '>=', now()->toDateString());
            })
            ->with('items')
            ->chunkById(100, function ($recurringInvoices) use (&$generated) {
                foreach ($recurringInvoices as $recurringInvoice) {
                    try {
                        $this->generateOne($recurringInvoice);
                        $generated++;
                    } catch (\Throwable $e) {
                        Log::warning('Recurring invoice generation skipped', [
                            'recurring_invoice_id' => $recurringInvoice->id,
                            'error' => $e->getMessage(),
                        ]);
                        $this->advance($recurringInvoice, success: false);
                        $this->notify($recurringInvoice, 'Recurring invoice skipped', "Could not generate the invoice for {$recurringInvoice->customer?->name}: {$e->getMessage()}");
                    }
                }
            });

        return $generated;
    }

    /**
     * Create a Sale (+ SaleItems) from a recurring invoice template right now, and advance
     * its schedule. Used by both the daily batch job and the manual "Run now" action.
     */
    public function generateOne(RecurringInvoice $recurringInvoice): Sale
    {
        $recurringInvoice->loadMissing(['items', 'customer', 'business']);
        $business = $recurringInvoice->business;
        $customer = $recurringInvoice->customer;

        if (!$business || !$customer) {
            throw new \RuntimeException('Business or customer no longer exists');
        }
        if ($recurringInvoice->items->isEmpty()) {
            throw new \RuntimeException('Recurring invoice has no items');
        }

        $productIds = $recurringInvoice->items->pluck('product_id');
        $products = Product::where('business_id', $business->id)->whereIn('id', $productIds)->get()->keyBy('id');
        if ($products->count() !== $productIds->unique()->count()) {
            throw new \RuntimeException('One or more products in this recurring invoice no longer exist');
        }

        $subtotal = $recurringInvoice->items->sum(fn ($item) => (int) $item->quantity * (float) $item->unit_price);
        $discount = (float) $recurringInvoice->discount;
        if ($discount > $subtotal) {
            throw new \RuntimeException('Discount exceeds the invoice subtotal');
        }
        $taxRate = (float) ($recurringInvoice->tax_rate ?? $business->default_tax_rate ?? 0);
        $taxAmount = round(($subtotal - $discount) * $taxRate / 100, 2);
        $netAmount = $subtotal - $discount + $taxAmount;
        $paidAmount = $recurringInvoice->payment_method === 'CREDIT' ? 0 : $netAmount;
        $balanceDue = $netAmount - $paidAmount;

        if ($balanceDue > 0 && (float) $customer->credit_limit > 0
            && (float) $customer->credit_balance + $balanceDue > (float) $customer->credit_limit) {
            throw new \RuntimeException("This invoice would exceed {$customer->name}'s credit limit");
        }

        $sale = DB::transaction(function () use ($business, $recurringInvoice, $customer, $products, $subtotal, $discount, $taxRate, $taxAmount, $paidAmount, $balanceDue) {
            foreach ($recurringInvoice->items as $item) {
                $product = Product::where('id', $item->product_id)->where('business_id', $business->id)->lockForUpdate()->firstOrFail();
                if (!$product->is_active || $product->stock_quantity < $item->quantity) {
                    throw new \RuntimeException("Insufficient stock for {$product->name}");
                }
                $product->decrement('stock_quantity', $item->quantity);
            }

            $sequence = Sale::where('business_id', $business->id)->lockForUpdate()->count() + 1;
            $totalQuantity = $recurringInvoice->items->sum('quantity');
            $sale = Sale::create([
                'id' => Str::uuid(),
                'business_id' => $business->id,
                'branch_id' => $recurringInvoice->branch_id,
                'customer_id' => $customer->id,
                'customer_name' => $customer->name,
                'receipt_number' => sprintf('BT-%s-%05d', now()->format('Ym'), $sequence),
                'product_id' => null,
                'quantity' => $totalQuantity,
                'unit_price' => $totalQuantity > 0 ? $subtotal / $totalQuantity : 0,
                'total_amount' => $subtotal,
                'discount' => $discount,
                'promotion_discount' => 0,
                'tax_rate' => $taxRate,
                'tax_amount' => $taxAmount,
                'paid_amount' => $paidAmount,
                'initial_paid_amount' => $paidAmount,
                'payment_due_date' => $balanceDue > 0 ? now()->toDateString() : null,
                'payment_method' => $recurringInvoice->payment_method,
                'sale_date' => now()->toDateString(),
                'notes' => $recurringInvoice->notes ? "Recurring invoice: {$recurringInvoice->notes}" : 'Generated from a recurring invoice',
                'created_by' => $recurringInvoice->created_by,
            ]);

            foreach ($recurringInvoice->items as $item) {
                $product = $products[$item->product_id];
                $price = (float) $item->unit_price;
                SaleItem::create([
                    'id' => Str::uuid(),
                    'sale_id' => $sale->id,
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'quantity' => $item->quantity,
                    'buying_price' => $product->buying_price,
                    'selling_price' => $price,
                    'discount' => 0,
                    'profit' => ($price - (float) $product->buying_price) * $item->quantity,
                    'total' => $price * $item->quantity,
                ]);
            }

            if ($balanceDue > 0) {
                $customer->increment('credit_balance', $balanceDue);
            }

            $this->debtService->createFromSale($sale, $recurringInvoice->created_by);

            AuditService::log([
                'actor_id' => $recurringInvoice->created_by,
                'action' => 'RECURRING_INVOICE_GENERATED',
                'target_type' => 'Sale',
                'target_id' => $sale->id,
                'metadata' => ['recurring_invoice_id' => $recurringInvoice->id],
            ]);

            $this->advance($recurringInvoice);

            return $sale;
        });
        $this->notify($recurringInvoice, 'Recurring invoice generated', "Invoice {$sale->receipt_number} for {$customer->name} ({$business->currency} " . number_format($netAmount, 2) . ') was created automatically.', $sale->id);

        return $sale;
    }

    private function advance(RecurringInvoice $recurringInvoice, bool $success = true): void
    {
        $next = match ($recurringInvoice->frequency) {
            'WEEKLY' => $recurringInvoice->next_run_date->copy()->addWeek(),
            'QUARTERLY' => $recurringInvoice->next_run_date->copy()->addMonths(3),
            default => $recurringInvoice->next_run_date->copy()->addMonth(),
        };

        $recurringInvoice->update([
            'next_run_date' => $next,
            'last_run_date' => $success ? now()->toDateString() : $recurringInvoice->last_run_date,
            'generated_count' => $success ? $recurringInvoice->generated_count + 1 : $recurringInvoice->generated_count,
        ]);
    }

    private function notify(RecurringInvoice $recurringInvoice, string $title, string $message, ?string $referenceId = null): void
    {
        $ownerId = $recurringInvoice->created_by ?? $recurringInvoice->business?->user_id;
        if (!$ownerId) {
            return;
        }

        // Uses the existing 'GENERAL' notification type (rather than a new enum value) so this
        // insert is valid under both the MySQL enum and the SQLite CHECK constraint it compiles to.
        try {
            InventoryNotification::create([
                'id' => Str::uuid(),
                'business_id' => $recurringInvoice->business_id,
                'user_id' => $ownerId,
                'title' => $title,
                'message' => $message,
                'type' => 'GENERAL',
                'reference_id' => $referenceId ?? $recurringInvoice->id,
                'is_read' => false,
            ]);
        } catch (\Throwable $e) {
            Log::warning('Recurring invoice notification could not be created', [
                'recurring_invoice_id' => $recurringInvoice->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
