<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recurring_invoices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('business_id');
            $table->uuid('branch_id')->nullable();
            $table->uuid('customer_id');
            $table->enum('frequency', ['WEEKLY', 'MONTHLY', 'QUARTERLY']);
            $table->date('start_date');
            $table->date('next_run_date');
            $table->date('last_run_date')->nullable();
            $table->date('end_date')->nullable();
            $table->enum('payment_method', ['CASH', 'MOBILE_MONEY', 'BANK', 'CREDIT']);
            $table->decimal('discount', 12, 2)->default(0);
            $table->decimal('tax_rate', 5, 2)->nullable();
            $table->text('notes')->nullable();
            $table->enum('status', ['ACTIVE', 'PAUSED'])->default('ACTIVE');
            $table->unsignedInteger('generated_count')->default(0);
            $table->uuid('created_by')->nullable();
            $table->timestamps();

            $table->foreign('business_id')->references('id')->on('businesses')->cascadeOnDelete();
            $table->foreign('branch_id')->references('id')->on('branches')->nullOnDelete();
            $table->foreign('customer_id')->references('id')->on('customers')->cascadeOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();

            $table->index(['business_id', 'status']);
            $table->index(['status', 'next_run_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recurring_invoices');
    }
};
