<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('approval_status', 20)->default('APPROVED')->after('status')->index();
            $table->timestamp('approved_at')->nullable()->after('approval_status');
            $table->uuid('approved_by')->nullable()->after('approved_at')->index();
            $table->timestamp('rejected_at')->nullable()->after('approved_by');
            $table->uuid('rejected_by')->nullable()->after('rejected_at')->index();
            $table->text('rejection_reason')->nullable()->after('rejected_by');
        });

        Schema::table('security_configs', function (Blueprint $table) {
            $table->boolean('require_admin_approval')->default(false)->after('require_email_verification');
        });
    }

    public function down(): void
    {
        Schema::table('security_configs', function (Blueprint $table) {
            $table->dropColumn('require_admin_approval');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'approval_status',
                'approved_at',
                'approved_by',
                'rejected_at',
                'rejected_by',
                'rejection_reason',
            ]);
        });
    }
};
