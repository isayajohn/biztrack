<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class SecurityConfig extends Model
{
    use HasUuids;

    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'require_email_verification', 'enable_password_reset', 'enable_otp_login',
        'enable_sms_otp', 'password_min_length', 'password_require_number',
        'password_require_special_char', 'otp_expiry_minutes', 'max_login_attempts',
        'lockout_minutes', 'session_expiry_minutes',
    ];

    protected $casts = [
        'require_email_verification' => 'boolean',
        'enable_password_reset' => 'boolean',
        'enable_otp_login' => 'boolean',
        'enable_sms_otp' => 'boolean',
        'password_require_number' => 'boolean',
        'password_require_special_char' => 'boolean',
    ];
}
