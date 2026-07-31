<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Business;
use App\Models\BusinessMembership;
use App\Models\Customer;
use App\Models\Debt;
use App\Models\DebtReminder;
use App\Models\DebtSetting;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Str;
use Tests\TestCase;

class DebtTest extends TestCase
{
    use RefreshDatabase;

    private function makeBusiness(): array
    {
        $owner = User::factory()->create();
        $business = Business::factory()->create(['user_id' => $owner->id]);
        $branch = Branch::factory()->create(['business_id' => $business->id]);

        return [$owner, $business, $branch];
    }

    private function authHeaders(User $user): array
    {
        $token = auth('api')->login($user);
        return ['Authorization' => "Bearer {$token}"];
    }

    public function test_credit_sale_creates_customer_debt(): void
    {
        [$owner, $business] = $this->makeBusiness();
        $customer = Customer::factory()->create(['business_id' => $business->id]);

        $response = $this->withHeaders($this->authHeaders($owner))->postJson('/api/sales', [
            'customerId' => $customer->id,
            'quantity' => 2,
            'unitPrice' => 50,
            'paidAmount' => 0,
            'paymentMethod' => 'CREDIT',
            'saleDate' => now()->toDateString(),
            'paymentDueDate' => now()->addDays(30)->toDateString(),
        ]);

        $response->assertCreated();
        $saleId = $response->json('data.id');

        $debt = Debt::where('sale_id', $saleId)->first();
        $this->assertNotNull($debt);
        $this->assertSame('CUSTOMER', $debt->type);
        $this->assertSame('AUTO_SALE', $debt->source);
        $this->assertSame('ACTIVE', $debt->status);
        $this->assertEquals(100.0, (float) $debt->original_amount);
        $this->assertEquals(100.0, (float) $debt->outstanding_balance);
        $this->assertStringStartsWith('DR-', $debt->debt_number);
    }

    public function test_credit_purchase_creates_supplier_debt_on_receive(): void
    {
        [$owner, $business] = $this->makeBusiness();
        $supplier = Supplier::factory()->create(['business_id' => $business->id]);

        $create = $this->withHeaders($this->authHeaders($owner))->postJson('/api/purchases', [
            'supplierId' => $supplier->id,
            'items' => [
                ['productName' => 'Widget', 'quantity' => 10, 'unitPrice' => 20],
            ],
        ]);
        $create->assertCreated();
        $purchaseId = $create->json('data.id');

        $this->assertNull(Debt::where('purchase_order_id', $purchaseId)->first());

        $receive = $this->withHeaders($this->authHeaders($owner))->putJson("/api/purchases/{$purchaseId}/receive", []);
        $receive->assertOk();

        $debt = Debt::where('purchase_order_id', $purchaseId)->first();
        $this->assertNotNull($debt);
        $this->assertSame('SUPPLIER', $debt->type);
        $this->assertSame('AUTO_PURCHASE', $debt->source);
        $this->assertEquals(200.0, (float) $debt->original_amount);
    }

    public function test_partial_and_full_payment_transition_status_and_cancel_reminders(): void
    {
        [$owner, $business] = $this->makeBusiness();
        $customer = Customer::factory()->create(['business_id' => $business->id]);

        $create = $this->withHeaders($this->authHeaders($owner))->postJson('/api/debts', [
            'type' => 'CUSTOMER',
            'customerId' => $customer->id,
            'originalAmount' => 100,
            'debtDate' => now()->toDateString(),
            'dueDate' => now()->addDays(10)->toDateString(),
        ]);
        $create->assertCreated();
        $debtId = $create->json('data.id');

        $reminder = DebtReminder::create([
            'id' => Str::uuid(),
            'business_id' => $business->id,
            'debt_id' => $debtId,
            'channel' => 'EMAIL',
            'trigger_type' => 'BEFORE_DUE',
            'scheduled_for' => now(),
            'status' => 'PENDING',
        ]);

        $partial = $this->withHeaders($this->authHeaders($owner))->postJson("/api/debts/{$debtId}/payments", [
            'amount' => 40,
            'paymentDate' => now()->toDateString(),
            'paymentMethod' => 'CASH',
        ]);
        $partial->assertCreated();
        $this->assertSame('PARTIALLY_PAID', $partial->json('data.debt.status'));
        $this->assertEquals(60.0, $partial->json('data.debt.outstandingBalance'));

        $full = $this->withHeaders($this->authHeaders($owner))->postJson("/api/debts/{$debtId}/payments", [
            'amount' => 60,
            'paymentDate' => now()->toDateString(),
            'paymentMethod' => 'CASH',
        ]);
        $full->assertCreated();
        $this->assertSame('PAID', $full->json('data.debt.status'));
        $this->assertEquals(0.0, $full->json('data.debt.outstandingBalance'));

        $this->assertSame('CANCELLED', $reminder->fresh()->status);
    }

    public function test_overpayment_rejected_unless_allowed_in_settings(): void
    {
        [$owner, $business] = $this->makeBusiness();
        $customer = Customer::factory()->create(['business_id' => $business->id]);

        $create = $this->withHeaders($this->authHeaders($owner))->postJson('/api/debts', [
            'type' => 'CUSTOMER',
            'customerId' => $customer->id,
            'originalAmount' => 50,
            'debtDate' => now()->toDateString(),
        ]);
        $debtId = $create->json('data.id');

        $rejected = $this->withHeaders($this->authHeaders($owner))->postJson("/api/debts/{$debtId}/payments", [
            'amount' => 100,
            'paymentDate' => now()->toDateString(),
            'paymentMethod' => 'CASH',
        ]);
        $rejected->assertStatus(422);

        $this->withHeaders($this->authHeaders($owner))->putJson('/api/debt-settings', ['allowOverpayments' => true])->assertOk();

        $accepted = $this->withHeaders($this->authHeaders($owner))->postJson("/api/debts/{$debtId}/payments", [
            'amount' => 100,
            'paymentDate' => now()->toDateString(),
            'paymentMethod' => 'CASH',
        ]);
        $accepted->assertCreated();
        $this->assertSame('PAID', $accepted->json('data.debt.status'));
    }

    public function test_process_reminders_command_marks_overdue_debts(): void
    {
        [$owner, $business] = $this->makeBusiness();
        $customer = Customer::factory()->create(['business_id' => $business->id]);

        $create = $this->withHeaders($this->authHeaders($owner))->postJson('/api/debts', [
            'type' => 'CUSTOMER',
            'customerId' => $customer->id,
            'originalAmount' => 20,
            'debtDate' => now()->subDays(15)->toDateString(),
            'dueDate' => now()->subDays(5)->toDateString(),
        ]);
        $debtId = $create->json('data.id');
        $this->assertSame('ACTIVE', Debt::find($debtId)->status);

        Artisan::call('debts:process-reminders');

        $this->assertSame('OVERDUE', Debt::find($debtId)->fresh()->status);
    }

    public function test_permission_middleware_blocks_write_off_for_restricted_staff(): void
    {
        [$owner, $business, $branch] = $this->makeBusiness();
        $customer = Customer::factory()->create(['business_id' => $business->id]);

        $create = $this->withHeaders($this->authHeaders($owner))->postJson('/api/debts', [
            'type' => 'CUSTOMER',
            'customerId' => $customer->id,
            'originalAmount' => 30,
            'debtDate' => now()->toDateString(),
        ]);
        $debtId = $create->json('data.id');

        $staff = User::factory()->create();
        BusinessMembership::create([
            'business_id' => $business->id,
            'user_id' => $staff->id,
            'branch_id' => $branch->id,
            'role' => 'CASHIER',
            'permissions' => ['dashboard.view', 'debts.view', 'debts.create', 'debts.record_payment'],
            'status' => 'ACTIVE',
        ]);

        $response = $this->withHeaders($this->authHeaders($staff))->postJson("/api/debts/{$debtId}/write-off", [
            'reason' => 'Uncollectible',
        ]);

        $response->assertStatus(403);
    }

    public function test_debts_are_isolated_by_business_and_branch(): void
    {
        [$ownerA, $businessA, $branchA1] = $this->makeBusiness();
        $branchA2 = Branch::factory()->create(['business_id' => $businessA->id, 'name' => 'Second Branch', 'code' => 'SEC', 'is_default' => false]);
        $customerA = Customer::factory()->create(['business_id' => $businessA->id]);

        $create = $this->withHeaders($this->authHeaders($ownerA))->postJson('/api/debts', [
            'type' => 'CUSTOMER',
            'customerId' => $customerA->id,
            'originalAmount' => 75,
            'debtDate' => now()->toDateString(),
        ]);
        $debtId = $create->json('data.id');
        $this->assertSame($branchA1->id, Debt::find($debtId)->branch_id);

        // A different business entirely cannot see it.
        [$ownerB] = $this->makeBusiness();
        $this->withHeaders($this->authHeaders($ownerB))->getJson("/api/debts/{$debtId}")->assertStatus(404);

        // A staff member of the SAME business but assigned to a different branch cannot see it either.
        $staffOtherBranch = User::factory()->create();
        BusinessMembership::create([
            'business_id' => $businessA->id,
            'user_id' => $staffOtherBranch->id,
            'branch_id' => $branchA2->id,
            'role' => 'CASHIER',
            'permissions' => ['dashboard.view', 'debts.view'],
            'status' => 'ACTIVE',
        ]);
        $listOtherBranch = $this->withHeaders($this->authHeaders($staffOtherBranch))->getJson('/api/debts');
        $listOtherBranch->assertOk();
        $this->assertSame(0, $listOtherBranch->json('data.total'));

        // The owner (default branch) still sees it.
        $listOwner = $this->withHeaders($this->authHeaders($ownerA))->getJson('/api/debts');
        $this->assertSame(1, $listOwner->json('data.total'));
    }
}
