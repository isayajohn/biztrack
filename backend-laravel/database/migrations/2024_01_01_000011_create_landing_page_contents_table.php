<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('landing_page_contents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('hero_title');
            $table->text('hero_subtitle');
            $table->string('primary_button_text');
            $table->string('primary_button_url');
            $table->string('secondary_button_text');
            $table->string('secondary_button_url');
            $table->json('features');
            $table->json('pricing');
            $table->json('faqs');
            $table->json('testimonials')->nullable();
            $table->json('footer_links')->nullable();
            $table->string('seo_title')->nullable();
            $table->text('seo_description')->nullable();
            $table->boolean('is_published')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('landing_page_contents');
    }
};
