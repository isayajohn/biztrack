<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('sales', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('business_id');
            $table->uuid('product_id')->nullable();
            $table->integer('quantity');
            $table->decimal('unit_price', 12, 2);
            $table->decimal('total_amount', 12, 2);
            $table->enum('payment_method', ['CASH', 'MOBILE_MONEY', 'BANK', 'CREDIT']);
            $table->date('sale_date');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('business_id')->references('id')->on('businesses')->onDelete('cascade');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('set null');
            $table->index('business_id');
            $table->index(['business_id', 'sale_date']);
            $table->index(['business_id', 'payment_method']);
            $table->index('product_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};
