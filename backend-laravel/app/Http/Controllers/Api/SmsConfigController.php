<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SmsConfig;
use App\Services\EncryptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SmsConfigController extends Controller
{
    public function __construct(private EncryptionService $encryptionService) {}

    public function getSmsConfig(Request $request): JsonResponse
    {
        $config = SmsConfig::first();
        return response()->json(['success' => true, 'data' => $config]);
    }

    public function updateSmsConfig(Request $request): JsonResponse
    {
        $data = $request->validate([
            'provider' => 'required|in:SMTP,API,CUSTOM',
            'baseUrl' => 'nullable|string',
            'apiKey' => 'nullable|string',
            'apiSecret' => 'nullable|string',
            'senderId' => 'nullable|string',
        ]);

        $payload = [
            'provider' => $data['provider'],
            'base_url' => $data['baseUrl'] ?? null,
            'sender_id' => $data['senderId'] ?? null,
        ];

        if (!empty($data['apiKey'])) {
            $payload['api_key_encrypted'] = $this->encryptionService->encrypt($data['apiKey']);
        }
        if (!empty($data['apiSecret'])) {
            $payload['api_secret_encrypted'] = $this->encryptionService->encrypt($data['apiSecret']);
        }

        $config = SmsConfig::first();
        if ($config) {
            $config->update($payload);
        } else {
            $config = SmsConfig::create(array_merge(['id' => Str::uuid()], $payload));
        }

        return response()->json(['success' => true, 'data' => $config]);
    }

    public function testSmsConfig(Request $request): JsonResponse
    {
        $data = $request->validate(['phone' => 'required|string']);
        return response()->json(['success' => true, 'data' => ['message' => 'Test SMS would be sent to ' . $data['phone']]]);
    }
}
