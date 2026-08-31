<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LegalDocumentTest extends TestCase
{
    use RefreshDatabase;

    public function test_published_terms_and_privacy_policy_are_available_publicly(): void
    {
        $this->getJson('/api/public/legal-documents')
            ->assertOk()
            ->assertJsonPath('data.terms.type', 'TERMS')
            ->assertJsonPath('data.terms.version', '2026.08')
            ->assertJsonPath('data.privacy.type', 'PRIVACY')
            ->assertJsonPath('data.privacy.version', '2026.08')
            ->assertJsonStructure([
                'data' => [
                    'terms' => ['title', 'effectiveDate', 'summary', 'sections'],
                    'privacy' => ['title', 'effectiveDate', 'summary', 'sections'],
                ],
            ]);
    }

    public function test_registration_rejects_stale_legal_document_versions(): void
    {
        $this->postJson('/api/auth/register', [
            'name' => 'Stale Consent User',
            'email' => 'stale-consent@example.com',
            'password' => 'StrongPassword123!',
            'verificationMethod' => 'EMAIL',
            'onboardingIntent' => 'CREATE',
            'termsAccepted' => true,
            'termsVersion' => 'old-version',
            'privacyVersion' => '2026.08',
        ])->assertUnprocessable()->assertJsonStructure(['details' => ['termsAccepted']]);

        $this->assertDatabaseMissing('users', ['email' => 'stale-consent@example.com']);
    }
}
