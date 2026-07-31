<?php

namespace Tests\Feature;

use App\Http\Controllers\Api\AdminPackageController;
use App\Models\Package;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

class PackageVisibilityTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('packages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->decimal('price_monthly', 12, 2);
            $table->decimal('price_yearly', 12, 2)->nullable();
            $table->string('currency');
            $table->integer('trial_days')->default(0);
            $table->integer('max_businesses');
            $table->integer('max_users');
            $table->integer('max_products');
            $table->integer('max_sales_per_month');
            $table->integer('max_expenses_per_month');
            $table->boolean('allow_reports');
            $table->boolean('allow_pdf_export');
            $table->boolean('allow_csv_export');
            $table->boolean('allow_inventory_alerts');
            $table->boolean('allow_ai_insights');
            $table->string('status')->default('ACTIVE');
            $table->boolean('is_visible')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('actor_id')->nullable();
            $table->string('action');
            $table->string('target_type');
            $table->string('target_id')->nullable();
            $table->json('metadata')->nullable();
            $table->string('target_user_id')->nullable();
            $table->json('details')->nullable();
            $table->timestamp('created_at')->nullable();
        });
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('packages');
        parent::tearDown();
    }

    public function test_public_packages_only_include_active_visible_packages(): void
    {
        $visible = $this->createPackage(['name' => 'Free', 'slug' => 'free']);
        $this->createPackage(['name' => 'Hidden Pro', 'slug' => 'hidden-pro', 'is_visible' => false]);
        $this->createPackage(['name' => 'Inactive', 'slug' => 'inactive', 'status' => 'INACTIVE']);

        $response = $this->getJson('/api/public/packages');

        $response->assertOk()
            ->assertJsonCount(1, 'data.packages')
            ->assertJsonPath('data.packages.0.id', $visible->id);
    }

    public function test_visibility_action_hides_a_package_from_users(): void
    {
        $package = $this->createPackage(['name' => 'Pro', 'slug' => 'pro']);

        $request = Request::create('/api/admin/packages/'.$package->id.'/visibility', 'PATCH', [
            'isVisible' => false,
        ]);
        $response = app(AdminPackageController::class)->updatePackageVisibility($request, $package->id);

        $this->assertSame(200, $response->getStatusCode());
        $this->assertFalse($response->getData(true)['data']['isVisible']);

        $this->assertDatabaseHas('packages', ['id' => $package->id, 'is_visible' => false]);
        $this->getJson('/api/public/packages')->assertJsonCount(0, 'data.packages');
    }

    private function createPackage(array $overrides = []): Package
    {
        return Package::create(array_merge([
            'id' => (string) Str::uuid(),
            'name' => 'Package',
            'slug' => 'package-'.Str::lower(Str::random(8)),
            'description' => null,
            'price_monthly' => 0,
            'price_yearly' => null,
            'currency' => 'TZS',
            'trial_days' => 0,
            'max_businesses' => 1,
            'max_users' => 1,
            'max_products' => 50,
            'max_sales_per_month' => 500,
            'max_expenses_per_month' => 500,
            'allow_reports' => true,
            'allow_pdf_export' => false,
            'allow_csv_export' => true,
            'allow_inventory_alerts' => false,
            'allow_ai_insights' => false,
            'status' => 'ACTIVE',
            'is_visible' => true,
            'sort_order' => 0,
        ], $overrides));
    }
}
