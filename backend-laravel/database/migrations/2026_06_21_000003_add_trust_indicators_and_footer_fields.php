<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('landing_page_contents', function (Blueprint $table) {
            $table->json('hero_trust_indicators')->nullable()->after('hero_trust_text');
            $table->text('footer_tagline')->nullable()->after('footer_links');
            $table->string('footer_badge')->nullable()->after('footer_tagline');
            $table->json('footer_product_links')->nullable()->after('footer_badge');
            $table->json('footer_company_links')->nullable()->after('footer_product_links');
        });
    }

    public function down(): void
    {
        Schema::table('landing_page_contents', function (Blueprint $table) {
            $table->dropColumn([
                'hero_trust_indicators',
                'footer_tagline',
                'footer_badge',
                'footer_product_links',
                'footer_company_links',
            ]);
        });
    }
};
