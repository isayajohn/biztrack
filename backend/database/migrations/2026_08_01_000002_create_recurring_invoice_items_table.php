<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recurring_invoice_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('recurring_invoice_id');
            $table->uuid('product_id');
            $table->integer('quantity');
            $table->decimal('unit_price', 12, 2);
            $table->timestamps();

            $table->foreign('recurring_invoice_id')->references('id')->on('recurring_invoices')->cascadeOnDelete();
            $table->foreign('product_id')->references('id')->on('products')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recurring_invoice_items');
    }
};
