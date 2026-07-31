<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MessageTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SmsTemplateController extends Controller
{
    private const DEFAULTS = [
        'OTP_CODE' => [
            'body' => 'Your BizTrack login code is {{code}}. It expires in {{expiresIn}}.',
            'variables' => ['code', 'expiresIn'],
        ],
        'ACCOUNT_SUSPENDED' => [
            'body' => 'Hello {{name}}, your BizTrack account has been suspended.',
            'variables' => ['name'],
        ],
        'SUBSCRIPTION_ACTIVATED' => [
            'body' => 'Your {{packageName}} BizTrack subscription is active.',
            'variables' => ['packageName'],
        ],
        'SUBSCRIPTION_EXPIRED' => [
            'body' => 'Your {{packageName}} BizTrack subscription expired on {{expiryDate}}.',
            'variables' => ['packageName', 'expiryDate'],
        ],
    ];

    public function listSmsTemplates(Request $request): JsonResponse
    {
        $saved = MessageTemplate::where('type', 'SMS')->get()->keyBy('key');
        $templates = collect(self::DEFAULTS)->map(function ($defaults, $key) use ($saved) {
            return $this->formatTemplate($saved->get($key), $key, $defaults);
        })->values();
        return response()->json(['success' => true, 'data' => ['templates' => $templates]]);
    }

    public function getSmsTemplate(Request $request, string $key): JsonResponse
    {
        if (!array_key_exists($key, self::DEFAULTS)) return response()->json(['success' => false, 'error' => 'Template not found'], 404);
        $template = MessageTemplate::where('key', $key)->where('type', 'SMS')->first();
        return response()->json(['success' => true, 'data' => $this->formatTemplate($template, $key, self::DEFAULTS[$key])]);
    }

    public function updateSmsTemplate(Request $request, string $key): JsonResponse
    {
        $data = $request->validate(['body' => 'required|string', 'isActive' => 'sometimes|boolean']);

        $template = MessageTemplate::where('key', $key)->where('type', 'SMS')->first();
        if ($template) {
            $template->update(['body' => $data['body'], 'is_active' => $data['isActive'] ?? $template->is_active]);
        } else {
            $template = MessageTemplate::create([
                'id' => Str::uuid(),
                'type' => 'SMS',
                'key' => $key,
                'body' => $data['body'],
                'is_active' => $data['isActive'] ?? true,
            ]);
        }

        return response()->json(['success' => true, 'data' => $this->formatTemplate($template, $key, self::DEFAULTS[$key] ?? ['variables' => []])]);
    }

    public function previewSmsTemplate(Request $request, string $key): JsonResponse
    {
        if (!array_key_exists($key, self::DEFAULTS)) return response()->json(['success' => false, 'error' => 'Template not found'], 404);
        $template = MessageTemplate::where('key', $key)->where('type', 'SMS')->first();

        $variables = array_merge($this->sampleVariables(), $request->input('variables', []));
        $body = $template?->body ?? self::DEFAULTS[$key]['body'];
        foreach ($variables as $k => $v) {
            $body = str_replace('{{' . $k . '}}', $v, $body);
            $body = str_replace('{{ ' . $k . ' }}', $v, $body);
        }

        return response()->json(['success' => true, 'data' => ['key' => $key, 'body' => $body, 'characterCount' => strlen($body), 'variables' => $variables]]);
    }

    private function formatTemplate(?MessageTemplate $template, string $key, array $defaults): array
    {
        return [
            'id' => $template?->id ?? '',
            'type' => 'SMS',
            'key' => $key,
            'body' => $template?->body ?? $defaults['body'] ?? '',
            'is_active' => $template?->is_active ?? true,
            'requiredVariables' => $defaults['variables'] ?? [],
            'supportedVariables' => $defaults['variables'] ?? [],
            'created_at' => $template?->created_at,
            'updated_at' => $template?->updated_at,
        ];
    }

    private function sampleVariables(): array
    {
        return [
            'name' => 'Isaya John',
            'code' => '123456',
            'expiresIn' => '10 minutes',
            'packageName' => 'Business Pro',
            'expiryDate' => now()->addMonth()->format('M d, Y'),
        ];
    }
}
