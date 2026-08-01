<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Business;
use App\Models\BusinessInvitation;
use App\Models\BusinessMembership;
use App\Models\User;
use App\Services\EmailService;
use App\Services\SmsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Mockery\MockInterface;
use Tests\TestCase;

class RegistrationVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_registration_requires_email_activation_and_creates_default_membership(): void
    {
        $this->mock(EmailService::class, function (MockInterface $mock) {
            $mock->shouldReceive('sendFromTemplate')->once()->withArgs(
                fn (string $template, string $email, string $name, array $variables) =>
                    $template === 'EMAIL_VERIFICATION' && $email === 'owner@example.com' && isset($variables['verifyUrl'])
            )->andReturn(true);
        });

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Business Owner',
            'email' => 'owner@example.com',
            'password' => 'StrongPassword123!',
            'businessName' => 'Owner Shop',
            'currency' => 'TZS',
            'verificationMethod' => 'EMAIL',
        ])->assertCreated()
            ->assertJsonPath('data.requiresVerification', true)
            ->assertJsonPath('data.verificationMethod', 'EMAIL')
            ->assertJsonPath('data.token', null);

        $userId = $response->json('data.user.id');
        $business = Business::where('user_id', $userId)->firstOrFail();
        $this->assertDatabaseHas('branches', ['business_id' => $business->id, 'code' => 'MAIN', 'is_default' => true]);
        $this->assertDatabaseHas('business_memberships', ['business_id' => $business->id, 'user_id' => $userId, 'role' => 'OWNER']);

        $this->postJson('/api/auth/login', ['email' => 'owner@example.com', 'password' => 'StrongPassword123!'])
            ->assertForbidden()
            ->assertJsonPath('code', 'EMAIL_NOT_VERIFIED');

        $user = User::findOrFail($userId);
        $user->update(['otp_code_hash' => Hash::make('123456'), 'otp_expires_at' => now()->addMinutes(10)]);
        $this->postJson('/api/auth/verify-login-otp', ['email' => 'owner@example.com', 'otp' => '123456'])
            ->assertForbidden()
            ->assertJsonPath('error', 'Account verification required');
    }

    public function test_phone_registration_sends_and_verifies_sms_otp(): void
    {
        $sentCode = null;
        $this->mock(SmsService::class, function (MockInterface $mock) use (&$sentCode) {
            $mock->shouldReceive('sendFromTemplate')->once()->withArgs(function (string $template, string $phone, array $variables) use (&$sentCode) {
                $sentCode = $variables['code'] ?? null;
                return $template === 'OTP_CODE' && $phone === '+255712345678' && preg_match('/^\d{6}$/', (string) $sentCode);
            })->andReturn(true);
        });

        $this->postJson('/api/auth/register', [
            'name' => 'Phone User',
            'email' => 'phone@example.com',
            'phone' => '+255 712 345 678',
            'password' => 'StrongPassword123!',
            'businessName' => 'Phone Shop',
            'verificationMethod' => 'PHONE',
        ])->assertCreated()
            ->assertJsonPath('data.verificationMethod', 'PHONE')
            ->assertJsonPath('data.verificationOtpSent', true)
            ->assertJsonPath('data.token', null);

        $this->assertSame('+255712345678', User::where('email', 'phone@example.com')->value('phone'));

        $this->postJson('/api/auth/login', ['email' => 'phone@example.com', 'password' => 'StrongPassword123!'])
            ->assertForbidden()
            ->assertJsonPath('code', 'PHONE_NOT_VERIFIED');

        $this->postJson('/api/auth/verify-phone', ['email' => 'phone@example.com', 'otp' => $sentCode])
            ->assertOk()
            ->assertJsonStructure(['data' => ['token', 'user']]);

        $this->assertNotNull(User::where('email', 'phone@example.com')->firstOrFail()->phone_verified_at);
    }

    public function test_invitation_code_joins_the_existing_business_and_is_single_use(): void
    {
        $owner = User::factory()->create();
        $business = Business::factory()->create(['user_id' => $owner->id, 'name' => 'Inviting Company']);
        $branch = Branch::create(['business_id' => $business->id, 'name' => 'Main Branch', 'code' => 'MAIN', 'is_default' => true, 'is_active' => true]);
        $plainCode = 'BIZ-TEST-2026';
        $invitation = BusinessInvitation::create([
            'business_id' => $business->id,
            'branch_id' => $branch->id,
            'created_by' => $owner->id,
            'email' => 'invitee@example.com',
            'code_hash' => BusinessInvitation::hashCode($plainCode),
            'code_prefix' => 'BIZ-TEST…',
            'role' => 'CASHIER',
            'permissions' => ['dashboard.view', 'sales.view'],
            'status' => 'ACTIVE',
            'expires_at' => now()->addWeek(),
        ]);

        $this->mock(EmailService::class, fn (MockInterface $mock) => $mock->shouldReceive('sendFromTemplate')->once()->andReturn(true));

        $this->postJson('/api/auth/invitations/validate', ['code' => $plainCode])
            ->assertOk()
            ->assertJsonPath('data.businessName', 'Inviting Company')
            ->assertJsonPath('data.role', 'CASHIER');

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Invited User',
            'email' => 'invitee@example.com',
            'password' => 'StrongPassword123!',
            'invitationCode' => $plainCode,
            'verificationMethod' => 'EMAIL',
        ])->assertCreated();

        $userId = $response->json('data.user.id');
        $this->assertDatabaseHas('business_memberships', [
            'business_id' => $business->id,
            'user_id' => $userId,
            'branch_id' => $branch->id,
            'role' => 'CASHIER',
        ]);
        $this->assertSame('ACCEPTED', $invitation->fresh()->status);
        $this->assertSame($userId, $invitation->fresh()->accepted_by);

        $this->postJson('/api/auth/invitations/validate', ['code' => $plainCode])->assertUnprocessable();
    }
}
