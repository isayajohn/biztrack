<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuthToken;
use App\Models\Business;
use App\Models\SecurityConfig;
use App\Models\User;
use App\Services\AuditService;
use App\Services\EmailService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tymon\JWTAuth\Facades\JWTAuth;
use GuzzleHttp\Client;

class AuthController extends Controller
{
    public function __construct(private EmailService $emailService) {}

    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'phone' => 'nullable|string',
            'businessName' => 'nullable|string|max:255',
            'currency' => 'nullable|string',
            'country' => 'nullable|string',
            'packageId' => 'nullable|string',
        ]);

        $secConfig = SecurityConfig::first();
        $requireEmailVerification = $secConfig?->require_email_verification ?? false;

        $user = User::create([
            'id' => Str::uuid(),
            'name' => $data['name'],
            'email' => strtolower($data['email']),
            'phone' => $data['phone'] ?? null,
            'password_hash' => Hash::make($data['password']),
            'role' => 'USER',
            'status' => 'ACTIVE',
        ]);

        // Create business if businessName provided
        $business = null;
        if (!empty($data['businessName'])) {
            $business = Business::create([
                'id' => Str::uuid(),
                'user_id' => $user->id,
                'name' => $data['businessName'],
                'currency' => strtoupper($data['currency'] ?? 'TZS'),
                'country' => $data['country'] ?? 'Tanzania',
            ]);
        }

        if ($requireEmailVerification) {
            $this->sendEmailVerificationToken($user);
        }

        AuditService::log([
            'actor_id' => $user->id,
            'action' => 'USER_REGISTERED',
            'target_type' => 'User',
            'target_id' => $user->id,
        ]);

        $token = JWTAuth::fromUser($user);

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $this->formatUser($user, $business),
                'token' => $token,
                'requiresEmailVerification' => $requireEmailVerification,
                'verificationEmailSent' => $requireEmailVerification,
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

        if (!$user) {
            return response()->json(['success' => false, 'error' => 'Invalid credentials'], 401);
        }

        $secConfig = SecurityConfig::first();
        $maxAttempts = $secConfig?->max_login_attempts ?? 5;
        $lockoutMinutes = $secConfig?->lockout_minutes ?? 15;

        if ($user->locked_until && now()->lt($user->locked_until)) {
            return response()->json(['success' => false, 'error' => 'Account temporarily locked'], 423);
        }

        if (!Hash::check($data['password'], $user->password_hash)) {
            $user->increment('failed_login_attempts');
            if ($user->failed_login_attempts >= $maxAttempts) {
                $user->update(['locked_until' => now()->addMinutes($lockoutMinutes)]);
            }
            return response()->json(['success' => false, 'error' => 'Invalid credentials'], 401);
        }

        if ($user->status !== 'ACTIVE') {
            return response()->json(['success' => false, 'error' => 'Account suspended'], 403);
        }

        if ($secConfig?->require_email_verification && !$user->email_verified_at) {
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
        if (!$token) {
            return response()->json(['success' => false, 'error' => 'Google token required'], 422);
        }

        try {
            $client = new Client(['timeout' => 10]);
            $response = $client->get('https://oauth2.googleapis.com/tokeninfo?id_token=' . $token);
            $payload = json_decode($response->getBody(), true);

            if (($payload['aud'] ?? '') !== env('GOOGLE_CLIENT_ID')) {
                return response()->json(['success' => false, 'error' => 'Invalid Google token'], 401);
            }

            $email = strtolower($payload['email']);
            $name = $payload['name'] ?? $email;

            $user = User::where('email', $email)->first();

            if (!$user) {
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

        if (!$user || $user->email_verified_at) {
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

        if (!$authToken) {
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

            $resetUrl = env('FRONTEND_URL', 'http://127.0.0.1:5173') . '/reset-password?token=' . $rawToken;
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

        if (!$authToken) {
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

        if (!Hash::check($data['currentPassword'], $user->password_hash)) {
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

        if (!$user) {
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

        if (!$user || !$user->otp_code_hash || !$user->otp_expires_at || now()->gt($user->otp_expires_at)) {
            return response()->json(['success' => false, 'error' => 'Invalid or expired OTP'], 401);
        }

        if (!Hash::check($data['otp'], $user->otp_code_hash)) {
            return response()->json(['success' => false, 'error' => 'Invalid or expired OTP'], 401);
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

    private function sendEmailVerificationToken(User $user): void
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

        $verifyUrl = env('FRONTEND_URL', 'http://127.0.0.1:5173') . '/verify-email?token=' . $rawToken;
        $this->emailService->sendFromTemplate('EMAIL_VERIFICATION', $user->email, $user->name, [
            'name' => $user->name,
            'verifyUrl' => $verifyUrl,
            'token' => $rawToken,
        ]);
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
