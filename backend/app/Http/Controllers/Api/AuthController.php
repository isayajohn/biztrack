<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuthToken;
use App\Models\Branch;
use App\Models\Business;
use App\Models\BusinessInvitation;
use App\Models\BusinessMembership;
use App\Models\BusinessSubscription;
use App\Models\Package;
use App\Models\SecurityConfig;
use App\Models\User;
use App\Services\AuditService;
use App\Services\EmailService;
use App\Services\SmsService;
use GuzzleHttp\Client;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
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
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'phone' => ['required_if:verificationMethod,PHONE', 'nullable', 'string', 'max:50', 'regex:/^\+?[0-9\s().-]{8,20}$/'],
            'businessName' => 'nullable|string|max:255',
            'currency' => 'nullable|string',
            'country' => 'nullable|string',
            'packageId' => 'nullable|string',
            'invitationCode' => 'nullable|string|min:6|max:40',
            'verificationMethod' => 'nullable|in:EMAIL,PHONE',
        ]);

        $verificationMethod = strtoupper($data['verificationMethod'] ?? 'EMAIL');
        $normalizedPhone = isset($data['phone'])
            ? preg_replace('/[^0-9+]/', '', trim($data['phone']))
            : null;
        if ($normalizedPhone && User::where('phone', $normalizedPhone)->exists()) {
            throw ValidationException::withMessages(['phone' => 'This phone number is already registered.']);
        }
        [$user, $business] = DB::transaction(function () use ($data, $verificationMethod, $normalizedPhone) {
            $email = strtolower($data['email']);
            $invitation = null;

            if (!empty($data['invitationCode'])) {
                $invitation = BusinessInvitation::where('code_hash', BusinessInvitation::hashCode($data['invitationCode']))
                    ->lockForUpdate()
                    ->first();

                if (!$invitation || !$invitation->isAvailable()) {
                    throw ValidationException::withMessages(['invitationCode' => 'This invitation code is invalid or has expired.']);
                }
                if ($invitation->email && strtolower($invitation->email) !== $email) {
                    throw ValidationException::withMessages(['invitationCode' => 'This invitation was issued for a different email address.']);
                }
            }

            $user = User::create([
                'id' => Str::uuid(),
                'name' => $data['name'],
                'email' => $email,
                'phone' => $normalizedPhone,
                'password_hash' => Hash::make($data['password']),
                'role' => 'USER',
                'status' => 'ACTIVE',
                'registration_verification_method' => $verificationMethod,
            ]);

            if ($invitation) {
                $business = $invitation->business()->firstOrFail();
                BusinessMembership::create([
                    'business_id' => $business->id,
                    'user_id' => $user->id,
                    'branch_id' => $invitation->branch_id,
                    'role' => $invitation->role,
                    'permissions' => $invitation->permissions ?? [],
                    'status' => 'ACTIVE',
                ]);
                $invitation->update([
                    'status' => 'ACCEPTED',
                    'accepted_by' => $user->id,
                    'accepted_at' => now(),
                ]);
            } else {
                $business = null;
                if (!empty($data['businessName'])) {
                    $business = Business::create([
                        'id' => Str::uuid(),
                        'user_id' => $user->id,
                        'name' => $data['businessName'],
                        'currency' => strtoupper($data['currency'] ?? 'TZS'),
                        'country' => $data['country'] ?? 'Tanzania',
                    ]);

                    $branch = Branch::create([
                        'business_id' => $business->id,
                        'name' => 'Main Branch',
                        'code' => 'MAIN',
                        'is_default' => true,
                        'is_active' => true,
                    ]);
                    BusinessMembership::create([
                        'business_id' => $business->id,
                        'user_id' => $user->id,
                        'branch_id' => $branch->id,
                        'role' => 'OWNER',
                        'permissions' => ['*'],
                        'status' => 'ACTIVE',
                    ]);

                    $freePackage = Package::where('status', 'ACTIVE')
                        ->where(fn ($query) => $query->where('slug', 'free')->orWhere('price_monthly', 0))
                        ->orderByRaw("CASE WHEN slug = 'free' THEN 0 ELSE 1 END")
                        ->orderBy('sort_order')
                        ->first();

                    if ($freePackage) {
                        BusinessSubscription::create([
                            'id' => Str::uuid(),
                            'business_id' => $business->id,
                            'package_id' => $freePackage->id,
                            'status' => 'ACTIVE',
                            'billing_cycle' => 'LIFETIME',
                            'starts_at' => now(),
                            'notes' => 'Automatically assigned during registration.',
                        ]);
                    }
                }
            }

            return [$user, $business];
        });

        $verificationEmailSent = false;
        $verificationOtpSent = false;
        if ($verificationMethod === 'EMAIL') {
            $verificationEmailSent = $this->sendEmailVerificationToken($user);
        } else {
            $verificationOtpSent = $this->sendPhoneVerificationOtp($user);
        }

        AuditService::log([
            'actor_id' => $user->id,
            'action' => 'USER_REGISTERED',
            'target_type' => 'User',
            'target_id' => $user->id,
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $this->formatUser($user, $business),
                'token' => null,
                'requiresVerification' => true,
                'requiresEmailVerification' => $verificationMethod === 'EMAIL',
                'verificationMethod' => $verificationMethod,
                'verificationEmailSent' => $verificationEmailSent,
                'verificationOtpSent' => $verificationOtpSent,
                'phoneNumberMasked' => $verificationMethod === 'PHONE' ? $this->maskPhone((string) $user->phone) : null,
            ],
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', strtolower($data['email']))->first();

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
            ], 403);
        }

        if (($user->registration_verification_method === 'EMAIL' || (!$user->registration_verification_method && $secConfig?->require_email_verification)) && ! $user->email_verified_at) {
            return response()->json([
                'success' => false,
                'error' => 'Email not verified',
                'code' => 'EMAIL_NOT_VERIFIED',
            ], 403);
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
                $user = User::create([
                    'id' => Str::uuid(),
                    'name' => $name,
                    'email' => $email,
                    'password_hash' => Hash::make(Str::random(32)),
                    'role' => 'USER',
                    'status' => 'ACTIVE',
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
        $data = $request->validate(['email' => 'required|email']);
        $user = User::where('email', strtolower($data['email']))->first();

        if (! $user || $user->email_verified_at) {
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

    public function verifyPhone(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => 'required|email',
            'otp' => 'required|digits:6',
        ]);
        $user = User::where('email', strtolower($data['email']))->first();

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

        $business = Business::forUser($user);
        $token = JWTAuth::fromUser($user);
        return response()->json(['success' => true, 'data' => [
            'user' => $this->formatUser($user, $business),
            'token' => $token,
        ]]);
    }

    public function resendPhoneVerification(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => 'required|email']);
        $user = User::where('email', strtolower($data['email']))->first();
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
            || $user->status !== 'ACTIVE') {
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

    private function formatUser(User $user, ?Business $business = null): array
    {
        $membership = $business?->memberships()->where('user_id', $user->id)->with('branch')->first();

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role,
            'status' => $user->status,
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
}
