<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->string('tax_name')->default('VAT')->after('country');
            $table->string('tax_number')->nullable()->after('tax_name');
            $table->decimal('default_tax_rate', 5, 2)->default(0)->after('tax_number');
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->decimal('tax_rate', 5, 2)->default(0)->after('discount');
            $table->decimal('tax_amount', 12, 2)->default(0)->after('tax_rate');
        });
    }

    public function down(): void
    {
        Schema::table('sales', fn (Blueprint $table) => $table->dropColumn(['tax_rate', 'tax_amount']));
        Schema::table('businesses', fn (Blueprint $table) => $table->dropColumn(['tax_name', 'tax_number', 'default_tax_rate']));
    }
};
