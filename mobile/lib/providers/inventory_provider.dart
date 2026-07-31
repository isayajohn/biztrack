import 'package:flutter/foundation.dart';
import '../core/api/inventory_api.dart';
import '../core/models/inventory_notification.dart';
import '../core/models/stock_movement.dart';

class InventoryProvider extends ChangeNotifier {
  final InventoryApi _api;
  InventoryProvider(this._api);

  List<dynamic> lowStockProducts = [];
  List<StockMovement> movements = [];
  List<InventoryNotification> notifications = [];
  int unreadCount = 0;
  bool loading = false;
  String? error;

  Future<void> fetchLowStock() async {
    loading = true;
    notifyListeners();
    try {
      lowStockProducts = await _api.getLowStock();
      error = null;
    } catch (e) {
      error = e.toString();
    }
    loading = false;
    notifyListeners();
  }

  Future<void> fetchMovements({String? productId, String? movementType}) async {
    loading = true;
    notifyListeners();
    try {
      movements = await _api.getMovements(
        productId: productId,
        movementType: movementType,
      );
      error = null;
    } catch (e) {
      error = e.toString();
    }
    loading = false;
    notifyListeners();
  }

  Future<void> fetchNotifications({bool unreadOnly = false}) async {
    try {
      notifications = await _api.getNotifications(unreadOnly: unreadOnly);
      unreadCount = notifications.where((n) => !n.isRead).length;
      notifyListeners();
    } catch (_) {}
  }

  Future<void> refreshUnreadCount() async {
    try {
      unreadCount = await _api.getUnreadCount();
      notifyListeners();
    } catch (_) {}
  }

  Future<void> markRead(String id) async {
    try {
      await _api.markNotificationRead(id);
      final idx = notifications.indexWhere((n) => n.id == id);
      if (idx >= 0) {
        notifications[idx] = notifications[idx].copyWith(isRead: true);
        unreadCount = notifications.where((n) => !n.isRead).length;
        notifyListeners();
      }
    } catch (_) {
      await fetchNotifications();
    }
  }

  Future<void> markAllRead() async {
    await _api.markAllRead();
    notifications = notifications.map((n) => n.copyWith(isRead: true)).toList();
    unreadCount = 0;
    notifyListeners();
  }

  Future<Map<String, dynamic>> stockIn(
    String productId,
    int quantity,
    String? reason,
  ) async {
    final result = await _api.stockIn(
      productId: productId,
      quantity: quantity,
      reason: reason,
    );
    await fetchLowStock();
    return result;
  }
}
