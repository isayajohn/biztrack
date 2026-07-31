<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('debt_reminder_templates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('business_id');
            $table->enum('channel', ['SMS', 'WHATSAPP', 'EMAIL', 'IN_APP']);
            $table->enum('trigger_type', ['BEFORE_DUE', 'ON_DUE', 'AFTER_DUE_RECURRING']);
            $table->string('subject')->nullable();
            $table->text('body')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('business_id')->references('id')->on('businesses')->cascadeOnDelete();
            $table->unique(['business_id', 'channel', 'trigger_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('debt_reminder_templates');
    }
};
