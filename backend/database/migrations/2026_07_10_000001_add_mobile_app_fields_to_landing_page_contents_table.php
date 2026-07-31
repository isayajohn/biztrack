<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('landing_page_contents', function (Blueprint $table) {
            $table->string('mobile_app_title')->nullable();
            $table->text('mobile_app_description')->nullable();
            $table->string('android_app_url')->nullable();
            $table->string('ios_app_url')->nullable();
            $table->string('apk_path')->nullable();
            $table->string('apk_file_name')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('landing_page_contents', function (Blueprint $table) {
            $table->dropColumn([
                'mobile_app_title', 'mobile_app_description', 'android_app_url',
                'ios_app_url', 'apk_path', 'apk_file_name',
            ]);
        });
    }
};
