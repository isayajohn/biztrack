<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_adjustments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('business_id');
            $table->uuid('product_id');
            $table->integer('system_stock');
            $table->integer('physical_count');
            $table->integer('difference');
            $table->enum('adjustment_type', ['ADD', 'REDUCE', 'SET']);
            $table->text('reason')->nullable();
            $table->enum('status', ['PENDING', 'APPROVED', 'REJECTED'])->default('PENDING');
            $table->uuid('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->uuid('created_by')->nullable();
            $table->timestamps();

            $table->foreign('business_id')->references('id')->on('businesses')->onDelete('cascade');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
            $table->index('business_id');
            $table->index(['business_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_adjustments');
    }
};
