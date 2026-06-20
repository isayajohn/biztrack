<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('app_brandings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->longText('logo_data_url')->nullable();
            $table->string('logo_file_name')->nullable();
            $table->string('logo_mime_type')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('app_brandings');
    }
};
