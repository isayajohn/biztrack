<?php

namespace Database\Seeders;

use App\Models\SecurityConfig;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        $email = 'admin@biztrack.com';
        $password = 'Admin@1234';

        $existing = User::where('email', $email)->first();
        if (!$existing) {
            User::create([
                'id' => Str::uuid(),
                'name' => 'Super Admin',
                'email' => $email,
                'password_hash' => Hash::make($password),
                'role' => 'SUPER_ADMIN',
                'status' => 'ACTIVE',
                'email_verified_at' => now(),
            ]);
            $this->command->info("Super admin created: $email / $password");
        } else {
            $this->command->info("Super admin already exists: $email");
        }

        // Seed default security config
        if (!SecurityConfig::first()) {
            SecurityConfig::create([
                'id' => Str::uuid(),
                'require_email_verification' => false,
                'enable_password_reset' => true,
                'enable_otp_login' => false,
                'enable_sms_otp' => false,
                'password_min_length' => 8,
                'password_require_number' => true,
                'password_require_special_char' => false,
                'otp_expiry_minutes' => 10,
                'max_login_attempts' => 5,
                'lockout_minutes' => 15,
                'session_expiry_minutes' => 1440,
            ]);
            $this->command->info('Default security config created.');
        }
    }
}
