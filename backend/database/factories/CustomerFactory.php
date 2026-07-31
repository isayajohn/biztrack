<?php

namespace Database\Factories;

use App\Models\Business;
use App\Models\Customer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Customer>
 */
class CustomerFactory extends Factory
{
    protected $model = Customer::class;

    public function definition(): array
    {
        return [
            'business_id' => Business::factory(),
            'name' => fake()->name(),
            'phone' => fake()->numerify('07########'),
            'email' => fake()->safeEmail(),
            'credit_limit' => 0,
            'credit_balance' => 0,
            'is_active' => true,
        ];
    }
}
