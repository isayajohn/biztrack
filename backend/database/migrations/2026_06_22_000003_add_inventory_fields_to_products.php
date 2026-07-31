<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('barcode')->nullable()->after('sku');
            $table->string('brand')->nullable()->after('barcode');
            $table->enum('unit_type', ['pcs', 'box', 'kg', 'litre', 'pack', 'dozen'])->default('pcs')->after('brand');
            $table->uuid('category_id')->nullable()->after('unit_type');
            $table->uuid('supplier_id')->nullable()->after('category_id');
            $table->integer('reorder_point')->default(0)->after('low_stock_level');
            $table->date('expiry_date')->nullable()->after('reorder_point');
            $table->string('image_url')->nullable();
            $table->text('notes')->nullable();

            $table->foreign('category_id')->references('id')->on('categories')->onDelete('set null');
            $table->foreign('supplier_id')->references('id')->on('suppliers')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
            $table->dropForeign(['supplier_id']);
            $table->dropColumn(['barcode', 'brand', 'unit_type', 'category_id', 'supplier_id', 'reorder_point', 'expiry_date', 'image_url', 'notes']);
        });
    }
};
