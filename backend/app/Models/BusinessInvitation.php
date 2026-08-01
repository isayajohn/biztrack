<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class BusinessInvitation extends Model
{
    use HasUuids;

    protected $fillable = [
        'business_id', 'branch_id', 'created_by', 'accepted_by', 'email',
        'code_hash', 'code_prefix', 'role', 'permissions', 'status',
        'expires_at', 'accepted_at',
    ];

    protected $hidden = ['code_hash'];

    protected $casts = [
        'permissions' => 'array',
        'expires_at' => 'datetime',
        'accepted_at' => 'datetime',
    ];

    public static function normalizeCode(string $code): string
    {
        return strtoupper((string) preg_replace('/[^A-Za-z0-9]/', '', trim($code)));
    }

    public static function hashCode(string $code): string
    {
        return hash('sha256', static::normalizeCode($code));
    }

    public function isAvailable(): bool
    {
        return $this->status === 'ACTIVE' && $this->expires_at->isFuture();
    }

    public function business() { return $this->belongsTo(Business::class); }
    public function branch() { return $this->belongsTo(Branch::class); }
    public function creator() { return $this->belongsTo(User::class, 'created_by'); }
    public function acceptedBy() { return $this->belongsTo(User::class, 'accepted_by'); }
}
