<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MessageTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class EmailTemplateController extends Controller
{
    private const DEFAULTS = [
        'EMAIL_VERIFICATION' => [
            'subject' => 'Verify your BizTrack account',
            'body' => "Hello {{name}},\n\nWelcome to BizTrack. Verify your account using this link:\n\n{{verificationLink}}",
            'variables' => ['name', 'verificationLink'],
        ],
        'PASSWORD_RESET' => [
            'subject' => 'Reset your BizTrack password',
            'body' => "Hello {{name}},\n\nReset your password using this link:\n\n{{resetLink}}",
            'variables' => ['name', 'resetLink'],
        ],
        'LOGIN_ALERT' => [
            'subject' => 'New BizTrack login',
            'body' => "Hello {{name}},\n\nA new login was detected on your BizTrack account at {{loginTime}}.",
            'variables' => ['name', 'loginTime'],
        ],
        'OTP_CODE' => [
            'subject' => 'Your BizTrack login code',
            'body' => "Hello {{name}},\n\nYour login code is {{code}}. It expires in {{expiresIn}}.",
            'variables' => ['name', 'code', 'expiresIn'],
        ],
        'ACCOUNT_SUSPENDED' => [
            'subject' => 'Your BizTrack account was suspended',
            'body' => "Hello {{name}},\n\nYour account was suspended. Contact support for help.",
            'variables' => ['name'],
        ],
        'SUBSCRIPTION_ACTIVATED' => [
            'subject' => 'Your BizTrack subscription is active',
            'body' => "Hello {{name}},\n\nYour {{packageName}} subscription is now active.",
            'variables' => ['name', 'packageName'],
        ],
        'SUBSCRIPTION_EXPIRED' => [
            'subject' => 'Your BizTrack subscription expired',
            'body' => "Hello {{name}},\n\nYour {{packageName}} subscription expired on {{expiryDate}}.",
            'variables' => ['name', 'packageName', 'expiryDate'],
        ],
    ];

    public function listEmailTemplates(Request $request): JsonResponse
    {
        $saved = MessageTemplate::where('type', 'EMAIL')->get()->keyBy('key');
        $templates = collect(self::DEFAULTS)->map(function ($defaults, $key) use ($saved) {
            return $this->formatTemplate($saved->get($key), $key, $defaults);
        })->values();
        return response()->json(['success' => true, 'data' => ['templates' => $templates]]);
    }

    public function getEmailTemplate(Request $request, string $key): JsonResponse
    {
        if (!array_key_exists($key, self::DEFAULTS)) return response()->json(['success' => false, 'error' => 'Template not found'], 404);
        $template = MessageTemplate::where('key', $key)->where('type', 'EMAIL')->first();
        return response()->json(['success' => true, 'data' => $this->formatTemplate($template, $key, self::DEFAULTS[$key])]);
    }

    public function updateEmailTemplate(Request $request, string $key): JsonResponse
    {
        $data = $request->validate([
            'subject' => 'nullable|string',
            'body' => 'required|string',
            'isActive' => 'sometimes|boolean',
        ]);

        $template = MessageTemplate::where('key', $key)->where('type', 'EMAIL')->first();

        if ($template) {
            $template->update([
                'subject' => $data['subject'] ?? $template->subject,
                'body' => $data['body'],
                'is_active' => $data['isActive'] ?? $template->is_active,
            ]);
        } else {
            $template = MessageTemplate::create([
                'id' => Str::uuid(),
                'type' => 'EMAIL',
                'key' => $key,
                'subject' => $data['subject'] ?? null,
                'body' => $data['body'],
                'is_active' => $data['isActive'] ?? true,
            ]);
        }

        return response()->json(['success' => true, 'data' => $this->formatTemplate($template, $key, self::DEFAULTS[$key] ?? ['variables' => []])]);
    }

    public function previewEmailTemplate(Request $request, string $key): JsonResponse
    {
        if (!array_key_exists($key, self::DEFAULTS)) return response()->json(['success' => false, 'error' => 'Template not found'], 404);
        $template = MessageTemplate::where('key', $key)->where('type', 'EMAIL')->first();

        $variables = array_merge($this->sampleVariables($key), $request->input('variables', []));
        $subject = $template?->subject ?? self::DEFAULTS[$key]['subject'];
        $body = $template?->body ?? self::DEFAULTS[$key]['body'];
        $subject = $this->interpolate($subject, $variables);
        foreach ($variables as $k => $v) {
            $body = str_replace('{{' . $k . '}}', $v, $body);
            $body = str_replace('{{ ' . $k . ' }}', $v, $body);
        }

        return response()->json(['success' => true, 'data' => ['key' => $key, 'subject' => $subject, 'body' => $body, 'variables' => $variables]]);
    }

    private function formatTemplate(?MessageTemplate $template, string $key, array $defaults): array
    {
        return [
            'id' => $template?->id ?? '',
            'type' => 'EMAIL',
            'key' => $key,
            'subject' => $template?->subject ?? $defaults['subject'] ?? null,
            'body' => $template?->body ?? $defaults['body'] ?? '',
            'is_active' => $template?->is_active ?? true,
            'requiredVariables' => $defaults['variables'] ?? [],
            'supportedVariables' => $defaults['variables'] ?? [],
            'created_at' => $template?->created_at,
            'updated_at' => $template?->updated_at,
        ];
    }

    private function sampleVariables(string $key): array
    {
        return [
            'name' => 'Isaya John',
            'verificationLink' => 'https://app.biztrack.co/verify-email?token=sample',
            'resetLink' => 'https://app.biztrack.co/reset-password?token=sample',
            'loginTime' => now()->format('M d, Y H:i'),
            'code' => '123456',
            'expiresIn' => '10 minutes',
            'packageName' => 'Business Pro',
            'expiryDate' => now()->addMonth()->format('M d, Y'),
        ];
    }

    private function interpolate(string $template, array $variables): string
    {
        foreach ($variables as $key => $value) {
            $template = str_replace('{{' . $key . '}}', $value, $template);
            $template = str_replace('{{ ' . $key . ' }}', $value, $template);
        }
        return $template;
    }
}
