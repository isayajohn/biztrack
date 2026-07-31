<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('business_id');
            $table->string('name');
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->text('address')->nullable();
            $table->decimal('credit_limit', 12, 2)->default(0);
            $table->decimal('credit_balance', 12, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('business_id')->references('id')->on('businesses')->cascadeOnDelete();
            $table->index(['business_id', 'name']);
            $table->index(['business_id', 'phone']);
            $table->index(['business_id', 'is_active']);
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->uuid('customer_id')->nullable()->after('business_id');
            $table->date('payment_due_date')->nullable()->after('paid_amount');
            $table->foreign('customer_id')->references('id')->on('customers')->nullOnDelete();
            $table->index(['business_id', 'customer_id']);
        });

        Schema::create('customer_payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('business_id');
            $table->uuid('customer_id');
            $table->uuid('sale_id')->nullable();
            $table->decimal('amount', 12, 2);
            $table->enum('payment_method', ['CASH', 'MOBILE_MONEY', 'BANK']);
            $table->date('payment_date');
            $table->string('reference')->nullable();
            $table->text('notes')->nullable();
            $table->uuid('created_by')->nullable();
            $table->timestamps();

            $table->foreign('business_id')->references('id')->on('businesses')->cascadeOnDelete();
            $table->foreign('customer_id')->references('id')->on('customers')->cascadeOnDelete();
            $table->foreign('sale_id')->references('id')->on('sales')->nullOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->index(['business_id', 'payment_date']);
            $table->index(['customer_id', 'payment_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_payments');

        Schema::table('sales', function (Blueprint $table) {
            $table->dropForeign(['customer_id']);
            $table->dropIndex(['business_id', 'customer_id']);
            $table->dropColumn(['customer_id', 'payment_due_date']);
        });

        Schema::dropIfExists('customers');
    }
};
