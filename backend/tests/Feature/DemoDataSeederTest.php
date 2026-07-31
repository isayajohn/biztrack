<?php

namespace Tests\Feature;

use Database\Seeders\DemoDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class DemoDataSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_demo_data_is_complete_consistent_and_idempotent(): void
    {
        $this->seed(DemoDataSeeder::class);
        $this->seed(DemoDataSeeder::class);

        $user = DB::table('users')->where('email', 'demo@biztrack.app')->first();
        $this->assertNotNull($user);
        $this->assertTrue(Hash::check('Demo@1234', $user->password_hash));

        $this->assertDatabaseCount('businesses', 1);
        $this->assertDatabaseCount('products', 8);
        $this->assertDatabaseCount('sales', 5);
        $this->assertDatabaseCount('sale_items', 17);
        $this->assertDatabaseCount('expenses', 5);
        $this->assertDatabaseCount('debts', 2);
        $this->assertDatabaseCount('debt_payments', 1);

        $sales = DB::table('sales')->get();
        foreach ($sales as $sale) {
            $itemsTotal = (float) DB::table('sale_items')->where('sale_id', $sale->id)->sum('total');
            $this->assertEquals((float) $sale->total_amount, $itemsTotal, "Sale {$sale->receipt_number} item totals do not match its subtotal.");
        }
    }
}
