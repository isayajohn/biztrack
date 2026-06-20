<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MessageTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SmsTemplateController extends Controller
{
    public function listSmsTemplates(Request $request): JsonResponse
    {
        $templates = MessageTemplate::where('type', 'SMS')->get();
        return response()->json(['success' => true, 'data' => ['templates' => $templates]]);
    }

    public function getSmsTemplate(Request $request, string $key): JsonResponse
    {
        $template = MessageTemplate::where('key', $key)->where('type', 'SMS')->first();
        if (!$template) return response()->json(['success' => false, 'error' => 'Template not found'], 404);
        return response()->json(['success' => true, 'data' => $template]);
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

        return response()->json(['success' => true, 'data' => $template]);
    }

    public function previewSmsTemplate(Request $request, string $key): JsonResponse
    {
        $template = MessageTemplate::where('key', $key)->where('type', 'SMS')->first();
        if (!$template) return response()->json(['success' => false, 'error' => 'Template not found'], 404);

        $variables = $request->input('variables', []);
        $body = $template->body;
        foreach ($variables as $k => $v) {
            $body = str_replace('{{' . $k . '}}', $v, $body);
        }

        return response()->json(['success' => true, 'data' => ['body' => $body]]);
    }
}
