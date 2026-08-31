<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SmsConfig;
use App\Services\EncryptionService;
use App\Services\SmsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SmsConfigController extends Controller
{
    public function __construct(private EncryptionService $encryptionService, private SmsService $smsService) {}

    public function getSmsConfig(Request $request): JsonResponse
    {
        $config = SmsConfig::first();
        return response()->json(['success' => true, 'data' => $config ? $this->formatConfig($config) : null]);
    }

    public function updateSmsConfig(Request $request): JsonResponse
    {
        $data = $request->validate([
            'provider' => 'required|in:SMTP,API,CUSTOM',
            'baseUrl' => 'nullable|string',
            'apiKey' => 'nullable|string',
            'apiSecret' => 'nullable|string',
            'senderId' => 'nullable|string|max:50',
            'isActive' => 'sometimes|boolean',
            'clearApiKey' => 'sometimes|boolean',
            'clearApiSecret' => 'sometimes|boolean',
        ]);

        $payload = [
            'provider' => $data['provider'],
            'base_url' => $data['baseUrl'] ?? null,
            'sender_id' => $data['senderId'] ?? null,
            'is_active' => $data['isActive'] ?? true,
        ];

        if (!empty($data['apiKey'])) {
            $payload['api_key_encrypted'] = $this->encryptionService->encrypt($data['apiKey']);
        }
        if (!empty($data['apiSecret'])) {
            $payload['api_secret_encrypted'] = $this->encryptionService->encrypt($data['apiSecret']);
        }
        if (!empty($data['clearApiKey'])) $payload['api_key_encrypted'] = null;
        if (!empty($data['clearApiSecret'])) $payload['api_secret_encrypted'] = null;

        $config = SmsConfig::first();
        if ($config) {
            $config->update($payload);
        } else {
            $config = SmsConfig::create(array_merge(['id' => Str::uuid()], $payload));
        }

        return response()->json(['success' => true, 'data' => $this->formatConfig($config)]);
    }

    public function testSmsConfig(Request $request): JsonResponse
    {
        $data = $request->validate(['phone' => 'required|string', 'message' => 'nullable|string|max:480']);
        $this->smsService->send($data['phone'], $data['message'] ?? 'Your BizTrack test message.', true);
        $config = SmsConfig::where('is_active', true)->first();

        return response()->json(['success' => true, 'data' => [
            'status' => 'SENT',
            'provider' => $config?->provider ?? 'API',
            'senderId' => $config?->sender_id,
            'phoneNumberMasked' => $this->maskPhone($data['phone']),
        ]]);
    }

    private function formatConfig(SmsConfig $config): array
    {
        return [
            'id' => $config->id,
            'provider' => $config->provider,
            'baseUrl' => $config->base_url,
            'apiKeyMasked' => $config->api_key_encrypted ? '********' : null,
            'apiSecretMasked' => $config->api_secret_encrypted ? '********' : null,
            'senderId' => $config->sender_id,
            'isActive' => (bool) $config->is_active,
            'createdAt' => $config->created_at,
            'updatedAt' => $config->updated_at,
        ];
    }

    private function maskPhone(string $phone): string
    {
        $digits = preg_replace('/\D+/', '', $phone) ?: '';
        if (strlen($digits) <= 5) return str_repeat('*', strlen($digits));
        return substr($digits, 0, 3).str_repeat('*', max(strlen($digits) - 6, 3)).substr($digits, -3);
    }
}
