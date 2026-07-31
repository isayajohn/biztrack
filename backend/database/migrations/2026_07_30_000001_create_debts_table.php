<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('debts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('business_id');
            $table->uuid('branch_id')->nullable();
            $table->string('debt_number');
            $table->enum('type', ['CUSTOMER', 'SUPPLIER']);
            $table->uuid('customer_id')->nullable();
            $table->uuid('supplier_id')->nullable();
            $table->uuid('sale_id')->nullable();
            $table->uuid('purchase_order_id')->nullable();
            $table->enum('source', ['AUTO_SALE', 'AUTO_PURCHASE', 'MANUAL'])->default('MANUAL');
            $table->decimal('original_amount', 12, 2);
            $table->decimal('total_paid', 12, 2)->default(0);
            $table->decimal('outstanding_balance', 12, 2);
            $table->date('debt_date');
            $table->date('due_date')->nullable();
            $table->text('description')->nullable();
            $table->text('notes')->nullable();
            $table->enum('status', ['DRAFT', 'ACTIVE', 'PARTIALLY_PAID', 'OVERDUE', 'PAID', 'DISPUTED', 'WRITTEN_OFF', 'CANCELLED'])->default('ACTIVE');
            $table->uuid('created_by')->nullable();
            $table->timestamps();

            $table->foreign('business_id')->references('id')->on('businesses')->cascadeOnDelete();
            $table->foreign('branch_id')->references('id')->on('branches')->nullOnDelete();
            $table->foreign('customer_id')->references('id')->on('customers')->nullOnDelete();
            $table->foreign('supplier_id')->references('id')->on('suppliers')->nullOnDelete();
            $table->foreign('sale_id')->references('id')->on('sales')->nullOnDelete();
            $table->foreign('purchase_order_id')->references('id')->on('purchase_orders')->nullOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();

            $table->unique(['business_id', 'debt_number']);
            $table->index(['business_id', 'status']);
            $table->index(['business_id', 'type']);
            $table->index(['business_id', 'due_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('debts');
    }
};
