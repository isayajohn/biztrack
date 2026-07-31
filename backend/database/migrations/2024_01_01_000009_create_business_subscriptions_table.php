<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('business_subscriptions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('business_id');
            $table->uuid('package_id');
            $table->enum('status', ['TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED', 'EXPIRED'])->default('ACTIVE');
            $table->enum('billing_cycle', ['MONTHLY', 'YEARLY', 'LIFETIME', 'MANUAL'])->default('MONTHLY');
            $table->timestamp('starts_at');
            $table->timestamp('ends_at')->nullable();
            $table->timestamp('trial_ends_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('business_id')->references('id')->on('businesses')->onDelete('cascade');
            $table->foreign('package_id')->references('id')->on('packages')->onDelete('restrict');
            $table->index('business_id');
            $table->index('package_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('business_subscriptions');
    }
};
