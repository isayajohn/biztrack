<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->decimal('initial_paid_amount', 12, 2)->default(0)->after('paid_amount');
        });
        DB::table('sales')->update(['initial_paid_amount' => DB::raw('paid_amount')]);
    }

    public function down(): void
    {
        Schema::table('sales', fn (Blueprint $table) => $table->dropColumn('initial_paid_amount'));
    }
};
