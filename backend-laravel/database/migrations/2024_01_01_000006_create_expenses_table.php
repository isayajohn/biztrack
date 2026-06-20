<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('expenses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('business_id');
            $table->enum('category', ['STOCK_PURCHASE', 'RENT', 'TRANSPORT', 'SALARY', 'ELECTRICITY', 'INTERNET', 'FOOD', 'MARKETING', 'OTHER']);
            $table->string('description');
            $table->decimal('amount', 12, 2);
            $table->enum('payment_method', ['CASH', 'MOBILE_MONEY', 'BANK', 'CREDIT']);
            $table->date('expense_date');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('business_id')->references('id')->on('businesses')->onDelete('cascade');
            $table->index('business_id');
            $table->index(['business_id', 'expense_date']);
            $table->index(['business_id', 'category']);
            $table->index(['business_id', 'payment_method']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
