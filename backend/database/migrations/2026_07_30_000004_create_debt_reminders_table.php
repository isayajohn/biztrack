<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('debt_reminders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('business_id');
            $table->uuid('debt_id');
            $table->enum('channel', ['SMS', 'WHATSAPP', 'EMAIL', 'IN_APP']);
            $table->enum('trigger_type', ['BEFORE_DUE', 'ON_DUE', 'AFTER_DUE_RECURRING', 'MANUAL']);
            $table->dateTime('scheduled_for');
            $table->enum('status', ['PENDING', 'SENT', 'FAILED', 'CANCELLED'])->default('PENDING');
            $table->timestamp('sent_at')->nullable();
            $table->text('failure_reason')->nullable();
            $table->text('message_snapshot')->nullable();
            $table->uuid('created_by')->nullable();
            $table->timestamps();

            $table->foreign('business_id')->references('id')->on('businesses')->cascadeOnDelete();
            $table->foreign('debt_id')->references('id')->on('debts')->cascadeOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();

            $table->index(['business_id', 'status']);
            $table->index(['debt_id']);
            $table->index(['scheduled_for']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('debt_reminders');
    }
};
