<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('phone')->nullable();
            $table->string('password_hash');
            $table->enum('role', ['USER', 'SUPER_ADMIN'])->default('USER');
            $table->enum('status', ['ACTIVE', 'SUSPENDED'])->default('ACTIVE');
            $table->timestamp('email_verified_at')->nullable();
            $table->string('email_verification_token_hash')->nullable();
            $table->timestamp('email_verification_expires_at')->nullable();
            $table->string('password_reset_token_hash')->nullable();
            $table->timestamp('password_reset_expires_at')->nullable();
            $table->string('otp_code_hash')->nullable();
            $table->string('otp_login_token_hash')->nullable();
            $table->timestamp('otp_expires_at')->nullable();
            $table->integer('failed_login_attempts')->default(0);
            $table->timestamp('locked_until')->nullable();
            $table->timestamp('last_login_at')->nullable();
            $table->timestamps();

            $table->index('email');
            $table->index('phone');
            $table->index('role');
            $table->index('status');
            $table->index('email_verified_at');
            $table->index('locked_until');
            $table->index('email_verification_token_hash');
            $table->index('password_reset_token_hash');
            $table->index('otp_login_token_hash');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
