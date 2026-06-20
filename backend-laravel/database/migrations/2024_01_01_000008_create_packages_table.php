<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('packages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->decimal('price_monthly', 12, 2);
            $table->decimal('price_yearly', 12, 2)->nullable();
            $table->string('currency');
            $table->integer('trial_days')->default(0);
            $table->integer('max_businesses');
            $table->integer('max_users');
            $table->integer('max_products');
            $table->integer('max_sales_per_month');
            $table->integer('max_expenses_per_month');
            $table->boolean('allow_reports');
            $table->boolean('allow_pdf_export');
            $table->boolean('allow_csv_export');
            $table->boolean('allow_inventory_alerts');
            $table->boolean('allow_ai_insights');
            $table->enum('status', ['ACTIVE', 'INACTIVE'])->default('ACTIVE');
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('packages');
    }
};
