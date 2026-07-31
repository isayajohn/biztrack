<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('packages', function (Blueprint $table) {
            $table->boolean('is_visible')->default(true)->after('status')->index();
        });

        // Start by showing only free packages. Administrators can expose any
        // paid package later from Package management.
        DB::table('packages')
            ->where('slug', '!=', 'free')
            ->where('price_monthly', '>', 0)
            ->update(['is_visible' => false]);
    }

    public function down(): void
    {
        Schema::table('packages', function (Blueprint $table) {
            $table->dropColumn('is_visible');
        });
    }
};
