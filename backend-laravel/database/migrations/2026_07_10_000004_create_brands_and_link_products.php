<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('brands', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('business_id');
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->foreign('business_id')->references('id')->on('businesses')->cascadeOnDelete();
            $table->unique(['business_id', 'name']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->uuid('brand_id')->nullable()->after('brand');
            $table->foreign('brand_id')->references('id')->on('brands')->nullOnDelete();
            $table->index(['business_id', 'brand_id']);
        });

        $legacyBrands = DB::table('products')
            ->whereNotNull('brand')
            ->where('brand', '<>', '')
            ->select('business_id', 'brand')
            ->distinct()
            ->get();

        foreach ($legacyBrands as $legacy) {
            $id = (string) Str::uuid();
            DB::table('brands')->insert([
                'id' => $id,
                'business_id' => $legacy->business_id,
                'name' => $legacy->brand,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            DB::table('products')
                ->where('business_id', $legacy->business_id)
                ->where('brand', $legacy->brand)
                ->update(['brand_id' => $id]);
        }
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['brand_id']);
            $table->dropIndex(['business_id', 'brand_id']);
            $table->dropColumn('brand_id');
        });
        Schema::dropIfExists('brands');
    }
};
