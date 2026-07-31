<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('payment_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('business_id');
            $table->uuid('package_id');
            $table->uuid('subscription_id')->nullable();
            $table->enum('status', ['PENDING', 'PAID', 'FAILED', 'CANCELLED'])->default('PENDING');
            $table->enum('billing_cycle', ['MONTHLY', 'YEARLY', 'LIFETIME', 'MANUAL'])->default('MONTHLY');
            $table->decimal('amount', 12, 2);
            $table->string('currency');
            $table->string('provider')->default('AZAMPAY');
            $table->string('external_id')->unique();
            $table->string('provider_reference')->nullable();
            $table->string('checkout_url')->nullable();
            $table->json('raw_request')->nullable();
            $table->json('raw_response')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->timestamps();

            $table->foreign('business_id')->references('id')->on('businesses')->onDelete('cascade');
            $table->foreign('package_id')->references('id')->on('packages')->onDelete('restrict');
            $table->index('business_id');
            $table->index('package_id');
            $table->index('status');
            $table->index('provider_reference');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_transactions');
    }
};
