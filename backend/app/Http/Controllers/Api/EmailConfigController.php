<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmailConfig;
use App\Services\EmailService;
use App\Services\EncryptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class EmailConfigController extends Controller
{
    public function __construct(private EncryptionService $encryptionService, private EmailService $emailService) {}

    public function getEmailConfig(Request $request): JsonResponse
    {
        $config = EmailConfig::first();
        return response()->json(['success' => true, 'data' => $config ? $this->formatConfig($config) : null]);
    }

    public function updateEmailConfig(Request $request): JsonResponse
    {
        $data = $request->validate([
            'provider' => 'required|in:SMTP,API,CUSTOM',
            'host' => 'nullable|string',
            'port' => 'nullable|integer',
            'username' => 'nullable|string',
            'password' => 'nullable|string',
            'apiKey' => 'nullable|string',
            'fromName' => 'required|string',
            'fromEmail' => 'required|email',
            'replyToEmail' => 'nullable|email',
        ]);

        $payload = [
            'provider' => $data['provider'],
            'host' => $data['host'] ?? null,
            'port' => $data['port'] ?? null,
            'username' => $data['username'] ?? null,
            'from_name' => $data['fromName'],
            'from_email' => $data['fromEmail'],
            'reply_to_email' => $data['replyToEmail'] ?? null,
        ];

        if (!empty($data['password'])) {
            $payload['password_encrypted'] = $this->encryptionService->encrypt($data['password']);
        }
        if (!empty($data['apiKey'])) {
            $payload['api_key_encrypted'] = $this->encryptionService->encrypt($data['apiKey']);
        }

        $config = EmailConfig::first();
        if ($config) {
            $config->update($payload);
        } else {
            $config = EmailConfig::create(array_merge(['id' => Str::uuid()], $payload));
        }

        return response()->json(['success' => true, 'data' => $this->formatConfig($config)]);
    }

    public function testEmailConfig(Request $request): JsonResponse
    {
        $data = $request->validate([
            'toEmail' => 'nullable|email',
            'to' => 'nullable|email',
        ]);

        $toEmail = $data['toEmail'] ?? $data['to'] ?? null;
        if (!$toEmail) {
            return response()->json(['success' => false, 'error' => 'Recipient email is required'], 422);
        }

        $this->emailService->send($toEmail, $toEmail, 'BizTrack Email Test', '<p>This is a test email from BizTrack.</p>', true);

        return response()->json(['success' => true, 'data' => [
            'status' => 'SENT',
            'provider' => 'SMTP',
            'fromEmail' => config('mail.from.address'),
            'toMasked' => $this->maskEmail($toEmail),
        ]]);
    }

    private function formatConfig(EmailConfig $config): array
    {
        return [
            'id' => $config->id,
            'provider' => $config->provider,
            'host' => $config->host,
            'port' => $config->port,
            'username' => $config->username,
            'passwordMasked' => $config->password_encrypted ? '********' : null,
            'apiKeyMasked' => $config->api_key_encrypted ? '********' : null,
            'fromName' => $config->from_name,
            'fromEmail' => $config->from_email,
            'replyToEmail' => $config->reply_to_email,
            'isActive' => (bool) $config->is_active,
            'createdAt' => $config->created_at,
            'updatedAt' => $config->updated_at,
        ];
    }

    private function maskEmail(string $email): string
    {
        [$name, $domain] = array_pad(explode('@', $email, 2), 2, '');
        $maskedName = strlen($name) <= 2 ? str_repeat('*', strlen($name)) : substr($name, 0, 2) . str_repeat('*', max(strlen($name) - 2, 1));
        return $maskedName . '@' . $domain;
    }
}
