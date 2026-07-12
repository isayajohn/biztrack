<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('branches', function (Blueprint $table) {
            $table->uuid('id')->primary(); $table->uuid('business_id'); $table->string('name'); $table->string('code');
            $table->string('phone')->nullable(); $table->text('address')->nullable(); $table->boolean('is_default')->default(false); $table->boolean('is_active')->default(true); $table->timestamps();
            $table->foreign('business_id')->references('id')->on('businesses')->cascadeOnDelete(); $table->unique(['business_id', 'code']);
        });
        Schema::create('business_memberships', function (Blueprint $table) {
            $table->uuid('id')->primary(); $table->uuid('business_id'); $table->uuid('user_id'); $table->uuid('branch_id')->nullable();
            $table->enum('role', ['OWNER', 'MANAGER', 'CASHIER', 'INVENTORY', 'ACCOUNTANT', 'CUSTOM'])->default('CUSTOM'); $table->json('permissions')->nullable(); $table->enum('status', ['ACTIVE', 'INACTIVE'])->default('ACTIVE'); $table->timestamps();
            $table->foreign('business_id')->references('id')->on('businesses')->cascadeOnDelete(); $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete(); $table->foreign('branch_id')->references('id')->on('branches')->nullOnDelete(); $table->unique(['business_id', 'user_id']);
        });
        foreach (['sales', 'expenses', 'purchase_orders', 'stock_movements'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table) { $table->uuid('branch_id')->nullable()->after('business_id'); $table->foreign('branch_id')->references('id')->on('branches')->nullOnDelete(); });
        }
        foreach (DB::table('businesses')->get() as $business) {
            $branchId = (string) Str::uuid();
            DB::table('branches')->insert(['id' => $branchId, 'business_id' => $business->id, 'name' => 'Main Branch', 'code' => 'MAIN', 'is_default' => true, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()]);
            DB::table('business_memberships')->insert(['id' => (string) Str::uuid(), 'business_id' => $business->id, 'user_id' => $business->user_id, 'branch_id' => $branchId, 'role' => 'OWNER', 'permissions' => json_encode(['*']), 'status' => 'ACTIVE', 'created_at' => now(), 'updated_at' => now()]);
            foreach (['sales', 'expenses', 'purchase_orders', 'stock_movements'] as $tableName) DB::table($tableName)->where('business_id', $business->id)->update(['branch_id' => $branchId]);
        }
    }
    public function down(): void
    {
        foreach (['stock_movements', 'purchase_orders', 'expenses', 'sales'] as $tableName) Schema::table($tableName, function (Blueprint $table) { $table->dropForeign(['branch_id']); $table->dropColumn('branch_id'); });
        Schema::dropIfExists('business_memberships'); Schema::dropIfExists('branches');
    }
};
