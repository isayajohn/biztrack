<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Str;

class AuditService
{
    public static function log(array $data): void
    {
        AuditLog::create([
            'id' => Str::uuid(),
            'actor_id' => $data['actor_id'] ?? null,
            'action' => $data['action'],
            'target_type' => $data['target_type'],
            'target_id' => $data['target_id'] ?? null,
            'metadata' => $data['metadata'] ?? null,
            'target_user_id' => $data['target_user_id'] ?? null,
            'details' => $data['details'] ?? null,
            'created_at' => now(),
        ]);
    }
}
