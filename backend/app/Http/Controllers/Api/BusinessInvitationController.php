<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\BusinessInvitation;
use App\Models\BusinessMembership;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BusinessInvitationController extends Controller
{
    public function accept(Request $request): JsonResponse
    {
        $user = auth()->user();
        $data = $request->validate(['code' => 'required|string|min:6|max:40']);

        if (($user->registration_verification_method === 'EMAIL' && !$user->email_verified_at)
            || ($user->registration_verification_method === 'PHONE' && !$user->phone_verified_at)) {
            return response()->json(['success' => false, 'error' => 'Verify your account before joining a workspace.'], 403);
        }
        if (Business::forUser($user)) {
            return response()->json(['success' => false, 'error' => 'This account already belongs to a business workspace.'], 409);
        }

        $business = DB::transaction(function () use ($data, $user) {
            $invitation = BusinessInvitation::where('code_hash', BusinessInvitation::hashCode($data['code']))
                ->lockForUpdate()
                ->first();
            if (!$invitation || !$invitation->isAvailable()) {
                throw \Illuminate\Validation\ValidationException::withMessages(['code' => 'This invitation code is invalid or has expired.']);
            }
            if ($invitation->email && strtolower($invitation->email) !== strtolower((string) $user->email)) {
                throw \Illuminate\Validation\ValidationException::withMessages(['code' => 'This invitation was issued for a different email address.']);
            }

            BusinessMembership::create([
                'business_id' => $invitation->business_id,
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

            return $invitation->business()->firstOrFail();
        });

        AuditService::log([
            'actor_id' => $user->id,
            'action' => 'BUSINESS_INVITATION_ACCEPTED',
            'target_type' => 'Business',
            'target_id' => $business->id,
        ]);

        return response()->json(['success' => true, 'data' => [
            'business' => ['id' => $business->id, 'name' => $business->name, 'currency' => $business->currency, 'country' => $business->country],
        ]]);
    }

    public function validateCode(Request $request): JsonResponse
    {
        $data = $request->validate(['code' => 'required|string|min:6|max:40']);
        $invitation = BusinessInvitation::with(['business:id,name', 'branch:id,name'])
            ->where('code_hash', BusinessInvitation::hashCode($data['code']))
            ->first();

        if (!$invitation || !$invitation->isAvailable()) {
            return response()->json(['success' => false, 'error' => 'This invitation code is invalid or has expired.'], 422);
        }

        return response()->json(['success' => true, 'data' => $this->format($invitation, false)]);
    }

    public function index(): JsonResponse
    {
        $business = Business::forUser(auth()->user());
        if (!$business) return response()->json(['success' => false, 'error' => 'Business not found'], 404);

        $invitations = $business->invitations()
            ->with(['branch:id,name', 'acceptedBy:id,name,email'])
            ->latest()
            ->limit(100)
            ->get()
            ->map(fn (BusinessInvitation $invitation) => $this->format($invitation));

        return response()->json(['success' => true, 'data' => ['invitations' => $invitations]]);
    }

    public function store(Request $request): JsonResponse
    {
        $business = Business::forUser(auth()->user());
        if (!$business) return response()->json(['success' => false, 'error' => 'Business not found'], 404);

        $data = $request->validate([
            'email' => 'nullable|email|max:255',
            'role' => 'required|in:MANAGER,CASHIER,INVENTORY,ACCOUNTANT,CUSTOM',
            'branchId' => 'nullable|uuid',
            'permissions' => 'nullable|array',
            'permissions.*' => 'in:'.implode(',', StaffController::PERMISSIONS),
            'expiresInDays' => 'nullable|integer|min:1|max:30',
        ]);

        if (!empty($data['branchId']) && !$business->branches()->whereKey($data['branchId'])->exists()) {
            return response()->json(['success' => false, 'error' => 'Branch not found for this business'], 422);
        }

        do {
            $plainCode = 'BIZ-'.strtoupper(Str::random(4)).'-'.strtoupper(Str::random(4));
            $codeHash = BusinessInvitation::hashCode($plainCode);
        } while (BusinessInvitation::where('code_hash', $codeHash)->exists());

        $invitation = BusinessInvitation::create([
            'business_id' => $business->id,
            'branch_id' => $data['branchId'] ?? null,
            'created_by' => auth()->id(),
            'email' => isset($data['email']) ? strtolower($data['email']) : null,
            'code_hash' => $codeHash,
            'code_prefix' => substr($plainCode, 0, 6).'…',
            'role' => $data['role'],
            'permissions' => StaffController::permissionsForRole($data['role'], $data['permissions'] ?? []),
            'status' => 'ACTIVE',
            'expires_at' => now()->addDays($data['expiresInDays'] ?? 7),
        ]);

        AuditService::log([
            'actor_id' => auth()->id(),
            'action' => 'BUSINESS_INVITATION_CREATED',
            'target_type' => 'BusinessInvitation',
            'target_id' => $invitation->id,
        ]);

        return response()->json([
            'success' => true,
            'data' => array_merge($this->format($invitation->load('branch')), ['code' => $plainCode]),
        ], 201);
    }

    public function destroy(string $id): JsonResponse
    {
        $business = Business::forUser(auth()->user());
        $invitation = $business?->invitations()->whereKey($id)->first();
        if (!$invitation) return response()->json(['success' => false, 'error' => 'Invitation not found'], 404);
        if ($invitation->status !== 'ACTIVE') return response()->json(['success' => false, 'error' => 'Only active invitations can be revoked'], 422);

        $invitation->update(['status' => 'REVOKED']);
        AuditService::log([
            'actor_id' => auth()->id(),
            'action' => 'BUSINESS_INVITATION_REVOKED',
            'target_type' => 'BusinessInvitation',
            'target_id' => $invitation->id,
        ]);

        return response()->json(['success' => true, 'data' => ['message' => 'Invitation revoked.']]);
    }

    private function format(BusinessInvitation $invitation, bool $includePrivate = true): array
    {
        $status = $invitation->status;
        if ($status === 'ACTIVE' && $invitation->expires_at->isPast()) $status = 'EXPIRED';

        return array_filter([
            'id' => $invitation->id,
            'businessName' => $invitation->business?->name,
            'email' => $includePrivate ? $invitation->email : null,
            'codePrefix' => $includePrivate ? $invitation->code_prefix : null,
            'role' => $invitation->role,
            'permissions' => $includePrivate ? ($invitation->permissions ?? []) : null,
            'status' => $status,
            'branch' => $invitation->branch ? ['id' => $invitation->branch->id, 'name' => $invitation->branch->name] : null,
            'expiresAt' => $invitation->expires_at,
            'acceptedAt' => $includePrivate ? $invitation->accepted_at : null,
            'acceptedBy' => $includePrivate && $invitation->acceptedBy ? [
                'id' => $invitation->acceptedBy->id,
                'name' => $invitation->acceptedBy->name,
                'email' => $invitation->acceptedBy->email,
            ] : null,
            'createdAt' => $includePrivate ? $invitation->created_at : null,
        ], fn ($value) => $value !== null);
    }
}
