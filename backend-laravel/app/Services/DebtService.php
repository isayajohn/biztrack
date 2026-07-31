<?php

namespace App\Services;

use App\Models\Business;
use App\Models\Customer;
use App\Models\Debt;
use App\Models\DebtPayment;
use App\Models\DebtSetting;
use App\Models\InventoryNotification;
use App\Models\PurchaseOrder;
use App\Models\Sale;
use App\Models\Supplier;
use App\Services\AuditService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DebtService
{
    public function createFromSale(Sale $sale, ?string $createdBy = null): ?Debt
    {
        $balanceDue = max(0, (float) $sale->total_amount - (float) $sale->discount - (float) $sale->promotion_discount + (float) $sale->tax_amount - (float) $sale->paid_amount);
        if ($balanceDue <= 0 || !$sale->customer_id || Debt::where('sale_id', $sale->id)->exists()) {
            return null;
        }

        return DB::transaction(function () use ($sale, $balanceDue, $createdBy) {
            $debt = Debt::create([
                'id' => Str::uuid(),
                'business_id' => $sale->business_id,
                'branch_id' => $sale->branch_id,
                'debt_number' => $this->nextDebtNumber($sale->business_id, 'CUSTOMER'),
                'type' => 'CUSTOMER',
                'customer_id' => $sale->customer_id,
                'sale_id' => $sale->id,
                'source' => 'AUTO_SALE',
                'original_amount' => $balanceDue,
                'total_paid' => 0,
                'outstanding_balance' => $balanceDue,
                'debt_date' => $sale->sale_date,
                'due_date' => $sale->payment_due_date,
                'description' => "Credit sale {$sale->receipt_number}",
                'status' => 'ACTIVE',
                'created_by' => $createdBy,
            ]);

            AuditService::log([
                'actor_id' => $createdBy,
                'action' => 'DEBT_CREATED',
                'target_type' => 'Debt',
                'target_id' => $debt->id,
                'metadata' => ['source' => 'AUTO_SALE', 'saleId' => $sale->id],
            ]);

            return $debt;
        });
    }

    public function createFromPurchase(PurchaseOrder $purchase, float $outstanding, ?string $createdBy = null): ?Debt
    {
        if ($outstanding <= 0 || !$purchase->supplier_id || Debt::where('purchase_order_id', $purchase->id)->exists()) {
            return null;
        }

        return DB::transaction(function () use ($purchase, $outstanding, $createdBy) {
            $debt = Debt::create([
                'id' => Str::uuid(),
                'business_id' => $purchase->business_id,
                'branch_id' => $purchase->branch_id,
                'debt_number' => $this->nextDebtNumber($purchase->business_id, 'SUPPLIER'),
                'type' => 'SUPPLIER',
                'supplier_id' => $purchase->supplier_id,
                'purchase_order_id' => $purchase->id,
                'source' => 'AUTO_PURCHASE',
                'original_amount' => $outstanding,
                'total_paid' => 0,
                'outstanding_balance' => $outstanding,
                'debt_date' => $purchase->received_date ?? now()->toDateString(),
                'due_date' => $purchase->expected_date,
                'description' => "Purchase order {$purchase->order_number}",
                'status' => 'ACTIVE',
                'created_by' => $createdBy,
            ]);

            AuditService::log([
                'actor_id' => $createdBy,
                'action' => 'DEBT_CREATED',
                'target_type' => 'Debt',
                'target_id' => $debt->id,
                'metadata' => ['source' => 'AUTO_PURCHASE', 'purchaseOrderId' => $purchase->id],
            ]);

            return $debt;
        });
    }

    public function createManual(array $data, ?string $createdBy = null): Debt
    {
        return DB::transaction(function () use ($data, $createdBy) {
            $originalAmount = (float) $data['originalAmount'];
            $debt = Debt::create([
                'id' => Str::uuid(),
                'business_id' => $data['businessId'],
                'branch_id' => $data['branchId'] ?? null,
                'debt_number' => $this->nextDebtNumber($data['businessId'], $data['type']),
                'type' => $data['type'],
                'customer_id' => $data['customerId'] ?? null,
                'supplier_id' => $data['supplierId'] ?? null,
                'source' => 'MANUAL',
                'original_amount' => $originalAmount,
                'total_paid' => 0,
                'outstanding_balance' => $originalAmount,
                'debt_date' => $data['debtDate'],
                'due_date' => $data['dueDate'] ?? null,
                'description' => $data['description'] ?? null,
                'notes' => $data['notes'] ?? null,
                'status' => $data['status'] ?? 'ACTIVE',
                'created_by' => $createdBy,
            ]);

            AuditService::log([
                'actor_id' => $createdBy,
                'action' => 'DEBT_CREATED',
                'target_type' => 'Debt',
                'target_id' => $debt->id,
                'metadata' => ['source' => 'MANUAL'],
            ]);

            return $debt;
        });
    }

    public function recordPayment(Debt $debt, array $data, ?string $recordedBy = null): DebtPayment
    {
        if (in_array($debt->status, ['PAID', 'CANCELLED', 'WRITTEN_OFF'], true)) {
            throw new \RuntimeException("Cannot record a payment on a debt with status {$debt->status}");
        }

        $amount = (float) $data['amount'];
        $settings = DebtSetting::where('business_id', $debt->business_id)->first() ?? DebtSetting::defaultsFor($debt->business_id);

        if (!$settings->allow_overpayments && $amount > (float) $debt->outstanding_balance) {
            throw new \RuntimeException('Payment amount exceeds the outstanding balance for this debt');
        }

        return DB::transaction(function () use ($debt, $data, $amount, $recordedBy) {
            $payment = DebtPayment::create([
                'id' => Str::uuid(),
                'business_id' => $debt->business_id,
                'debt_id' => $debt->id,
                'amount' => $amount,
                'payment_date' => $data['paymentDate'],
                'payment_method' => $data['paymentMethod'],
                'transaction_reference' => $data['transactionReference'] ?? null,
                'notes' => $data['notes'] ?? null,
                'recorded_by' => $recordedBy,
            ]);

            $debt->total_paid = (float) $debt->total_paid + $amount;
            $debt->recalculateBalance();
            $debt->save();

            $this->mirrorBalanceChange($debt, -$amount);

            if (in_array($debt->status, ['PAID'], true)) {
                $this->cancelPendingReminders($debt);
            }

            $this->notifyInApp($debt, 'Payment received', "A payment of {$amount} was recorded for debt {$debt->debt_number}.");

            AuditService::log([
                'actor_id' => $recordedBy,
                'action' => 'DEBT_PAYMENT_RECORDED',
                'target_type' => 'Debt',
                'target_id' => $debt->id,
                'metadata' => ['paymentId' => $payment->id, 'amount' => $amount],
            ]);

            return $payment;
        });
    }

    public function reversePayment(DebtPayment $payment, string $reason, ?string $reversedBy = null): DebtPayment
    {
        if ($payment->isReversed()) {
            throw new \RuntimeException('This payment has already been reversed');
        }

        return DB::transaction(function () use ($payment, $reason, $reversedBy) {
            $debt = $payment->debt()->lockForUpdate()->first();

            $payment->update([
                'reversed_at' => now(),
                'reversed_by' => $reversedBy,
                'reversal_reason' => $reason,
            ]);

            $debt->total_paid = max(0, (float) $debt->total_paid - (float) $payment->amount);
            $debt->recalculateBalance();
            $debt->save();

            $this->mirrorBalanceChange($debt, (float) $payment->amount);

            AuditService::log([
                'actor_id' => $reversedBy,
                'action' => 'DEBT_PAYMENT_REVERSED',
                'target_type' => 'Debt',
                'target_id' => $debt->id,
                'metadata' => ['paymentId' => $payment->id, 'amount' => (float) $payment->amount, 'reason' => $reason],
            ]);

            return $payment;
        });
    }

    public function writeOff(Debt $debt, string $reason, ?string $actorId = null): Debt
    {
        return DB::transaction(function () use ($debt, $reason, $actorId) {
            $debt->update([
                'status' => 'WRITTEN_OFF',
                'notes' => trim(($debt->notes ? $debt->notes . "\n" : '') . "Written off: {$reason}"),
            ]);
            $this->cancelPendingReminders($debt);

            AuditService::log([
                'actor_id' => $actorId,
                'action' => 'DEBT_WRITTEN_OFF',
                'target_type' => 'Debt',
                'target_id' => $debt->id,
                'metadata' => ['reason' => $reason],
            ]);

            return $debt;
        });
    }

    public function cancel(Debt $debt, string $reason, ?string $actorId = null): Debt
    {
        if (in_array($debt->status, ['PAID', 'WRITTEN_OFF'], true)) {
            throw new \RuntimeException("Cannot cancel a debt with status {$debt->status}");
        }

        return DB::transaction(function () use ($debt, $reason, $actorId) {
            $debt->update([
                'status' => 'CANCELLED',
                'notes' => trim(($debt->notes ? $debt->notes . "\n" : '') . "Cancelled: {$reason}"),
            ]);
            $this->cancelPendingReminders($debt);

            AuditService::log([
                'actor_id' => $actorId,
                'action' => 'DEBT_CANCELLED',
                'target_type' => 'Debt',
                'target_id' => $debt->id,
                'metadata' => ['reason' => $reason],
            ]);

            return $debt;
        });
    }

    public function dispute(Debt $debt, string $reason, ?string $actorId = null): Debt
    {
        $debt->update([
            'status' => 'DISPUTED',
            'notes' => trim(($debt->notes ? $debt->notes . "\n" : '') . "Disputed: {$reason}"),
        ]);

        AuditService::log([
            'actor_id' => $actorId,
            'action' => 'DEBT_STATUS_CHANGED',
            'target_type' => 'Debt',
            'target_id' => $debt->id,
            'metadata' => ['status' => 'DISPUTED', 'reason' => $reason],
        ]);

        return $debt;
    }

    public function markOverdue(): int
    {
        return Debt::whereNotIn('status', array_merge(['DRAFT', 'PAID', 'OVERDUE'], Debt::TERMINAL_MANUAL_STATUSES))
            ->whereNotNull('due_date')
            ->whereDate('due_date', '<', now()->toDateString())
            ->where('outstanding_balance', '>', 0)
            ->update(['status' => 'OVERDUE']);
    }

    public function cancelPendingReminders(Debt $debt): void
    {
        $debt->reminders()->where('status', 'PENDING')->update(['status' => 'CANCELLED']);
    }

    public function nextDebtNumber(string $businessId, string $type): string
    {
        $prefix = $type === 'SUPPLIER' ? 'DP' : 'DR';
        $sequence = Debt::where('business_id', $businessId)->lockForUpdate()->count() + 1;
        return sprintf('%s-%s-%05d', $prefix, now()->format('Ym'), $sequence);
    }

    private function mirrorBalanceChange(Debt $debt, float $delta): void
    {
        if ($debt->source === 'MANUAL') {
            return;
        }

        if ($debt->type === 'CUSTOMER' && $debt->customer_id) {
            Customer::where('id', $debt->customer_id)->increment('credit_balance', $delta);
        } elseif ($debt->type === 'SUPPLIER' && $debt->supplier_id) {
            Supplier::where('id', $debt->supplier_id)->increment('balance', $delta);
        }
    }

    private function notifyInApp(Debt $debt, string $title, string $message): void
    {
        $ownerId = $debt->created_by ?? Business::where('id', $debt->business_id)->value('user_id');
        if (!$ownerId) {
            return;
        }

        // Uses the existing 'GENERAL' notification type (rather than a new enum value) so this
        // insert is valid under both the MySQL enum and the SQLite CHECK constraint it compiles to.
        InventoryNotification::create([
            'id' => Str::uuid(),
            'business_id' => $debt->business_id,
            'user_id' => $ownerId,
            'title' => $title,
            'message' => $message,
            'type' => 'GENERAL',
            'reference_id' => $debt->id,
            'is_read' => false,
        ]);
    }
}
