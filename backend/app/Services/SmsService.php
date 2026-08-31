<?php

namespace App\Services;

use App\Models\MessageTemplate;
use App\Models\SmsConfig;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SmsService
{
    public function __construct(private EncryptionService $encryptionService) {}

    public function sendFromTemplate(string $templateKey, string $toPhone, array $variables = []): bool
    {
        $template = MessageTemplate::where('key', $templateKey)
            ->where('type', 'SMS')
            ->where('is_active', true)
            ->first();

        $body = $this->interpolate($template?->body ?: $this->fallbackBody($templateKey), $variables);

        return $this->send($toPhone, $body);
    }

    public function send(string $toPhone, string $message, bool $throw = false): bool
    {
        $config = SmsConfig::where('is_active', true)->first();

        if (!$config || !$config->base_url) {
            Log::warning('SMS not sent: no active SMS gateway configured');
            if ($throw) {
                throw new \RuntimeException('No active SMS gateway configured');
            }
            return false;
        }

        try {
            $apiKey = $config->api_key_encrypted ? $this->encryptionService->decrypt($config->api_key_encrypted) : null;

            if ($config->provider === 'API') {
                $this->sendWithMessagingService($config, $apiKey, $toPhone, $message);
            } else {
                $this->sendWithCustomGateway($config, $apiKey, $toPhone, $message);
            }

            return true;
        } catch (\Throwable $e) {
            Log::warning('SMS send failed', [
                'provider' => $config->provider,
                'recipient' => $this->maskPhone($toPhone),
                'error' => $e->getMessage(),
            ]);
            if ($throw) {
                throw $e;
            }
            return false;
        }
    }

    private function fallbackBody(string $templateKey): string
    {
        return match ($templateKey) {
            'OTP_CODE' => 'Your BizTrack verification code is {{code}}. It expires in {{expiresIn}}.',
            default => 'You have a new notification from {{business_name}}.',
        };
    }

    private function interpolate(string $template, array $vars): string
    {
        foreach ($vars as $key => $value) {
            $template = str_replace('{{' . $key . '}}', (string) $value, $template);
            $template = str_replace('{{ ' . $key . ' }}', (string) $value, $template);
        }
        return $template;
    }

    private function sendWithMessagingService(SmsConfig $config, ?string $apiKey, string $toPhone, string $message): void
    {
        if (!$apiKey) {
            throw new \RuntimeException('The SMS Basic authorization credential is not configured');
        }
        if (!$config->sender_id) {
            throw new \RuntimeException('The SMS sender ID is not configured');
        }

        $authorization = Str::startsWith($apiKey, 'Basic ') ? $apiKey : 'Basic '.$apiKey;
        $response = Http::timeout(15)
            ->acceptJson()
            ->withHeaders(['Authorization' => $authorization])
            ->post($this->singleSmsEndpoint($config->base_url), [
                'from' => $config->sender_id,
                'to' => $this->normalizePhone($toPhone),
                'text' => $message,
                'reference' => (string) Str::uuid(),
            ]);

        $this->ensureAccepted($response);
    }

    private function sendWithCustomGateway(SmsConfig $config, ?string $apiKey, string $toPhone, string $message): void
    {
        $response = Http::timeout(15)
            ->acceptJson()
            ->withHeaders(array_filter([
                'Authorization' => $apiKey ? 'Bearer '.$apiKey : null,
            ]))
            ->post($config->base_url, [
                'to' => $toPhone,
                'message' => $message,
                'sender_id' => $config->sender_id,
            ]);

        if (!$response->successful()) {
            throw new \RuntimeException('SMS gateway returned HTTP '.$response->status());
        }
    }

    private function singleSmsEndpoint(string $baseUrl): string
    {
        $baseUrl = rtrim($baseUrl, '/');
        if (Str::endsWith($baseUrl, '/api/sms/v1/text/single')) {
            return $baseUrl;
        }

        return $baseUrl.'/api/sms/v1/text/single';
    }

    private function normalizePhone(string $phone): string
    {
        $digits = preg_replace('/\D+/', '', $phone) ?: '';
        if (Str::startsWith($digits, '00')) {
            $digits = substr($digits, 2);
        }
        if (strlen($digits) === 10 && Str::startsWith($digits, '0')) {
            $digits = '255'.substr($digits, 1);
        }
        if (strlen($digits) < 10 || strlen($digits) > 15) {
            throw new \InvalidArgumentException('The recipient phone number is invalid');
        }

        return $digits;
    }

    private function ensureAccepted(Response $response): void
    {
        if (!$response->successful()) {
            throw new \RuntimeException('SMS provider returned HTTP '.$response->status());
        }

        $messages = $response->json('messages');
        if (!is_array($messages) || $messages === []) {
            throw new \RuntimeException('SMS provider did not confirm message acceptance');
        }

        $group = strtoupper((string) data_get($messages, '0.status.groupName', ''));
        $name = strtoupper((string) data_get($messages, '0.status.name', ''));
        foreach (['REJECTED', 'UNDELIVERABLE', 'EXPIRED', 'DELETED'] as $failure) {
            if (str_contains($group, $failure) || str_contains($name, $failure)) {
                throw new \RuntimeException('SMS provider rejected the message');
            }
        }
    }

    private function maskPhone(string $phone): string
    {
        $digits = preg_replace('/\D+/', '', $phone) ?: '';
        if (strlen($digits) <= 5) return str_repeat('*', strlen($digits));
        return substr($digits, 0, 3).str_repeat('*', max(strlen($digits) - 6, 3)).substr($digits, -3);
    }
}
