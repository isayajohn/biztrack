<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SecurityConfig;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SecurityConfigController extends Controller
{
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
            $payload[Str::snake($camel)] = $val;
        }

        $config = SecurityConfig::first();
        if ($config) {
            $config->update($payload);
        } else {
            $config = SecurityConfig::create(array_merge(['id' => Str::uuid()], $payload));
        }

        return response()->json(['success' => true, 'data' => $config]);
    }
}
