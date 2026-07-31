<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('landing_page_contents', function (Blueprint $table) {
            $table->json('problem_section')->nullable()->after('hero_image_url');
            $table->json('solution_section')->nullable()->after('problem_section');
            $table->json('how_it_works')->nullable()->after('solution_section');
        });
    }

    public function down(): void
    {
        Schema::table('landing_page_contents', function (Blueprint $table) {
            $table->dropColumn(['problem_section', 'solution_section', 'how_it_works']);
        });
    }
};
