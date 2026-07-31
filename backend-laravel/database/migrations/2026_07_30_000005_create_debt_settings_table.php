<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('debt_settings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('business_id')->unique();
            $table->boolean('allow_overpayments')->default(false);
            $table->json('remind_days_before')->nullable();
            $table->boolean('remind_on_due_date')->default(true);
            $table->unsignedInteger('remind_after_due_repeat_days')->default(7);
            $table->unsignedInteger('remind_after_due_max_times')->default(3);
            $table->json('enabled_channels')->nullable();
            $table->timestamps();

            $table->foreign('business_id')->references('id')->on('businesses')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('debt_settings');
    }
};
