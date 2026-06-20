<?php

namespace App\Services;

use App\Models\EmailConfig;
use App\Models\MessageTemplate;
use Illuminate\Support\Facades\Mail;
use Illuminate\Mail\Message;
use Illuminate\Support\Facades\Log;

class EmailService
{
    public function __construct(private EncryptionService $encryptionService) {}

    public function sendFromTemplate(string $templateKey, string $toEmail, string $toName, array $variables = []): void
    {
        $template = MessageTemplate::where('key', $templateKey)
            ->where('type', 'EMAIL')
            ->where('is_active', true)
            ->first();

        $fallback = $this->fallbackTemplate($templateKey);
        $subject = $this->interpolate($template?->subject ?: $fallback['subject'], $variables);
        $body = $this->interpolate($template?->body ?: $fallback['body'], $variables);

        $this->send($toEmail, $toName, $subject, $body);
    }

    public function send(string $toEmail, string $toName, string $subject, string $body, bool $throw = false): bool
    {
        try {
            $this->applyMailerConfig();
            Mail::send([], [], function (Message $message) use ($toEmail, $toName, $subject, $body) {
                $message->to($toEmail, $toName)
                    ->subject($subject)
                    ->html($body);
            });

            return true;
        } catch (\Throwable $e) {
            Log::warning('Email send failed: ' . $e->getMessage());
            if ($throw) {
                throw $e;
            }
            return false;
        }
    }

    private function applyMailerConfig(): void
    {
        $config = EmailConfig::where('is_active', true)->first();
        if (!$config || $config->provider !== 'SMTP') {
            return;
        }

        $password = $config->password_encrypted
            ? $this->encryptionService->decrypt($config->password_encrypted)
            : config('mail.mailers.smtp.password');

        config([
            'mail.default' => 'smtp',
            'mail.mailers.smtp.host' => $config->host ?: config('mail.mailers.smtp.host'),
            'mail.mailers.smtp.port' => $config->port ?: config('mail.mailers.smtp.port'),
            'mail.mailers.smtp.username' => $config->username ?: config('mail.mailers.smtp.username'),
            'mail.mailers.smtp.password' => $password,
            'mail.from.address' => $config->from_email ?: config('mail.from.address'),
            'mail.from.name' => $config->from_name ?: config('mail.from.name'),
        ]);

        Mail::purge('smtp');
    }

    private function fallbackTemplate(string $templateKey): array
    {
        return match ($templateKey) {
            'EMAIL_VERIFICATION' => [
                'subject' => 'Verify your BizTrack account',
                'body' => '<p>Hello {{name}},</p><p>Verify your account here: <a href="{{verifyUrl}}">{{verifyUrl}}</a></p>',
            ],
            'PASSWORD_RESET' => [
                'subject' => 'Reset your BizTrack password',
                'body' => '<p>Hello {{name}},</p><p>Reset your password here: <a href="{{resetUrl}}">{{resetUrl}}</a></p>',
            ],
            'OTP_CODE' => [
                'subject' => 'Your BizTrack login code',
                'body' => '<p>Hello {{name}},</p><p>Your login code is <strong>{{code}}</strong>.</p>',
            ],
            default => [
                'subject' => 'BizTrack notification',
                'body' => '<p>Hello {{name}},</p><p>You have a new BizTrack notification.</p>',
            ],
        };
    }

    private function interpolate(string $template, array $vars): string
    {
        foreach ($vars as $key => $value) {
            $template = str_replace('{{'.$key.'}}', $value, $template);
            $template = str_replace('{{ '.$key.' }}', $value, $template);
            $template = str_replace('{{'.$key.' }}', $value, $template);
            $template = str_replace('{{ '.$key.'}}', $value, $template);
        }
        return $template;
    }
}
