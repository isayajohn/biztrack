<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('business_id');
            $table->string('name');
            $table->string('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->foreign('business_id')->references('id')->on('businesses')->onDelete('cascade');
            $table->index('business_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};
