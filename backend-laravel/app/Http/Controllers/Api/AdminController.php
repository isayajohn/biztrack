<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppBranding;
use App\Models\AuditLog;
use App\Models\Business;
use App\Models\BusinessSubscription;
use App\Models\EmailConfig;
use App\Models\LandingPageContent;
use App\Models\MessageTemplate;
use App\Models\SecurityConfig;
use App\Models\SmsConfig;
use App\Models\User;
use App\Services\AuditService;
use App\Services\EncryptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminController extends Controller
{
    public function __construct(private EncryptionService $encryptionService) {}

    public function getAdminStats(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'totalUsers' => User::where('role', 'USER')->count(),
                'activeUsers' => User::where('role', 'USER')->where('status', 'ACTIVE')->count(),
                'totalBusinesses' => Business::count(),
                'activeSubscriptions' => BusinessSubscription::whereIn('status', ['TRIAL', 'ACTIVE'])->count(),
            ],
        ]);
    }

    public function getSystemSummary(Request $request): JsonResponse
    {
        return $this->getAdminStats($request);
    }

    public function getBranding(Request $request): JsonResponse
    {
        $branding = AppBranding::first();
        return response()->json(['success' => true, 'data' => $branding]);
    }

    public function updateBranding(Request $request): JsonResponse
    {
        $data = $request->validate([
            'logoDataUrl' => 'nullable|string',
            'logoFileName' => 'nullable|string',
            'logoMimeType' => 'nullable|string',
        ]);

        $branding = AppBranding::first();
        if ($branding) {
            $branding->update([
                'logo_data_url' => $data['logoDataUrl'] ?? $branding->logo_data_url,
                'logo_file_name' => $data['logoFileName'] ?? $branding->logo_file_name,
                'logo_mime_type' => $data['logoMimeType'] ?? $branding->logo_mime_type,
            ]);
        } else {
            $branding = AppBranding::create([
                'id' => Str::uuid(),
                'logo_data_url' => $data['logoDataUrl'] ?? null,
                'logo_file_name' => $data['logoFileName'] ?? null,
                'logo_mime_type' => $data['logoMimeType'] ?? null,
            ]);
        }

        return response()->json(['success' => true, 'data' => $branding]);
    }

    public function removeBrandingLogo(Request $request): JsonResponse
    {
        $branding = AppBranding::first();
        if ($branding) {
            $branding->update(['logo_data_url' => null, 'logo_file_name' => null, 'logo_mime_type' => null]);
        }
        return response()->json(['success' => true, 'data' => ['message' => 'Logo removed']]);
    }

    public function getLandingPageContent(Request $request): JsonResponse
    {
        $content = LandingPageContent::first();
        return response()->json(['success' => true, 'data' => $content]);
    }

    public function updateLandingPageContent(Request $request): JsonResponse
    {
        $data = $request->validate([
            'heroTitle' => 'sometimes|string',
            'heroSubtitle' => 'sometimes|string',
            'heroKicker' => 'nullable|string',
            'primaryButtonText' => 'sometimes|string',
            'primaryButtonUrl' => 'sometimes|string',
            'secondaryButtonText' => 'sometimes|string',
            'secondaryButtonUrl' => 'sometimes|string',
            'heroTrustText' => 'nullable|string',
            'heroImageUrl' => 'nullable|string',
            'featuresEyebrow' => 'nullable|string',
            'featuresTitle' => 'nullable|string',
            'featuresDescription' => 'nullable|string',
            'pricingEyebrow' => 'nullable|string',
            'pricingTitle' => 'nullable|string',
            'pricingDescription' => 'nullable|string',
            'testimonialsEyebrow' => 'nullable|string',
            'testimonialsTitle' => 'nullable|string',
            'testimonialsDescription' => 'nullable|string',
            'faqEyebrow' => 'nullable|string',
            'faqTitle' => 'nullable|string',
            'faqDescription' => 'nullable|string',
            'finalCtaKicker' => 'nullable|string',
            'finalCtaTitle' => 'nullable|string',
            'finalCtaDescription' => 'nullable|string',
            'features' => 'sometimes|array',
            'pricing' => 'sometimes|array',
            'faqs' => 'sometimes|array',
            'testimonials' => 'nullable|array',
            'footerLinks' => 'nullable|array',
            'heroTrustIndicators' => 'nullable|array',
            'footerTagline' => 'nullable|string',
            'footerBadge' => 'nullable|string',
            'footerProductLinks' => 'nullable|array',
            'footerCompanyLinks' => 'nullable|array',
            'problemSection' => 'nullable|array',
            'solutionSection' => 'nullable|array',
            'howItWorks' => 'nullable|array',
            'seoTitle' => 'nullable|string',
            'seoDescription' => 'nullable|string',
            'isPublished' => 'nullable|boolean',
        ]);

        $content = LandingPageContent::first();
        $value = fn(string $key, string $column, mixed $default = null) => array_key_exists($key, $data)
            ? $data[$key]
            : ($content?->{$column} ?? $default);

        $payload = [
            'hero_title' => $value('heroTitle', 'hero_title', 'Simple sales and expense tracking for growing businesses'),
            'hero_subtitle' => $value('heroSubtitle', 'hero_subtitle', 'Track sales, expenses, products, inventory, and profit from one easy dashboard built for small business owners.'),
            'hero_kicker' => $value('heroKicker', 'hero_kicker'),
            'primary_button_text' => $value('primaryButtonText', 'primary_button_text', 'Get Started Free'),
            'primary_button_url' => $value('primaryButtonUrl', 'primary_button_url', '/register'),
            'secondary_button_text' => $value('secondaryButtonText', 'secondary_button_text', 'View Demo'),
            'secondary_button_url' => $value('secondaryButtonUrl', 'secondary_button_url', '/demo'),
            'hero_trust_text' => $value('heroTrustText', 'hero_trust_text'),
            'hero_image_url' => $value('heroImageUrl', 'hero_image_url'),
            'features_eyebrow' => $value('featuresEyebrow', 'features_eyebrow'),
            'features_title' => $value('featuresTitle', 'features_title'),
            'features_description' => $value('featuresDescription', 'features_description'),
            'pricing_eyebrow' => $value('pricingEyebrow', 'pricing_eyebrow'),
            'pricing_title' => $value('pricingTitle', 'pricing_title'),
            'pricing_description' => $value('pricingDescription', 'pricing_description'),
            'testimonials_eyebrow' => $value('testimonialsEyebrow', 'testimonials_eyebrow'),
            'testimonials_title' => $value('testimonialsTitle', 'testimonials_title'),
            'testimonials_description' => $value('testimonialsDescription', 'testimonials_description'),
            'faq_eyebrow' => $value('faqEyebrow', 'faq_eyebrow'),
            'faq_title' => $value('faqTitle', 'faq_title'),
            'faq_description' => $value('faqDescription', 'faq_description'),
            'final_cta_kicker' => $value('finalCtaKicker', 'final_cta_kicker'),
            'final_cta_title' => $value('finalCtaTitle', 'final_cta_title'),
            'final_cta_description' => $value('finalCtaDescription', 'final_cta_description'),
            'features' => $value('features', 'features', []),
            'pricing' => $value('pricing', 'pricing', []),
            'faqs' => $value('faqs', 'faqs', []),
            'testimonials' => $value('testimonials', 'testimonials'),
            'footer_links' => $value('footerLinks', 'footer_links'),
            'hero_trust_indicators' => $value('heroTrustIndicators', 'hero_trust_indicators'),
            'footer_tagline' => $value('footerTagline', 'footer_tagline'),
            'footer_badge' => $value('footerBadge', 'footer_badge'),
            'footer_product_links' => $value('footerProductLinks', 'footer_product_links'),
            'footer_company_links' => $value('footerCompanyLinks', 'footer_company_links'),
            'problem_section' => $value('problemSection', 'problem_section'),
            'solution_section' => $value('solutionSection', 'solution_section'),
            'how_it_works' => $value('howItWorks', 'how_it_works'),
            'seo_title' => $value('seoTitle', 'seo_title'),
            'seo_description' => $value('seoDescription', 'seo_description'),
            'is_published' => $value('isPublished', 'is_published', false),
        ];

        if ($content) {
            $content->update($payload);
        } else {
            $content = LandingPageContent::create(array_merge(['id' => Str::uuid()], $payload));
        }

        return response()->json(['success' => true, 'data' => $content]);
    }

    public function publishLandingPageContent(Request $request): JsonResponse
    {
        LandingPageContent::query()->update(['is_published' => true]);
        return response()->json(['success' => true, 'data' => LandingPageContent::first()]);
    }

    public function getEmailSettings(Request $request): JsonResponse
    {
        $config = EmailConfig::first();
        $templates = MessageTemplate::where('type', 'EMAIL')->get();
        return response()->json(['success' => true, 'data' => ['config' => $config, 'templates' => $templates]]);
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

        return response()->json(['success' => true, 'data' => $config]);
    }

    public function getSmsSettings(Request $request): JsonResponse
    {
        $config = SmsConfig::first();
        $templates = MessageTemplate::where('type', 'SMS')->get();
        return response()->json(['success' => true, 'data' => ['config' => $config, 'templates' => $templates]]);
    }

    public function updateSmsConfig(Request $request): JsonResponse
    {
        $data = $request->validate([
            'provider' => 'required|in:SMTP,API,CUSTOM',
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

        $config = SmsConfig::first();
        if ($config) {
            $config->update($payload);
        } else {
            $config = SmsConfig::create(array_merge(['id' => Str::uuid()], $payload));
        }

        return response()->json(['success' => true, 'data' => $config]);
    }

    public function updateSmsTemplate(Request $request, string $key): JsonResponse
    {
        $data = $request->validate(['body' => 'required|string']);
        $template = MessageTemplate::where('key', $key)->where('type', 'SMS')->first();

        if ($template) {
            $template->update(['body' => $data['body']]);
        } else {
            $template = MessageTemplate::create([
                'id' => Str::uuid(),
                'type' => 'SMS',
                'key' => $key,
                'body' => $data['body'],
            ]);
        }

        return response()->json(['success' => true, 'data' => $template]);
    }

    public function testSms(Request $request): JsonResponse
    {
        $data = $request->validate(['phone' => 'required|string', 'message' => 'nullable|string']);
        return response()->json(['success' => true, 'data' => ['message' => 'Test SMS would be sent to ' . $data['phone']]]);
    }

    public function getSecurityConfig(Request $request): JsonResponse
    {
        $config = SecurityConfig::first();
        return response()->json(['success' => true, 'data' => $config]);
    }

    public function updateSecurityConfig(Request $request): JsonResponse
    {
        $data = $request->validate([
            'requireEmailVerification' => 'sometimes|boolean',
            'enablePasswordReset' => 'sometimes|boolean',
            'enableOtpLogin' => 'sometimes|boolean',
            'enableSmsOtp' => 'sometimes|boolean',
            'passwordMinLength' => 'sometimes|integer|min:6',
            'passwordRequireNumber' => 'sometimes|boolean',
            'passwordRequireSpecialChar' => 'sometimes|boolean',
            'otpExpiryMinutes' => 'sometimes|integer|min:1',
            'maxLoginAttempts' => 'sometimes|integer|min:1',
            'lockoutMinutes' => 'sometimes|integer|min:1',
            'sessionExpiryMinutes' => 'sometimes|integer|min:1',
        ]);

        $payload = [];
        foreach ($data as $camel => $val) {
            $snake = Str::snake($camel);
            $payload[$snake] = $val;
        }

        $config = SecurityConfig::first();
        if ($config) {
            $config->update($payload);
        } else {
            $config = SecurityConfig::create(array_merge(['id' => Str::uuid()], $payload));
        }

        return response()->json(['success' => true, 'data' => $config]);
    }

    public function listBusinesses(Request $request): JsonResponse
    {
        $query = Business::with('user', 'activeSubscription.package');

        if ($request->filled('search')) {
            $q = $request->search;
            $query->where(function ($q2) use ($q) {
                $q2->where('name', 'like', "%$q%");
            });
        }

        $total = $query->count();
        $page = (int) $request->get('page', 1);
        $limit = (int) $request->get('limit', 20);
        $businesses = $query->orderByDesc('created_at')->skip(($page - 1) * $limit)->take($limit)->get();

        return response()->json([
            'success' => true,
            'data' => [
                'businesses' => $businesses->map(fn($b) => [
                    'id' => $b->id,
                    'name' => $b->name,
                    'currency' => $b->currency,
                    'country' => $b->country,
                    'createdAt' => $b->created_at,
                    'user' => ['id' => $b->user?->id, 'name' => $b->user?->name, 'email' => $b->user?->email],
                    'subscription' => $b->activeSubscription ? [
                        'status' => $b->activeSubscription->status,
                        'package' => ['name' => $b->activeSubscription->package?->name],
                    ] : null,
                ]),
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
            ],
        ]);
    }

    public function getBusinessDetails(Request $request, string $id): JsonResponse
    {
        $business = Business::with('user', 'subscriptions.package')->find($id);
        if (!$business) return response()->json(['success' => false, 'error' => 'Not found'], 404);

        return response()->json(['success' => true, 'data' => $business]);
    }

    public function listAuditLogs(Request $request): JsonResponse
    {
        $query = AuditLog::with('actor');

        if ($request->filled('actorId')) $query->where('actor_id', $request->actorId);
        if ($request->filled('action')) $query->where('action', $request->action);
        if ($request->filled('targetType')) $query->where('target_type', $request->targetType);

        $total = $query->count();
        $page = (int) $request->get('page', 1);
        $limit = (int) $request->get('limit', 20);
        $logs = $query->orderByDesc('created_at')->skip(($page - 1) * $limit)->take($limit)->get();

        return response()->json([
            'success' => true,
            'data' => ['logs' => $logs, 'total' => $total, 'page' => $page, 'limit' => $limit],
        ]);
    }

    public function listUsers(Request $request): JsonResponse
    {
        $query = User::query()->withCount('businesses');

        if ($request->filled('search')) {
            $q = $request->search;
            $query->where(function ($q2) use ($q) {
                $q2->where('name', 'like', "%$q%")->orWhere('email', 'like', "%$q%");
            });
        }
        if ($request->filled('role')) $query->where('role', $request->role);
        if ($request->filled('status')) $query->where('status', $request->status);

        $total = $query->count();
        $page = (int) $request->get('page', 1);
        $limit = (int) $request->get('limit', 20);
        $users = $query->orderByDesc('created_at')->skip(($page - 1) * $limit)->take($limit)->get();

        return response()->json([
            'success' => true,
            'data' => [
                'users' => $users->map(fn($u) => $this->formatAdminUser($u)),
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
            ],
        ]);
    }

    public function getUserDetails(Request $request, string $id): JsonResponse
    {
        $user = User::with('businesses')->find($id);
        if (!$user) return response()->json(['success' => false, 'error' => 'Not found'], 404);

        return response()->json(['success' => true, 'data' => $user]);
    }

    public function updateUserStatus(Request $request, string $id): JsonResponse
    {
        $data = $request->validate(['status' => 'required|in:ACTIVE,SUSPENDED']);
        $user = User::find($id);
        if (!$user) return response()->json(['success' => false, 'error' => 'Not found'], 404);
        if ($user->id === auth()->id() && $data['status'] === 'SUSPENDED') {
            return response()->json(['success' => false, 'error' => 'You cannot suspend your own account'], 400);
        }

        $user->update(['status' => $data['status']]);

        AuditService::log([
            'actor_id' => auth()->id(),
            'action' => 'USER_STATUS_UPDATED',
            'target_type' => 'User',
            'target_id' => $id,
            'details' => ['status' => $data['status']],
        ]);

        return response()->json(['success' => true, 'data' => $this->formatAdminUser($user->fresh()->loadCount('businesses'))]);
    }

    public function updateUserRole(Request $request, string $id): JsonResponse
    {
        $data = $request->validate(['role' => 'required|in:USER,SUPER_ADMIN']);
        $user = User::find($id);
        if (!$user) return response()->json(['success' => false, 'error' => 'Not found'], 404);
        if ($user->id === auth()->id() && $data['role'] !== 'SUPER_ADMIN') {
            return response()->json(['success' => false, 'error' => 'You cannot remove your own SUPER_ADMIN role'], 400);
        }

        $user->update(['role' => $data['role']]);

        AuditService::log([
            'actor_id' => auth()->id(),
            'action' => 'USER_ROLE_UPDATED',
            'target_type' => 'User',
            'target_id' => $id,
            'details' => ['role' => $data['role']],
        ]);

        return response()->json(['success' => true, 'data' => $this->formatAdminUser($user->fresh()->loadCount('businesses'))]);
    }

    public function deleteUser(Request $request, string $id): JsonResponse
    {
        $user = User::find($id);
        if (!$user) return response()->json(['success' => false, 'error' => 'Not found'], 404);
        if ($user->id === auth()->id()) return response()->json(['success' => false, 'error' => 'Cannot delete yourself'], 400);

        $user->delete();

        AuditService::log([
            'actor_id' => auth()->id(),
            'action' => 'USER_DELETED',
            'target_type' => 'User',
            'target_id' => $id,
        ]);

        return response()->json(['success' => true, 'data' => ['message' => 'User deleted']]);
    }

    private function formatAdminUser(User $u): array
    {
        return [
            'id' => $u->id,
            'name' => $u->name,
            'email' => $u->email,
            'phone' => $u->phone,
            'role' => $u->role,
            'status' => $u->status,
            'businessCount' => $u->businesses_count ?? $u->businesses()->count(),
            'emailVerifiedAt' => $u->email_verified_at,
            'lastLoginAt' => $u->last_login_at,
            'createdAt' => $u->created_at,
            'updatedAt' => $u->updated_at,
        ];
    }
}
