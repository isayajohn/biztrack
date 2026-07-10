<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppBranding;
use App\Models\LandingPageContent;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LandingController extends Controller
{
    public function downloadApk()
    {
        $content = LandingPageContent::where('is_published', true)->firstOrFail();
        abort_unless($content->apk_path && Storage::disk('local')->exists($content->apk_path), 404);

        return Storage::disk('local')->download(
            $content->apk_path,
            $content->apk_file_name ?: 'biztrack.apk',
            ['Content-Type' => 'application/vnd.android.package-archive']
        );
    }
    public function getPublicLandingPage(Request $request): JsonResponse
    {
        $content = LandingPageContent::where('is_published', true)->first();
        if ($content) {
            $content->makeHidden(['apk_path']);
            $content->setAttribute('apk_available', (bool) ($content->apk_path && Storage::disk('local')->exists($content->apk_path)));
        }
        return response()->json(['success' => true, 'data' => $content]);
    }

    public function getBranding(Request $request): JsonResponse
    {
        $branding = AppBranding::first();
        return response()->json([
            'success' => true,
            'data' => $branding ? [
                'hasLogo' => !empty($branding->logo_data_url),
                'logoFileName' => $branding->logo_file_name,
                'logoMimeType' => $branding->logo_mime_type,
            ] : ['hasLogo' => false],
        ]);
    }

    public function getBrandingLogo(Request $request)
    {
        $branding = AppBranding::first();

        if (!$branding || !$branding->logo_data_url) {
            return response()->json(['success' => false, 'error' => 'No logo'], 404);
        }

        $dataUrl = $branding->logo_data_url;
        if (str_starts_with($dataUrl, 'data:')) {
            $parts = explode(',', $dataUrl, 2);
            $mime = preg_replace('/data:([^;]+);.*/', '$1', $parts[0]);
            $imageData = base64_decode($parts[1]);
            return response($imageData, 200)->header('Content-Type', $mime);
        }

        return response()->json(['success' => false, 'error' => 'Invalid logo format'], 404);
    }
}
