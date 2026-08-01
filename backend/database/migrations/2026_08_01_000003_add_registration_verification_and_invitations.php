<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('phone_verified_at')->nullable()->after('email_verified_at');
            $table->enum('registration_verification_method', ['EMAIL', 'PHONE'])->nullable()->after('phone_verified_at');
            $table->index('phone_verified_at');
        });

        Schema::create('business_invitations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('business_id');
            $table->uuid('branch_id')->nullable();
            $table->uuid('created_by')->nullable();
            $table->uuid('accepted_by')->nullable();
            $table->string('email')->nullable();
            $table->string('code_hash', 64)->unique();
            $table->string('code_prefix', 12);
            $table->enum('role', ['MANAGER', 'CASHIER', 'INVENTORY', 'ACCOUNTANT', 'CUSTOM'])->default('CUSTOM');
            $table->json('permissions')->nullable();
            $table->enum('status', ['ACTIVE', 'REVOKED', 'ACCEPTED'])->default('ACTIVE');
            $table->timestamp('expires_at');
            $table->timestamp('accepted_at')->nullable();
            $table->timestamps();

            $table->foreign('business_id')->references('id')->on('businesses')->cascadeOnDelete();
            $table->foreign('branch_id')->references('id')->on('branches')->nullOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('accepted_by')->references('id')->on('users')->nullOnDelete();
            $table->index(['business_id', 'status']);
            $table->index(['status', 'expires_at']);
            $table->index('email');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('business_invitations');

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['phone_verified_at']);
            $table->dropColumn(['phone_verified_at', 'registration_verification_method']);
        });
    }
};
