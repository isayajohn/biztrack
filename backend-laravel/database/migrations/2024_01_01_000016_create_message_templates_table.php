<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('message_templates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->enum('type', ['EMAIL', 'SMS']);
            $table->enum('key', ['EMAIL_VERIFICATION', 'PASSWORD_RESET', 'LOGIN_ALERT', 'OTP_CODE', 'ACCOUNT_SUSPENDED', 'SUBSCRIPTION_ACTIVATED', 'SUBSCRIPTION_EXPIRED']);
            $table->string('subject')->nullable();
            $table->text('body');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('key');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('message_templates');
    }
};
