<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\InventoryNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryNotificationController extends Controller
{
    private function getBusiness(): ?Business
    {
        return Business::where('user_id', auth()->id())->first();
    }

    public function list(Request $request): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) {
            return response()->json(['success' => true, 'data' => ['notifications' => [], 'total' => 0]]);
        }

        $query = InventoryNotification::where('business_id', $business->id);

        if ($request->filled('isRead')) {
            $query->where('is_read', filter_var($request->isRead, FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        $total = $query->count();
        $page  = (int) $request->get('page', 1);
        $limit = (int) $request->get('limit', 50);

        $notifications = $query->orderByDesc('created_at')
            ->skip(($page - 1) * $limit)
            ->take($limit)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'notifications' => $notifications->map(fn($n) => $this->formatNotification($n)),
                'total'         => $total,
                'page'          => $page,
                'limit'         => $limit,
            ],
        ]);
    }

    public function markRead(string $id): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) {
            return response()->json(['success' => false, 'error' => 'Business not found'], 404);
        }

        $notification = InventoryNotification::where('id', $id)
            ->where('business_id', $business->id)
            ->first();

        if (!$notification) {
            return response()->json(['success' => false, 'error' => 'Notification not found'], 404);
        }

        $notification->update(['is_read' => true]);

        return response()->json(['success' => true, 'data' => $this->formatNotification($notification->fresh())]);
    }

    public function markAllRead(): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) {
            return response()->json(['success' => false, 'error' => 'Business not found'], 404);
        }

        $updated = InventoryNotification::where('business_id', $business->id)
            ->where('user_id', auth()->id())
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json([
            'success' => true,
            'data'    => ['marked' => $updated, 'message' => "$updated notification(s) marked as read"],
        ]);
    }

    public function getUnreadCount(): JsonResponse
    {
        $business = $this->getBusiness();
        if (!$business) {
            return response()->json(['success' => true, 'data' => ['count' => 0]]);
        }

        $count = InventoryNotification::where('business_id', $business->id)
            ->where('is_read', false)
            ->count();

        return response()->json(['success' => true, 'data' => ['count' => $count]]);
    }

    private function formatNotification(InventoryNotification $n): array
    {
        return [
            'id'          => $n->id,
            'title'       => $n->title,
            'message'     => $n->message,
            'type'        => $n->type,
            'referenceId' => $n->reference_id,
            'isRead'      => (bool) $n->is_read,
            'createdAt'   => $n->created_at,
        ];
    }
}
