<?php

namespace App\Models\Concerns;

use App\Models\Business;
use Illuminate\Database\Eloquent\Builder;

trait BelongsToActiveBranch
{
    protected static function bootBelongsToActiveBranch(): void
    {
        static::addGlobalScope('active_branch', function (Builder $builder) {
            $user = auth()->user();
            if (!$user || $user->isSuperAdmin()) return;
            $business = Business::forUser($user);
            $branchId = $business?->branchIdForUser($user, request()->header('X-Branch-Id'));
            if ($branchId) $builder->where($builder->qualifyColumn('branch_id'), $branchId);
        });
    }
}
