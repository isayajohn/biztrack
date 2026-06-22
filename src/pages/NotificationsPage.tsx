import { useEffect, useState } from "react";
import { AlertTriangle, Bell, BellOff, Calendar, CheckCheck, Package, ShoppingCart } from "lucide-react";
import { getApiErrorMessage } from "../services/apiClient";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/inventoryApi";
import type { InventoryNotification } from "../services/inventoryApi";

function typeIcon(type: string) {
  const map: Record<string, { icon: React.ElementType; bg: string; fg: string }> = {
    LOW_STOCK: { icon: Package, bg: "bg-orange-100", fg: "text-orange-600" },
    OUT_OF_STOCK: { icon: AlertTriangle, bg: "bg-red-100", fg: "text-red-600" },
    EXPIRY: { icon: Calendar, bg: "bg-yellow-100", fg: "text-yellow-700" },
    PURCHASE: { icon: ShoppingCart, bg: "bg-blue-100", fg: "text-blue-600" },
    DAMAGED: { icon: AlertTriangle, bg: "bg-orange-100", fg: "text-orange-700" },
  };
  const { icon: Icon, bg, fg } = map[type] ?? { icon: Bell, bg: "bg-gray-100", fg: "text-gray-500" };
  return (
    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${bg}`}>
      <Icon size={18} className={fg} />
    </div>
  );
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationsPage() {
  const [all, setAll] = useState<InventoryNotification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [marking, setMarking] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getNotifications();
      setAll(data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRead = async (id: string) => {
    const notif = all.find(n => n.id === id);
    if (!notif || notif.isRead) return;
    try {
      await markNotificationRead(id);
      setAll(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (_) {}
  };

  const handleMarkAll = async () => {
    setMarking(true);
    try {
      await markAllNotificationsRead();
      setAll(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      alert(getApiErrorMessage(err));
    } finally {
      setMarking(false);
    }
  };

  const displayed = filter === "unread" ? all.filter(n => !n.isRead) : all;
  const unreadCount = all.filter(n => !n.isRead).length;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAll} disabled={marking}
            className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60">
            <CheckCheck size={16} />
            {marking ? "Marking…" : "Mark all read"}
          </button>
        )}
      </div>

      {/* Filter pills */}
      <div className="mb-4 flex gap-2">
        {(["all", "unread"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              filter === f ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            {f === "all" ? "All" : `Unread (${unreadCount})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="rounded-xl bg-red-50 p-6 text-center text-red-700">{error}</div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-20 shadow-sm">
          <BellOff size={48} className="mb-4 text-gray-300" />
          <p className="font-semibold text-gray-500">
            {filter === "unread" ? "No unread notifications" : "No notifications yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-1 rounded-2xl bg-white shadow-sm overflow-hidden">
          {displayed.map(n => (
            <div key={n.id}
              onClick={() => handleRead(n.id)}
              className={`flex cursor-pointer items-start gap-4 border-b border-gray-50 px-5 py-4 transition-colors last:border-0 hover:bg-gray-50/70 ${
                !n.isRead ? "bg-green-50/40" : ""
              }`}>
              {typeIcon(n.type)}
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${!n.isRead ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}>
                  {n.title}
                </p>
                <p className="mt-0.5 text-sm text-gray-500 line-clamp-2">{n.message}</p>
                <p className="mt-1 text-xs text-gray-400">{timeAgo(n.createdAt)}</p>
              </div>
              {!n.isRead && (
                <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-green-500" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
