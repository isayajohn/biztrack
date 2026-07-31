<?php

namespace App\Services;

use App\Models\MessageTemplate;
use App\Models\SmsConfig;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

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
            Log::warning("SMS not sent to {$toPhone}: no active SMS gateway configured");
            if ($throw) {
                throw new \RuntimeException('No active SMS gateway configured');
            }
            return false;
        }

        try {
            $apiKey = $config->api_key_encrypted ? $this->encryptionService->decrypt($config->api_key_encrypted) : null;

            $client = new Client(['timeout' => 15]);
            $client->post($config->base_url, [
                'headers' => array_filter([
                    'Authorization' => $apiKey ? "Bearer {$apiKey}" : null,
                    'Content-Type' => 'application/json',
                ]),
                'json' => [
                    'to' => $toPhone,
                    'message' => $message,
                    'sender_id' => $config->sender_id,
                ],
            ]);

            return true;
        } catch (\Throwable $e) {
            Log::warning('SMS send failed: ' . $e->getMessage());
            if ($throw) {
                throw $e;
            }
            return false;
        }
    }

    private function fallbackBody(string $templateKey): string
    {
        return 'You have a new notification from {{business_name}}.';
    }

    private function interpolate(string $template, array $vars): string
    {
        foreach ($vars as $key => $value) {
            $template = str_replace('{{' . $key . '}}', (string) $value, $template);
            $template = str_replace('{{ ' . $key . ' }}', (string) $value, $template);
        }
        return $template;
    }
}
