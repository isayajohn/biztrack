<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->string('receipt_number')->nullable()->after('id');
            $table->string('customer_name')->nullable()->after('receipt_number');
            $table->decimal('discount', 12, 2)->default(0)->after('total_amount');
            $table->decimal('paid_amount', 12, 2)->default(0)->after('discount');
            $table->uuid('created_by')->nullable();
        });

        Schema::create('sale_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('sale_id');
            $table->uuid('product_id')->nullable();
            $table->string('product_name');
            $table->integer('quantity');
            $table->decimal('buying_price', 12, 2)->default(0);
            $table->decimal('selling_price', 12, 2);
            $table->decimal('discount', 12, 2)->default(0);
            $table->decimal('profit', 12, 2)->default(0);
            $table->decimal('total', 12, 2);
            $table->timestamps();

            $table->foreign('sale_id')->references('id')->on('sales')->onDelete('cascade');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sale_items');

        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn(['receipt_number', 'customer_name', 'discount', 'paid_amount', 'created_by']);
        });
    }
};
