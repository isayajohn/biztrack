<?php

namespace Tests\Feature;

use App\Models\SmsConfig;
use App\Services\EncryptionService;
use App\Services\SmsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SmsServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_api_provider_uses_documented_basic_auth_and_single_sms_payload(): void
    {
        $this->configureGateway('encoded-credential');
        Http::fake([
            'https://messaging-service.co.tz/api/sms/v1/text/single' => Http::response([
                'messages' => [[
                    'to' => '255712345678',
                    'status' => ['groupName' => 'PENDING', 'name' => 'PENDING_ENROUTE'],
                    'smsCount' => 1,
                ]],
            ]),
        ]);

        $sent = app(SmsService::class)->send('0712 345 678', 'Your code is 123456.', true);

        $this->assertTrue($sent);
        Http::assertSent(function (Request $request): bool {
            $payload = $request->data();

            return $request->url() === 'https://messaging-service.co.tz/api/sms/v1/text/single'
                && $request->hasHeader('Authorization', 'Basic encoded-credential')
                && $payload['from'] === 'SKiganjani'
                && $payload['to'] === '255712345678'
                && $payload['text'] === 'Your code is 123456.'
                && is_string($payload['reference'])
                && $payload['reference'] !== '';
        });
    }

    public function test_api_provider_does_not_duplicate_basic_prefix_or_endpoint_path(): void
    {
        $this->configureGateway('Basic encoded-credential', 'https://messaging-service.co.tz/api/sms/v1/text/single');
        Http::fake(fn () => Http::response([
            'messages' => [['status' => ['groupName' => 'PENDING']]],
        ]));

        app(SmsService::class)->send('+255712345678', 'Test', true);

        Http::assertSent(fn (Request $request): bool =>
            $request->url() === 'https://messaging-service.co.tz/api/sms/v1/text/single'
            && $request->hasHeader('Authorization', 'Basic encoded-credential')
        );
    }

    public function test_api_provider_reports_a_rejected_message_as_failure(): void
    {
        $this->configureGateway('encoded-credential');
        Http::fake(fn () => Http::response([
            'messages' => [['status' => ['groupName' => 'REJECTED', 'name' => 'REJECTED_DESTINATION']]],
        ]));

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('SMS provider rejected the message');

        app(SmsService::class)->send('+255712345678', 'Test', true);
    }

    private function configureGateway(string $credential, string $baseUrl = 'https://messaging-service.co.tz'): void
    {
        SmsConfig::create([
            'provider' => 'API',
            'base_url' => $baseUrl,
            'api_key_encrypted' => app(EncryptionService::class)->encrypt($credential),
            'sender_id' => 'SKiganjani',
            'is_active' => true,
        ]);
    }
}
