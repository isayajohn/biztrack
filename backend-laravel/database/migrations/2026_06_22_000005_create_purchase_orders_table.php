<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('business_id');
            $table->uuid('supplier_id')->nullable();
            $table->string('order_number')->unique();
            $table->decimal('total_amount', 12, 2)->default(0);
            $table->decimal('paid_amount', 12, 2)->default(0);
            $table->enum('status', ['PENDING', 'ORDERED', 'PARTIAL', 'RECEIVED', 'CANCELLED'])->default('PENDING');
            $table->date('expected_date')->nullable();
            $table->date('received_date')->nullable();
            $table->text('notes')->nullable();
            $table->uuid('created_by')->nullable();
            $table->timestamps();

            $table->foreign('business_id')->references('id')->on('businesses')->onDelete('cascade');
            $table->foreign('supplier_id')->references('id')->on('suppliers')->onDelete('set null');
            $table->index('business_id');
            $table->index(['business_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_orders');
    }
};
