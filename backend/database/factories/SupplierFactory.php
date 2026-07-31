<?php

namespace Database\Factories;

use App\Models\Business;
use App\Models\Supplier;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Supplier>
 */
class SupplierFactory extends Factory
{
    protected $model = Supplier::class;

    public function definition(): array
    {
        return [
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'business_id' => Business::factory(),
            'name' => fake()->company(),
            'phone' => fake()->numerify('07########'),
            'email' => fake()->safeEmail(),
            'balance' => 0,
            'is_active' => true,
        ];
    }
}
