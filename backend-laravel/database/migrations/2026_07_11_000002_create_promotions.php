<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('promotions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('business_id');
            $table->string('name');
            $table->string('code');
            $table->enum('type', ['PERCENTAGE', 'FIXED']);
            $table->decimal('value', 12, 2);
            $table->decimal('minimum_purchase', 12, 2)->default(0);
            $table->decimal('maximum_discount', 12, 2)->nullable();
            $table->timestamp('starts_at');
            $table->timestamp('ends_at');
            $table->integer('usage_limit')->nullable();
            $table->integer('times_used')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->foreign('business_id')->references('id')->on('businesses')->cascadeOnDelete();
            $table->unique(['business_id', 'code']);
            $table->index(['business_id', 'is_active', 'starts_at', 'ends_at']);
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->uuid('promotion_id')->nullable()->after('customer_id');
            $table->decimal('promotion_discount', 12, 2)->default(0)->after('discount');
            $table->foreign('promotion_id')->references('id')->on('promotions')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropForeign(['promotion_id']);
            $table->dropColumn(['promotion_id', 'promotion_discount']);
        });
        Schema::dropIfExists('promotions');
    }
};
