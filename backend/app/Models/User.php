<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Tymon\JWTAuth\Contracts\JWTSubject;
use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable implements JWTSubject
{
    use HasUuids, HasFactory;

    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'name', 'email', 'phone', 'password_hash', 'role', 'status',
        'approval_status', 'approved_at', 'approved_by', 'rejected_at',
        'rejected_by', 'rejection_reason',
        'email_verified_at', 'phone_verified_at', 'registration_verification_method',
        'onboarding_intent', 'terms_accepted_at', 'terms_accepted_version',
        'privacy_accepted_at', 'privacy_accepted_version',
        'email_verification_token_hash', 'email_verification_expires_at',
        'password_reset_token_hash', 'password_reset_expires_at',
        'otp_code_hash', 'otp_login_token_hash', 'otp_expires_at',
        'failed_login_attempts', 'locked_until', 'last_login_at',
    ];

    protected $hidden = ['password_hash', 'email_verification_token_hash', 'password_reset_token_hash', 'otp_code_hash', 'otp_login_token_hash'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'phone_verified_at' => 'datetime',
        'email_verification_expires_at' => 'datetime',
        'password_reset_expires_at' => 'datetime',
        'otp_expires_at' => 'datetime',
        'terms_accepted_at' => 'datetime',
        'privacy_accepted_at' => 'datetime',
        'locked_until' => 'datetime',
        'last_login_at' => 'datetime',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
    ];

    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return [];
    }

    public function businesses()
    {
        return $this->hasMany(Business::class);
    }

    public function businessMemberships() { return $this->hasMany(BusinessMembership::class); }

    public function authTokens()
    {
        return $this->hasMany(AuthToken::class);
    }

    public function auditLogs()
    {
        return $this->hasMany(AuditLog::class, 'actor_id');
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === 'SUPER_ADMIN';
    }

    public function isActive(): bool
    {
        return $this->status === 'ACTIVE';
    }

    public function isApproved(): bool
    {
        return $this->approval_status === 'APPROVED';
    }
}
