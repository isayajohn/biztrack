<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('business_id');
            $table->uuid('user_id');
            $table->string('title');
            $table->text('message');
            $table->enum('type', ['LOW_STOCK', 'OUT_OF_STOCK', 'EXPIRY', 'PURCHASE', 'ADJUSTMENT', 'DAMAGED', 'GENERAL'])->default('GENERAL');
            $table->uuid('reference_id')->nullable();
            $table->boolean('is_read')->default(false);
            $table->timestamps();

            $table->foreign('business_id')->references('id')->on('businesses')->onDelete('cascade');
            $table->index(['business_id', 'is_read']);
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_notifications');
    }
};
