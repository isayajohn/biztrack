<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Business;
use App\Models\BusinessInvitation;
use App\Models\BusinessMembership;
use App\Models\Package;
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

    public function test_owner_registration_verifies_before_creating_free_workspace(): void
    {
        $verificationToken = null;
        $this->mock(EmailService::class, function (MockInterface $mock) use (&$verificationToken) {
            $mock->shouldReceive('sendFromTemplate')->once()->withArgs(function (string $template, string $email, string $name, array $variables) use (&$verificationToken) {
                $verificationToken = $variables['token'] ?? null;
                return $template === 'EMAIL_VERIFICATION' && $email === 'owner@example.com' && isset($variables['verifyUrl']);
            })->andReturn(true);
        });
        $freePackage = $this->createFreePackage();

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Business Owner',
            'email' => 'owner@example.com',
            'password' => 'StrongPassword123!',
            'verificationMethod' => 'EMAIL',
            'onboardingIntent' => 'CREATE',
            'termsAccepted' => true,
            'termsVersion' => '2026.08',
            'privacyVersion' => '2026.08',
        ])->assertCreated()
            ->assertJsonPath('data.requiresVerification', true)
            ->assertJsonPath('data.verificationMethod', 'EMAIL')
            ->assertJsonPath('data.token', null);

        $userId = $response->json('data.user.id');
        $registeredUser = User::findOrFail($userId);
        $this->assertNotNull($registeredUser->terms_accepted_at);
        $this->assertNotNull($registeredUser->privacy_accepted_at);
        $this->assertSame('2026.08', $registeredUser->terms_accepted_version);
        $this->assertSame('2026.08', $registeredUser->privacy_accepted_version);
        $this->assertDatabaseMissing('businesses', ['user_id' => $userId]);
        $this->assertDatabaseMissing('business_memberships', ['user_id' => $userId]);

        $this->postJson('/api/auth/login', ['email' => 'owner@example.com', 'password' => 'StrongPassword123!'])
            ->assertForbidden()
            ->assertJsonPath('code', 'EMAIL_NOT_VERIFIED');

        $verify = $this->postJson('/api/auth/verify-email', ['token' => $verificationToken])
            ->assertOk()
            ->assertJsonPath('data.user.requiresOnboarding', true);
        $jwt = $verify->json('data.token');

        $workspace = $this->withHeader('Authorization', 'Bearer '.$jwt)->postJson('/api/business/onboarding', [
            'name' => 'Owner Shop',
            'currency' => 'TZS',
            'country' => 'Tanzania',
        ])->assertCreated()->assertJsonPath('data.subscription.package.id', $freePackage->id);

        $businessId = $workspace->json('data.id');
        $this->assertDatabaseHas('branches', ['business_id' => $businessId, 'code' => 'MAIN', 'is_default' => true]);
        $this->assertDatabaseHas('business_memberships', ['business_id' => $businessId, 'user_id' => $userId, 'role' => 'OWNER']);
        $this->assertDatabaseHas('business_subscriptions', ['business_id' => $businessId, 'package_id' => $freePackage->id, 'status' => 'ACTIVE']);
    }

    public function test_registration_requires_terms_and_privacy_consent(): void
    {
        $this->postJson('/api/auth/register', [
            'name' => 'No Consent User',
            'email' => 'no-consent@example.com',
            'password' => 'StrongPassword123!',
            'verificationMethod' => 'EMAIL',
            'onboardingIntent' => 'CREATE',
            'termsAccepted' => false,
            'termsVersion' => '2026.08',
            'privacyVersion' => '2026.08',
        ])->assertUnprocessable()->assertJsonStructure(['details' => ['termsAccepted']]);

        $this->assertDatabaseMissing('users', ['email' => 'no-consent@example.com']);
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
            'phone' => '+255 712 345 678',
            'password' => 'StrongPassword123!',
            'verificationMethod' => 'PHONE',
            'onboardingIntent' => 'CREATE',
            'termsAccepted' => true,
            'termsVersion' => '2026.08',
            'privacyVersion' => '2026.08',
        ])->assertCreated()
            ->assertJsonPath('data.verificationMethod', 'PHONE')
            ->assertJsonPath('data.verificationOtpSent', true)
            ->assertJsonPath('data.token', null);

        $user = User::where('phone', '+255712345678')->firstOrFail();
        $this->assertNull($user->email);

        $this->postJson('/api/auth/login', ['identifier' => '0712345678', 'password' => 'StrongPassword123!'])
            ->assertForbidden()
            ->assertJsonPath('code', 'PHONE_NOT_VERIFIED');

        $this->postJson('/api/auth/verify-phone', ['verificationId' => $user->id, 'otp' => $sentCode])
            ->assertOk()
            ->assertJsonStructure(['data' => ['token', 'user']])
            ->assertJsonPath('data.user.onboardingIntent', 'CREATE');

        $this->assertNotNull($user->fresh()->phone_verified_at);
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

        $verificationToken = null;
        $this->mock(EmailService::class, function (MockInterface $mock) use (&$verificationToken) {
            $mock->shouldReceive('sendFromTemplate')->once()->withArgs(function (string $template, string $email, string $name, array $variables) use (&$verificationToken) {
                $verificationToken = $variables['token'] ?? null;
                return true;
            })->andReturn(true);
        });

        $this->postJson('/api/auth/invitations/validate', ['code' => $plainCode])
            ->assertOk()
            ->assertJsonPath('data.businessName', 'Inviting Company')
            ->assertJsonPath('data.role', 'CASHIER');

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Invited User',
            'email' => 'invitee@example.com',
            'password' => 'StrongPassword123!',
            'verificationMethod' => 'EMAIL',
            'onboardingIntent' => 'JOIN',
            'termsAccepted' => true,
            'termsVersion' => '2026.08',
            'privacyVersion' => '2026.08',
        ])->assertCreated();

        $userId = $response->json('data.user.id');
        $this->assertDatabaseMissing('business_memberships', ['user_id' => $userId]);
        $this->assertSame('ACTIVE', $invitation->fresh()->status);

        $verify = $this->postJson('/api/auth/verify-email', ['token' => $verificationToken])->assertOk();
        $this->withHeader('Authorization', 'Bearer '.$verify->json('data.token'))
            ->postJson('/api/invitations/accept', ['code' => $plainCode])
            ->assertOk()
            ->assertJsonPath('data.business.name', 'Inviting Company');

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

    private function createFreePackage(): Package
    {
        return Package::create([
            'name' => 'Free',
            'slug' => 'free',
            'price_monthly' => 0,
            'currency' => 'TZS',
            'trial_days' => 0,
            'max_businesses' => 1,
            'max_users' => 1,
            'max_products' => 100,
            'max_sales_per_month' => 100,
            'max_expenses_per_month' => 100,
            'allow_reports' => true,
            'allow_pdf_export' => false,
            'allow_csv_export' => false,
            'allow_inventory_alerts' => true,
            'allow_ai_insights' => false,
            'status' => 'ACTIVE',
            'sort_order' => 0,
        ]);
    }
}
