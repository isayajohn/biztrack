<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuthToken;
use App\Models\Business;
use App\Models\SecurityConfig;
use App\Models\LegalDocument;
use App\Models\User;
use App\Services\AuditService;
use App\Services\EmailService;
use App\Services\SmsService;
use GuzzleHttp\Client;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    public function __construct(private EmailService $emailService, private SmsService $smsService) {}

    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required_if:verificationMethod,EMAIL|nullable|email|max:255',
            'password' => 'required|string|min:8',
            'phone' => ['required_if:verificationMethod,PHONE', 'nullable', 'string', 'max:50', 'regex:/^\+?[0-9\s().-]{8,20}$/'],
            'verificationMethod' => 'required|in:EMAIL,PHONE',
            'onboardingIntent' => 'nullable|in:CREATE,JOIN',
            'termsAccepted' => 'required|accepted',
            'termsVersion' => 'required|string|max:50',
            'privacyVersion' => 'required|string|max:50',
        ]);

        $terms = LegalDocument::published()->where('type', 'TERMS')->first();
        $privacy = LegalDocument::published()->where('type', 'PRIVACY')->first();
        if (!$terms || !$privacy) {
            return response()->json(['success' => false, 'error' => 'Registration is temporarily unavailable because the legal documents are not published.'], 503);
        }
        if ($data['termsVersion'] !== $terms->version || $data['privacyVersion'] !== $privacy->version) {
            throw ValidationException::withMessages([
                'termsAccepted' => 'The Terms or Privacy Policy changed. Review the latest documents and try again.',
            ]);
        }

        $verificationMethod = strtoupper($data['verificationMethod']);
        $email = isset($data['email']) && trim($data['email']) !== '' ? strtolower(trim($data['email'])) : null;
        $normalizedPhone = !empty($data['phone']) ? $this->normalizePhone($data['phone']) : null;
        $onboardingIntent = strtoupper($data['onboardingIntent'] ?? 'CREATE');

        $existing = $verificationMethod === 'PHONE'
            ? User::where('phone', $normalizedPhone)->first()
            : User::where('email', $email)->first();

        if ($existing) {
            $verified = $existing->registration_verification_method === 'PHONE'
                ? (bool) $existing->phone_verified_at
                : (bool) $existing->email_verified_at;
            if (!$verified && $existing->registration_verification_method === $verificationMethod && Hash::check($data['password'], $existing->password_hash)) {
                $existing->update([
                    'onboarding_intent' => $onboardingIntent,
                    'terms_accepted_at' => $existing->terms_accepted_at ?? now(),
                    'terms_accepted_version' => $terms->version,
                    'privacy_accepted_at' => $existing->privacy_accepted_at ?? now(),
                    'privacy_accepted_version' => $privacy->version,
                ]);
                return $this->registrationResponse($existing->fresh(), false);
            }
            $field = $verificationMethod === 'PHONE' ? 'phone' : 'email';
            throw ValidationException::withMessages([$field => 'This '.$field.' is already registered. Sign in or use account recovery.']);
        }
        if ($email && User::where('email', $email)->exists()) {
            throw ValidationException::withMessages(['email' => 'This email is already registered.']);
        }
        if ($normalizedPhone && User::where('phone', $normalizedPhone)->exists()) {
            throw ValidationException::withMessages(['phone' => 'This phone number is already registered.']);
        }

        $requiresApproval = (bool) SecurityConfig::first()?->require_admin_approval;
        $user = User::create([
            'id' => Str::uuid(),
            'name' => trim($data['name']),
            'email' => $email,
            'phone' => $normalizedPhone,
            'password_hash' => Hash::make($data['password']),
            'role' => 'USER',
            'status' => 'ACTIVE',
            'approval_status' => $requiresApproval ? 'PENDING' : 'APPROVED',
            'approved_at' => $requiresApproval ? null : now(),
            'registration_verification_method' => $verificationMethod,
            'onboarding_intent' => $onboardingIntent,
            'terms_accepted_at' => now(),
            'terms_accepted_version' => $terms->version,
            'privacy_accepted_at' => now(),
            'privacy_accepted_version' => $privacy->version,
        ]);

        AuditService::log([
            'actor_id' => $user->id,
            'action' => 'USER_REGISTERED',
            'target_type' => 'User',
            'target_id' => $user->id,
        ]);

        return $this->registrationResponse($user, true);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'identifier' => 'required_without:email|nullable|string|max:255',
            'email' => 'required_without:identifier|nullable|string|max:255',
            'password' => 'required|string',
        ]);

        $identifier = trim((string) ($data['identifier'] ?? $data['email']));
        $user = str_contains($identifier, '@')
            ? User::where('email', strtolower($identifier))->first()
            : User::where('phone', $this->normalizePhone($identifier))->first();

        if (! $user) {
            return response()->json(['success' => false, 'error' => 'Invalid credentials'], 401);
        }

        $secConfig = SecurityConfig::first();
        $maxAttempts = $secConfig?->max_login_attempts ?? 5;
        $lockoutMinutes = $secConfig?->lockout_minutes ?? 15;

        if ($user->locked_until && now()->lt($user->locked_until)) {
            return response()->json(['success' => false, 'error' => 'Account temporarily locked'], 423);
        }

        if (! Hash::check($data['password'], $user->password_hash)) {
            $user->increment('failed_login_attempts');
            if ($user->failed_login_attempts >= $maxAttempts) {
                $user->update(['locked_until' => now()->addMinutes($lockoutMinutes)]);
            }

            return response()->json(['success' => false, 'error' => 'Invalid credentials'], 401);
        }

        if ($user->status !== 'ACTIVE') {
            return response()->json(['success' => false, 'error' => 'Account suspended'], 403);
        }

        if ($user->registration_verification_method === 'PHONE' && !$user->phone_verified_at) {
            return response()->json([
                'success' => false,
                'error' => 'Phone number not verified',
                'code' => 'PHONE_NOT_VERIFIED',
                'verificationId' => $user->id,
                'phoneNumberMasked' => $this->maskPhone((string) $user->phone),
            ], 403);
        }

        if (($user->registration_verification_method === 'EMAIL' || (!$user->registration_verification_method && $secConfig?->require_email_verification)) && ! $user->email_verified_at) {
            return response()->json([
                'success' => false,
                'error' => 'Email not verified',
                'code' => 'EMAIL_NOT_VERIFIED',
                'verificationId' => $user->id,
            ], 403);
        }

        if ($response = $this->approvalBlockedResponse($user)) {
            return $response;
        }

        $user->update([
            'failed_login_attempts' => 0,
            'locked_until' => null,
            'last_login_at' => now(),
        ]);

        $business = Business::forUser($user);
        $token = JWTAuth::fromUser($user);

        AuditService::log([
            'actor_id' => $user->id,
            'action' => 'USER_LOGIN',
            'target_type' => 'User',
            'target_id' => $user->id,
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $this->formatUser($user, $business),
                'token' => $token,
            ],
        ]);
    }

    public function googleAuth(Request $request): JsonResponse
    {
        // Accept both `credential` (Google One Tap) and `idToken`
        $data = $request->validate([
            'credential' => 'nullable|string',
            'idToken' => 'nullable|string',
        ]);

        $token = $data['credential'] ?? $data['idToken'] ?? null;
        if (! $token) {
            return response()->json(['success' => false, 'error' => 'Google token required'], 422);
        }

        try {
            $client = new Client(['timeout' => 10]);
            $response = $client->get('https://oauth2.googleapis.com/tokeninfo?id_token='.$token);
            $payload = json_decode($response->getBody(), true);

            if (($payload['aud'] ?? '') !== env('GOOGLE_CLIENT_ID')) {
                return response()->json(['success' => false, 'error' => 'Invalid Google token'], 401);
            }

            $email = strtolower($payload['email']);
            $name = $payload['name'] ?? $email;

            $user = User::where('email', $email)->first();

            if (! $user) {
                $requiresApproval = (bool) SecurityConfig::first()?->require_admin_approval;
                $user = User::create([
                    'id' => Str::uuid(),
                    'name' => $name,
                    'email' => $email,
                    'password_hash' => Hash::make(Str::random(32)),
                    'role' => 'USER',
                    'status' => 'ACTIVE',
                    'approval_status' => $requiresApproval ? 'PENDING' : 'APPROVED',
                    'approved_at' => $requiresApproval ? null : now(),
                    'email_verified_at' => now(),
                ]);

                AuditService::log([
                    'actor_id' => $user->id,
                    'action' => 'USER_REGISTERED_GOOGLE',
                    'target_type' => 'User',
                    'target_id' => $user->id,
                ]);
            }

            if ($user->status !== 'ACTIVE') {
                return response()->json(['success' => false, 'error' => 'Account suspended'], 403);
            }

            if ($response = $this->approvalBlockedResponse($user)) {
                return $response;
            }

            $user->update(['last_login_at' => now()]);
            $business = Business::forUser($user);
            $jwtToken = JWTAuth::fromUser($user);

            return response()->json([
                'success' => true,
                'data' => [
                    'user' => $this->formatUser($user, $business),
                    'token' => $jwtToken,
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'error' => 'Google authentication failed'], 401);
        }
    }

    public function sendVerificationEmail(Request $request): JsonResponse
    {
        $data = $request->validate([
            'verificationId' => 'required_without:email|nullable|uuid',
            'email' => 'required_without:verificationId|nullable|email',
        ]);
        $user = !empty($data['verificationId'])
            ? User::whereKey($data['verificationId'])->first()
            : User::where('email', strtolower($data['email']))->first();

        if (! $user || !$user->email || $user->registration_verification_method !== 'EMAIL' || $user->email_verified_at) {
            return response()->json(['success' => true, 'data' => ['message' => 'If the email exists, a verification link was sent.']]);
        }

        $this->sendEmailVerificationToken($user);

        return response()->json(['success' => true, 'data' => ['message' => 'Verification email sent.']]);
    }

    public function verifyEmail(Request $request): JsonResponse
    {
        $data = $request->validate(['token' => 'required|string']);

        $tokenHash = hash('sha256', $data['token']);
        $authToken = AuthToken::where('token_hash', $tokenHash)
            ->where('type', 'EMAIL_VERIFICATION')
            ->whereNull('used_at')
            ->where('expires_at', '>', now())
            ->first();

        if (! $authToken) {
            return response()->json(['success' => false, 'error' => 'Invalid or expired token'], 400);
        }

        $user = $authToken->user;
        $user->update([
            'email_verified_at' => now(),
            'email_verification_token_hash' => null,
            'email_verification_expires_at' => null,
        ]);
        $authToken->update(['used_at' => now()]);

        AuditService::log([
            'actor_id' => $user->id,
            'action' => 'EMAIL_VERIFIED',
            'target_type' => 'User',
            'target_id' => $user->id,
        ]);

        return $this->verificationAuthResponse($user);
    }

    public function verifyPhone(Request $request): JsonResponse
    {
        $data = $request->validate([
            'verificationId' => 'required_without_all:email,phone|nullable|uuid',
            'email' => 'required_without_all:verificationId,phone|nullable|email',
            'phone' => 'required_without_all:verificationId,email|nullable|string',
            'otp' => 'required|digits:6',
        ]);
        $user = $this->findVerificationUser($data);

        if (!$user || $user->registration_verification_method !== 'PHONE' || $user->phone_verified_at) {
            return response()->json(['success' => false, 'error' => 'Invalid verification request'], 422);
        }
        if (!$user->otp_code_hash || !$user->otp_expires_at || now()->gt($user->otp_expires_at) || !Hash::check($data['otp'], $user->otp_code_hash)) {
            return response()->json(['success' => false, 'error' => 'Invalid or expired verification code'], 422);
        }

        $user->update([
            'phone_verified_at' => now(),
            'otp_code_hash' => null,
            'otp_expires_at' => null,
        ]);
        AuditService::log([
            'actor_id' => $user->id,
            'action' => 'PHONE_VERIFIED',
            'target_type' => 'User',
            'target_id' => $user->id,
        ]);

        return $this->verificationAuthResponse($user);
    }

    public function resendPhoneVerification(Request $request): JsonResponse
    {
        $data = $request->validate([
            'verificationId' => 'required_without_all:email,phone|nullable|uuid',
            'email' => 'required_without_all:verificationId,phone|nullable|email',
            'phone' => 'required_without_all:verificationId,email|nullable|string',
        ]);
        $user = $this->findVerificationUser($data);
        $sent = false;
        if ($user && $user->registration_verification_method === 'PHONE' && !$user->phone_verified_at && $user->phone) {
            $sent = $this->sendPhoneVerificationOtp($user);
        }

        return response()->json(['success' => true, 'data' => [
            'message' => $sent ? 'A new verification code was sent.' : 'The verification code could not be sent. Check the SMS configuration and try again.',
            'sent' => $sent,
        ]]);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => 'required|email']);
        $user = User::where('email', strtolower($data['email']))->first();

        if ($user) {
            $rawToken = Str::random(64);
            $tokenHash = hash('sha256', $rawToken);

            AuthToken::where('user_id', $user->id)->where('type', 'PASSWORD_RESET')->delete();

            AuthToken::create([
                'id' => Str::uuid(),
                'user_id' => $user->id,
                'type' => 'PASSWORD_RESET',
                'token_hash' => $tokenHash,
                'expires_at' => now()->addHour(),
                'created_at' => now(),
            ]);

            $user->update([
                'password_reset_token_hash' => $tokenHash,
                'password_reset_expires_at' => now()->addHour(),
            ]);

            $resetUrl = rtrim((string) config('app.frontend_url'), '/').'/reset-password?token='.$rawToken;
            $this->emailService->sendFromTemplate('PASSWORD_RESET', $user->email, $user->name, [
                'name' => $user->name,
                'resetUrl' => $resetUrl,
                'token' => $rawToken,
            ]);
        }

        return response()->json(['success' => true, 'data' => ['message' => 'If the email exists, a reset link was sent.']]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => 'required|string',
            'password' => 'required|string|min:8',
        ]);

        $tokenHash = hash('sha256', $data['token']);
        $authToken = AuthToken::where('token_hash', $tokenHash)
            ->where('type', 'PASSWORD_RESET')
            ->whereNull('used_at')
            ->where('expires_at', '>', now())
            ->first();

        if (! $authToken) {
            return response()->json(['success' => false, 'error' => 'Invalid or expired token'], 400);
        }

        $user = $authToken->user;
        $user->update([
            'password_hash' => Hash::make($data['password']),
            'password_reset_token_hash' => null,
            'password_reset_expires_at' => null,
            'failed_login_attempts' => 0,
            'locked_until' => null,
        ]);
        $authToken->update(['used_at' => now()]);

        AuditService::log([
            'actor_id' => $user->id,
            'action' => 'PASSWORD_RESET',
            'target_type' => 'User',
            'target_id' => $user->id,
        ]);

        return response()->json(['success' => true, 'data' => ['message' => 'Password reset successfully.']]);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $user = auth()->user();
        $data = $request->validate([
            'currentPassword' => 'required|string',
            'newPassword' => 'required|string|min:8',
        ]);

        if (! Hash::check($data['currentPassword'], $user->password_hash)) {
            return response()->json(['success' => false, 'error' => 'Current password is incorrect'], 400);
        }

        $user->update(['password_hash' => Hash::make($data['newPassword'])]);

        AuditService::log([
            'actor_id' => $user->id,
            'action' => 'PASSWORD_CHANGED',
            'target_type' => 'User',
            'target_id' => $user->id,
        ]);

        return response()->json(['success' => true, 'data' => ['message' => 'Password changed successfully.']]);
    }

    public function requestLoginOtp(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => 'required|email']);
        $user = User::where('email', strtolower($data['email']))->first();

        if (! $user) {
            return response()->json(['success' => true, 'data' => ['message' => 'OTP sent if account exists.']]);
        }

        if (($user->registration_verification_method === 'EMAIL' && !$user->email_verified_at)
            || ($user->registration_verification_method === 'PHONE' && !$user->phone_verified_at)
            || $user->status !== 'ACTIVE'
            || !$user->isApproved()) {
            return response()->json(['success' => true, 'data' => ['message' => 'OTP sent if account exists.']]);
        }

        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $otpHash = Hash::make($otp);

        $user->update([
            'otp_code_hash' => $otpHash,
            'otp_expires_at' => now()->addMinutes(10),
        ]);

        $this->emailService->sendFromTemplate('OTP_CODE', $user->email, $user->name, [
            'name' => $user->name,
            'otp' => $otp,
        ]);

        return response()->json(['success' => true, 'data' => ['message' => 'OTP sent if account exists.']]);
    }

    public function verifyOtpLogin(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => 'required|email',
            'otp' => 'required|string',
        ]);

        $user = User::where('email', strtolower($data['email']))->first();

        if (! $user || ! $user->otp_code_hash || ! $user->otp_expires_at || now()->gt($user->otp_expires_at)) {
            return response()->json(['success' => false, 'error' => 'Invalid or expired OTP'], 401);
        }

        if (! Hash::check($data['otp'], $user->otp_code_hash)) {
            return response()->json(['success' => false, 'error' => 'Invalid or expired OTP'], 401);
        }

        if ($user->status !== 'ACTIVE') {
            return response()->json(['success' => false, 'error' => 'Account suspended'], 403);
        }
        if (($user->registration_verification_method === 'EMAIL' && !$user->email_verified_at)
            || ($user->registration_verification_method === 'PHONE' && !$user->phone_verified_at)) {
            return response()->json(['success' => false, 'error' => 'Account verification required'], 403);
        }
        if ($response = $this->approvalBlockedResponse($user)) {
            return $response;
        }

        $user->update([
            'otp_code_hash' => null,
            'otp_expires_at' => null,
            'last_login_at' => now(),
        ]);

        $business = Business::forUser($user);
        $token = JWTAuth::fromUser($user);

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $this->formatUser($user, $business),
                'token' => $token,
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = auth()->user();
        $business = Business::forUser($user);

        return response()->json([
            'success' => true,
            'data' => ['user' => $this->formatUser($user, $business)],
        ]);
    }

    private function sendEmailVerificationToken(User $user): bool
    {
        if (!$user->email) return false;
        $rawToken = Str::random(64);
        $tokenHash = hash('sha256', $rawToken);

        AuthToken::where('user_id', $user->id)->where('type', 'EMAIL_VERIFICATION')->delete();

        AuthToken::create([
            'id' => Str::uuid(),
            'user_id' => $user->id,
            'type' => 'EMAIL_VERIFICATION',
            'token_hash' => $tokenHash,
            'expires_at' => now()->addDay(),
            'created_at' => now(),
        ]);

        $user->update([
            'email_verification_token_hash' => $tokenHash,
            'email_verification_expires_at' => now()->addDay(),
        ]);

        $verifyUrl = rtrim((string) config('app.frontend_url'), '/').'/verify-email?token='.$rawToken;
        return $this->emailService->sendFromTemplate('EMAIL_VERIFICATION', $user->email, $user->name, [
            'name' => $user->name,
            'verifyUrl' => $verifyUrl,
            'token' => $rawToken,
        ]);
    }

    private function sendPhoneVerificationOtp(User $user): bool
    {
        if (!$user->phone) return false;
        $minutes = SecurityConfig::first()?->otp_expiry_minutes ?? 10;
        $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $user->update([
            'otp_code_hash' => Hash::make($otp),
            'otp_expires_at' => now()->addMinutes($minutes),
        ]);

        return $this->smsService->sendFromTemplate('OTP_CODE', $user->phone, [
            'name' => $user->name,
            'code' => $otp,
            'otp' => $otp,
            'expiresIn' => $minutes.' minutes',
            'business_name' => 'BizTrack',
        ]);
    }

    private function maskPhone(string $phone): string
    {
        $length = strlen($phone);
        if ($length <= 4) return str_repeat('*', $length);
        return substr($phone, 0, 3).str_repeat('*', max(3, $length - 6)).substr($phone, -3);
    }

    private function maskEmail(?string $email): ?string
    {
        if (!$email) return null;
        [$name, $domain] = array_pad(explode('@', $email, 2), 2, '');
        $visible = substr($name, 0, min(2, strlen($name)));
        return $visible.str_repeat('*', max(3, strlen($name) - strlen($visible))).'@'.$domain;
    }

    private function normalizePhone(string $phone): string
    {
        $digits = preg_replace('/\D+/', '', trim($phone)) ?: '';
        if (Str::startsWith($digits, '00')) $digits = substr($digits, 2);
        if (strlen($digits) === 10 && Str::startsWith($digits, '0')) {
            $digits = '255'.substr($digits, 1);
        }
        if (strlen($digits) < 10 || strlen($digits) > 15) {
            throw ValidationException::withMessages(['phone' => 'Enter a valid phone number including the country code.']);
        }
        return '+'.$digits;
    }

    private function findVerificationUser(array $data): ?User
    {
        if (!empty($data['verificationId'])) return User::whereKey($data['verificationId'])->first();
        if (!empty($data['email'])) return User::where('email', strtolower($data['email']))->first();
        if (!empty($data['phone'])) return User::where('phone', $this->normalizePhone($data['phone']))->first();
        return null;
    }

    private function registrationResponse(User $user, bool $created): JsonResponse
    {
        $emailSent = false;
        $otpSent = false;
        if ($user->registration_verification_method === 'EMAIL') {
            $emailSent = $this->sendEmailVerificationToken($user);
        } else {
            $otpSent = $this->sendPhoneVerificationOtp($user);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $this->formatUser($user, null),
                'token' => null,
                'verificationId' => $user->id,
                'requiresVerification' => true,
                'requiresEmailVerification' => $user->registration_verification_method === 'EMAIL',
                'verificationMethod' => $user->registration_verification_method,
                'verificationEmailSent' => $emailSent,
                'verificationOtpSent' => $otpSent,
                'emailAddressMasked' => $this->maskEmail($user->email),
                'phoneNumberMasked' => $user->phone ? $this->maskPhone($user->phone) : null,
                'onboardingIntent' => $user->onboarding_intent ?? 'CREATE',
                'requiresApproval' => $user->approval_status !== 'APPROVED',
                'approvalStatus' => $user->approval_status,
            ],
        ], $created ? 201 : 200);
    }

    private function formatUser(User $user, ?Business $business = null): array
    {
        $membership = $business?->memberships()->where('user_id', $user->id)->with('branch')->first();

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'onboardingIntent' => $user->onboarding_intent ?? 'CREATE',
            'requiresOnboarding' => !$business,
            'phone' => $user->phone,
            'role' => $user->role,
            'status' => $user->status,
            'approvalStatus' => $user->approval_status,
            'approvedAt' => $user->approved_at,
            'rejectionReason' => $user->rejection_reason,
            'businessRole' => $membership?->role ?? ($business?->user_id === $user->id ? 'OWNER' : null),
            'permissions' => $membership?->permissions ?? ($business?->user_id === $user->id ? ['*'] : []),
            'branch' => $membership?->branch ? ['id' => $membership->branch->id, 'name' => $membership->branch->name] : null,
            'emailVerifiedAt' => $user->email_verified_at,
            'phoneVerifiedAt' => $user->phone_verified_at,
            'verificationMethod' => $user->registration_verification_method,
            'lastLoginAt' => $user->last_login_at,
            'createdAt' => $user->created_at,
            'business' => $business ? [
                'id' => $business->id,
                'name' => $business->name,
                'currency' => $business->currency,
                'country' => $business->country,
            ] : null,
            'businesses' => $business ? [[
                'id' => $business->id,
                'name' => $business->name,
                'currency' => $business->currency,
                'country' => $business->country,
            ]] : [],
        ];
    }

    private function verificationAuthResponse(User $user): JsonResponse
    {
        $business = Business::forUser($user);
        $approved = $user->isApproved();

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $this->formatUser($user, $business),
                'token' => $approved ? JWTAuth::fromUser($user) : null,
                'requiresApproval' => !$approved,
                'approvalStatus' => $user->approval_status,
                'message' => $approved
                    ? 'Account verified successfully.'
                    : ($user->approval_status === 'REJECTED'
                        ? 'Your email is verified, but the account was not approved. Contact support.'
                        : 'Your account is verified and waiting for super-admin approval.'),
            ],
        ]);
    }

    private function approvalBlockedResponse(User $user): ?JsonResponse
    {
        if ($user->isApproved()) {
            return null;
        }

        $rejected = $user->approval_status === 'REJECTED';
        return response()->json([
            'success' => false,
            'error' => $rejected
                ? 'Account approval was rejected. Contact support for assistance.'
                : 'Account verified and waiting for super-admin approval.',
            'code' => $rejected ? 'ACCOUNT_REJECTED' : 'ACCOUNT_PENDING_APPROVAL',
            'approvalStatus' => $user->approval_status,
            'rejectionReason' => $rejected ? $user->rejection_reason : null,
        ], 403);
    }
}
