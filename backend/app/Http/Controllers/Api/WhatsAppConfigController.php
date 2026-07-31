<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WhatsAppConfig;
use App\Services\EncryptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class WhatsAppConfigController extends Controller
{
    public function __construct(private EncryptionService $encryptionService) {}

    public function getWhatsAppConfig(Request $request): JsonResponse
    {
        $config = WhatsAppConfig::first();
        return response()->json(['success' => true, 'data' => $config]);
    }

    public function updateWhatsAppConfig(Request $request): JsonResponse
    {
        $data = $request->validate([
            'provider' => 'required|in:API,CUSTOM',
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

        $config = WhatsAppConfig::first();
        if ($config) {
            $config->update($payload);
        } else {
            $config = WhatsAppConfig::create(array_merge(['id' => Str::uuid()], $payload));
        }

        return response()->json(['success' => true, 'data' => $config]);
    }

    public function testWhatsAppConfig(Request $request): JsonResponse
    {
        $data = $request->validate(['phone' => 'required|string']);
        return response()->json(['success' => true, 'data' => ['message' => 'Test WhatsApp message would be sent to ' . $data['phone']]]);
    }
}
