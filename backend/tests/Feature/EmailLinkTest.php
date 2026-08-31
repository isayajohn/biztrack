<?php

namespace Tests\Feature;

use App\Models\SecurityConfig;
use App\Models\User;
use App\Services\EmailService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery\MockInterface;
use Tests\TestCase;

class EmailLinkTest extends TestCase
{
    use RefreshDatabase;

    public function test_password_reset_email_uses_the_configured_frontend_domain(): void
    {
        config(['app.frontend_url' => 'https://biztrack.example/']);

        User::factory()->create(['email' => 'owner@example.com']);

        $this->mock(EmailService::class, function (MockInterface $mock) {
            $mock->shouldReceive('sendFromTemplate')
                ->once()
                ->withArgs(function (string $template, string $email, string $name, array $variables) {
                    return $template === 'PASSWORD_RESET'
                        && $email === 'owner@example.com'
                        && str_starts_with($variables['resetUrl'], 'https://biztrack.example/reset-password?token=')
                        && ! str_contains($variables['resetUrl'], '127.0.0.1');
                })->andReturn(true);
        });

        $this->postJson('/api/auth/forgot-password', [
            'email' => 'owner@example.com',
        ])->assertOk();
    }

    public function test_verification_email_uses_the_configured_frontend_domain(): void
    {
        config(['app.frontend_url' => 'https://biztrack.example/']);
        SecurityConfig::create(['require_email_verification' => true]);

        $this->mock(EmailService::class, function (MockInterface $mock) {
            $mock->shouldReceive('sendFromTemplate')
                ->once()
                ->withArgs(function (string $template, string $email, string $name, array $variables) {
                    return $template === 'EMAIL_VERIFICATION'
                        && $email === 'new-owner@example.com'
                        && str_starts_with($variables['verifyUrl'], 'https://biztrack.example/verify-email?token=')
                        && ! str_contains($variables['verifyUrl'], '127.0.0.1');
                })->andReturn(true);
        });

        $this->postJson('/api/auth/register', [
            'name' => 'New Owner',
            'email' => 'new-owner@example.com',
            'password' => 'StrongPassword123!',
            'verificationMethod' => 'EMAIL',
            'onboardingIntent' => 'CREATE',
            'termsAccepted' => true,
            'termsVersion' => '2026.08',
            'privacyVersion' => '2026.08',
        ])->assertCreated();
    }
}
