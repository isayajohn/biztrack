<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('security_configs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->boolean('require_email_verification')->default(true);
            $table->boolean('enable_password_reset')->default(true);
            $table->boolean('enable_otp_login')->default(false);
            $table->boolean('enable_sms_otp')->default(false);
            $table->integer('password_min_length')->default(8);
            $table->boolean('password_require_number')->default(true);
            $table->boolean('password_require_special_char')->default(false);
            $table->integer('otp_expiry_minutes')->default(10);
            $table->integer('max_login_attempts')->default(5);
            $table->integer('lockout_minutes')->default(15);
            $table->integer('session_expiry_minutes')->default(1440);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('security_configs');
    }
};
