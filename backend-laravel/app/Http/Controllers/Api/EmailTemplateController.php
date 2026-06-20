<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MessageTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class EmailTemplateController extends Controller
{
    public function listEmailTemplates(Request $request): JsonResponse
    {
        $templates = MessageTemplate::where('type', 'EMAIL')->get();
        return response()->json(['success' => true, 'data' => ['templates' => $templates]]);
    }

    public function getEmailTemplate(Request $request, string $key): JsonResponse
    {
        $template = MessageTemplate::where('key', $key)->where('type', 'EMAIL')->first();
        if (!$template) return response()->json(['success' => false, 'error' => 'Template not found'], 404);
        return response()->json(['success' => true, 'data' => $template]);
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

        return response()->json(['success' => true, 'data' => $template]);
    }

    public function previewEmailTemplate(Request $request, string $key): JsonResponse
    {
        $template = MessageTemplate::where('key', $key)->where('type', 'EMAIL')->first();
        if (!$template) return response()->json(['success' => false, 'error' => 'Template not found'], 404);

        $variables = $request->input('variables', []);
        $body = $template->body;
        foreach ($variables as $k => $v) {
            $body = str_replace('{{' . $k . '}}', $v, $body);
            $body = str_replace('{{ ' . $k . ' }}', $v, $body);
        }

        return response()->json(['success' => true, 'data' => ['subject' => $template->subject, 'body' => $body]]);
    }
}
