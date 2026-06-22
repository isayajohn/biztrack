<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('landing_page_contents', function (Blueprint $table) {
            $table->string('hero_kicker')->nullable()->after('hero_subtitle');
            $table->text('hero_trust_text')->nullable()->after('secondary_button_url');
            $table->longText('hero_image_url')->nullable()->after('hero_trust_text');
            $table->string('features_eyebrow')->nullable()->after('hero_image_url');
            $table->string('features_title')->nullable()->after('features_eyebrow');
            $table->text('features_description')->nullable()->after('features_title');
            $table->string('pricing_eyebrow')->nullable()->after('features_description');
            $table->string('pricing_title')->nullable()->after('pricing_eyebrow');
            $table->text('pricing_description')->nullable()->after('pricing_title');
            $table->string('testimonials_eyebrow')->nullable()->after('pricing_description');
            $table->string('testimonials_title')->nullable()->after('testimonials_eyebrow');
            $table->text('testimonials_description')->nullable()->after('testimonials_title');
            $table->string('faq_eyebrow')->nullable()->after('testimonials_description');
            $table->string('faq_title')->nullable()->after('faq_eyebrow');
            $table->text('faq_description')->nullable()->after('faq_title');
            $table->string('final_cta_kicker')->nullable()->after('faq_description');
            $table->string('final_cta_title')->nullable()->after('final_cta_kicker');
            $table->text('final_cta_description')->nullable()->after('final_cta_title');
        });
    }

    public function down(): void
    {
        Schema::table('landing_page_contents', function (Blueprint $table) {
            $table->dropColumn([
                'hero_kicker',
                'hero_trust_text',
                'hero_image_url',
                'features_eyebrow',
                'features_title',
                'features_description',
                'pricing_eyebrow',
                'pricing_title',
                'pricing_description',
                'testimonials_eyebrow',
                'testimonials_title',
                'testimonials_description',
                'faq_eyebrow',
                'faq_title',
                'faq_description',
                'final_cta_kicker',
                'final_cta_title',
                'final_cta_description',
            ]);
        });
    }
};
