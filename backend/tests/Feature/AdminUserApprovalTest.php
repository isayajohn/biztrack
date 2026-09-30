<?php

namespace Tests\Feature;

use App\Models\SecurityConfig;
use App\Models\User;
use App\Services\EmailService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery\MockInterface;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class AdminUserApprovalTest extends TestCase
{
    use RefreshDatabase;

    public function test_verified_registration_waits_for_manual_approval_before_login(): void
    {
        SecurityConfig::create([
            'require_email_verification' => true,
            'require_admin_approval' => true,
        ]);

        $verificationToken = null;
        $this->mock(EmailService::class, function (MockInterface $mock) use (&$verificationToken) {
            $mock->shouldReceive('sendFromTemplate')->once()->withArgs(function (string $template, string $email, string $name, array $variables) use (&$verificationToken) {
                $verificationToken = $variables['token'] ?? null;
                return $template === 'EMAIL_VERIFICATION' && $email === 'pending@example.com';
            })->andReturn(true);
        });

        $registration = $this->postJson('/api/auth/register', [
            'name' => 'Pending User',
            'email' => 'pending@example.com',
            'password' => 'StrongPassword123!',
            'verificationMethod' => 'EMAIL',
            'onboardingIntent' => 'CREATE',
            'termsAccepted' => true,
            'termsVersion' => '2026.08',
            'privacyVersion' => '2026.08',
        ])->assertCreated()
            ->assertJsonPath('data.requiresApproval', true)
            ->assertJsonPath('data.approvalStatus', 'PENDING');

        $user = User::findOrFail($registration->json('data.user.id'));
        $this->assertSame('PENDING', $user->approval_status);

        $this->postJson('/api/auth/verify-email', ['token' => $verificationToken])
            ->assertOk()
            ->assertJsonPath('data.token', null)
            ->assertJsonPath('data.requiresApproval', true)
            ->assertJsonPath('data.approvalStatus', 'PENDING');

        $this->postJson('/api/auth/login', [
            'identifier' => 'pending@example.com',
            'password' => 'StrongPassword123!',
        ])->assertForbidden()->assertJsonPath('code', 'ACCOUNT_PENDING_APPROVAL');

        $admin = User::factory()->create([
            'role' => 'SUPER_ADMIN',
            'approval_status' => 'APPROVED',
            'approved_at' => now(),
        ]);
        $adminToken = JWTAuth::fromUser($admin);
        $this->withHeader('Authorization', 'Bearer '.$adminToken)
            ->patchJson('/api/admin/users/'.$user->id.'/approval', ['approvalStatus' => 'APPROVED'])
            ->assertOk()
            ->assertJsonPath('data.approvalStatus', 'APPROVED');

        $this->postJson('/api/auth/login', [
            'identifier' => 'pending@example.com',
            'password' => 'StrongPassword123!',
        ])->assertOk()->assertJsonStructure(['data' => ['token', 'user']]);
    }

    public function test_super_admin_can_manage_verification_lock_and_rejection(): void
    {
        $admin = User::factory()->create([
            'role' => 'SUPER_ADMIN',
            'approval_status' => 'APPROVED',
            'approved_at' => now(),
        ]);
        $user = User::factory()->unverified()->create([
            'approval_status' => 'PENDING',
            'failed_login_attempts' => 4,
            'locked_until' => now()->addHour(),
        ]);
        $token = JWTAuth::fromUser($admin);
        $headers = ['Authorization' => 'Bearer '.$token];

        $this->withHeaders($headers)
            ->patchJson('/api/admin/users/'.$user->id.'/verification', ['verified' => true])
            ->assertOk()
            ->assertJsonPath('data.emailVerifiedAt', fn ($value) => $value !== null);

        $this->withHeaders($headers)
            ->postJson('/api/admin/users/'.$user->id.'/unlock')
            ->assertOk()
            ->assertJsonPath('data.failedLoginAttempts', 0)
            ->assertJsonPath('data.lockedUntil', null);

        $this->withHeaders($headers)
            ->patchJson('/api/admin/users/'.$user->id.'/approval', [
                'approvalStatus' => 'REJECTED',
                'reason' => 'Registration details require review.',
            ])->assertOk()
            ->assertJsonPath('data.approvalStatus', 'REJECTED')
            ->assertJsonPath('data.rejectionReason', 'Registration details require review.');
    }
}
