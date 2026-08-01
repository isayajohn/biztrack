<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Customer;
use App\Models\Debt;
use App\Models\Product;
use App\Models\RecurringInvoice;
use App\Models\Sale;
use App\Models\User;
use App\Services\DebtService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Str;
use Mockery\MockInterface;
use Tests\TestCase;

class RecurringInvoiceTest extends TestCase
{
    use RefreshDatabase;

    private function makeBusiness(): array
    {
        $owner = User::factory()->create();
        $business = Business::factory()->create(['user_id' => $owner->id]);

        return [$owner, $business];
    }

    private function authHeaders(User $user): array
    {
        $token = auth('api')->login($user);
        return ['Authorization' => "Bearer {$token}"];
    }

    private function makeProduct(Business $business, array $overrides = []): Product
    {
        return Product::create(array_merge([
            'id' => Str::uuid(),
            'business_id' => $business->id,
            'name' => 'Widget',
            'sku' => 'WID-' . Str::random(6),
            'buying_price' => 10,
            'selling_price' => 25,
            'stock_quantity' => 100,
            'low_stock_level' => 5,
            'is_active' => true,
        ], $overrides));
    }

    public function test_create_and_run_now_generates_a_credit_sale_and_debt(): void
    {
        [$owner, $business] = $this->makeBusiness();
        $customer = Customer::factory()->create(['business_id' => $business->id]);
        $product = $this->makeProduct($business);

        $create = $this->withHeaders($this->authHeaders($owner))->postJson('/api/recurring-invoices', [
            'customerId' => $customer->id,
            'frequency' => 'MONTHLY',
            'startDate' => now()->toDateString(),
            'paymentMethod' => 'CREDIT',
            'items' => [
                ['productId' => $product->id, 'quantity' => 2, 'unitPrice' => 25],
            ],
        ]);
        $create->assertCreated();
        $recurringInvoiceId = $create->json('data.id');
        $this->assertSame(now()->toDateString(), $create->json('data.nextRunDate'));
        $this->assertSame(0, $create->json('data.generatedCount'));

        $run = $this->withHeaders($this->authHeaders($owner))->postJson("/api/recurring-invoices/{$recurringInvoiceId}/run-now");
        $run->assertOk();
        $saleId = $run->json('data.saleId');

        $sale = Sale::find($saleId);
        $this->assertNotNull($sale);
        $this->assertEquals(50.0, (float) $sale->total_amount);
        $this->assertEquals(0.0, (float) $sale->paid_amount);

        $this->assertEquals(98, $product->fresh()->stock_quantity);

        $debt = Debt::where('sale_id', $saleId)->first();
        $this->assertNotNull($debt);
        $this->assertEquals(50.0, (float) $debt->outstanding_balance);

        $recurringInvoice = RecurringInvoice::find($recurringInvoiceId);
        $this->assertSame(1, $recurringInvoice->generated_count);
        $this->assertSame(now()->addMonth()->toDateString(), $recurringInvoice->next_run_date->toDateString());
    }

    public function test_scheduled_command_only_generates_due_active_invoices(): void
    {
        [$owner, $business] = $this->makeBusiness();
        $customer = Customer::factory()->create(['business_id' => $business->id]);
        $product = $this->makeProduct($business);

        $due = $this->withHeaders($this->authHeaders($owner))->postJson('/api/recurring-invoices', [
            'customerId' => $customer->id,
            'frequency' => 'WEEKLY',
            'startDate' => now()->subDay()->toDateString(),
            'paymentMethod' => 'CASH',
            'items' => [['productId' => $product->id, 'quantity' => 1, 'unitPrice' => 25]],
        ])->json('data.id');

        $notDue = $this->withHeaders($this->authHeaders($owner))->postJson('/api/recurring-invoices', [
            'customerId' => $customer->id,
            'frequency' => 'WEEKLY',
            'startDate' => now()->addWeek()->toDateString(),
            'paymentMethod' => 'CASH',
            'items' => [['productId' => $product->id, 'quantity' => 1, 'unitPrice' => 25]],
        ])->json('data.id');

        $paused = $this->withHeaders($this->authHeaders($owner))->postJson('/api/recurring-invoices', [
            'customerId' => $customer->id,
            'frequency' => 'WEEKLY',
            'startDate' => now()->subDay()->toDateString(),
            'paymentMethod' => 'CASH',
            'items' => [['productId' => $product->id, 'quantity' => 1, 'unitPrice' => 25]],
        ])->json('data.id');
        $this->withHeaders($this->authHeaders($owner))->putJson("/api/recurring-invoices/{$paused}/status", ['status' => 'PAUSED'])->assertOk();

        Artisan::call('invoices:process-recurring');

        $this->assertSame(1, RecurringInvoice::find($due)->generated_count);
        $this->assertSame(0, RecurringInvoice::find($notDue)->generated_count);
        $this->assertSame(0, RecurringInvoice::find($paused)->generated_count);
    }

    public function test_insufficient_stock_is_skipped_without_blocking_other_invoices(): void
    {
        [$owner, $business] = $this->makeBusiness();
        $customer = Customer::factory()->create(['business_id' => $business->id]);
        $lowStock = $this->makeProduct($business, ['stock_quantity' => 1]);
        $wellStocked = $this->makeProduct($business);

        $failing = $this->withHeaders($this->authHeaders($owner))->postJson('/api/recurring-invoices', [
            'customerId' => $customer->id,
            'frequency' => 'WEEKLY',
            'startDate' => now()->toDateString(),
            'paymentMethod' => 'CASH',
            'items' => [['productId' => $lowStock->id, 'quantity' => 5, 'unitPrice' => 25]],
        ])->json('data.id');

        $succeeding = $this->withHeaders($this->authHeaders($owner))->postJson('/api/recurring-invoices', [
            'customerId' => $customer->id,
            'frequency' => 'WEEKLY',
            'startDate' => now()->toDateString(),
            'paymentMethod' => 'CASH',
            'items' => [['productId' => $wellStocked->id, 'quantity' => 1, 'unitPrice' => 25]],
        ])->json('data.id');

        Artisan::call('invoices:process-recurring');

        $failingInvoice = RecurringInvoice::find($failing);
        $this->assertSame(0, $failingInvoice->generated_count);
        $this->assertSame(now()->addWeek()->toDateString(), $failingInvoice->next_run_date->toDateString());

        $this->assertSame(1, RecurringInvoice::find($succeeding)->generated_count);
    }

    public function test_generation_rolls_back_sale_stock_and_schedule_if_debt_creation_fails(): void
    {
        [$owner, $business] = $this->makeBusiness();
        $customer = Customer::factory()->create(['business_id' => $business->id]);
        $product = $this->makeProduct($business);

        $recurringInvoiceId = $this->withHeaders($this->authHeaders($owner))->postJson('/api/recurring-invoices', [
            'customerId' => $customer->id,
            'frequency' => 'MONTHLY',
            'startDate' => now()->toDateString(),
            'paymentMethod' => 'CREDIT',
            'items' => [['productId' => $product->id, 'quantity' => 2, 'unitPrice' => 25]],
        ])->assertCreated()->json('data.id');

        $this->mock(DebtService::class, function (MockInterface $mock) {
            $mock->shouldReceive('createFromSale')->once()->andThrow(new \RuntimeException('Debt service unavailable'));
        });

        $this->withHeaders($this->authHeaders($owner))
            ->postJson("/api/recurring-invoices/{$recurringInvoiceId}/run-now")
            ->assertUnprocessable()
            ->assertJsonPath('error', 'Debt service unavailable');

        $invoice = RecurringInvoice::findOrFail($recurringInvoiceId);
        $this->assertSame(0, $invoice->generated_count);
        $this->assertSame(now()->toDateString(), $invoice->next_run_date->toDateString());
        $this->assertSame(100, $product->fresh()->stock_quantity);
        $this->assertSame(0, Sale::where('business_id', $business->id)->count());
    }
}
