import '../models/inventory_notification.dart';
import '../models/stock_movement.dart';
import 'api_client.dart';

class InventoryApi {
  final ApiClient _client;
  InventoryApi(this._client);

  Future<List<dynamic>> getLowStock() async {
    final data = await _client.get('/stock/low-stock');
    if (data is List) return data;
    if (data is Map && data.containsKey('data')) {
      final inner = data['data'];
      if (inner is List) return inner;
    }
    return [];
  }

  Future<Map<String, dynamic>> stockIn({
    required String productId,
    required int quantity,
    String? reason,
  }) async {
    final payload = <String, dynamic>{
      'productId': productId,
      'quantity': quantity,
      if (reason != null && reason.isNotEmpty) 'reason': reason,
    };
    final data = await _client.post('/stock/in', payload);
    if (data is Map<String, dynamic>) return data;
    return {};
  }

  Future<List<StockMovement>> getMovements({
    String? productId,
    String? movementType,
    int page = 1,
  }) async {
    final params = <String, String>{'page': page.toString()};
    if (productId != null) params['productId'] = productId;
    if (movementType != null && movementType.isNotEmpty) {
      params['movementType'] = movementType;
    }
    final data = await _client.get('/stock/movements', params: params);
    final list = _extractList(data);
    return list
        .map((e) => StockMovement.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<dynamic>> getSuppliers() async {
    final data = await _client.get('/suppliers');
    return _extractList(data);
  }

  Future<List<InventoryNotification>> getNotifications({
    bool unreadOnly = false,
  }) async {
    final params = <String, String>{};
    if (unreadOnly) params['unread'] = 'true';
    final data = await _client.get('/notifications', params: params);
    final list = _extractList(data);
    return list
        .map((e) => InventoryNotification.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> markNotificationRead(String id) async {
    await _client.put('/notifications/$id/read', {});
  }

  Future<void> markAllRead() async {
    await _client.put('/notifications/mark-all-read', {});
  }

  Future<int> getUnreadCount() async {
    final data = await _client.get('/notifications/unread-count');
    if (data is Map) {
      return (data['count'] ?? 0) as int;
    }
    return 0;
  }

  Future<Map<String, dynamic>> getInventoryDashboard() async {
    final data = await _client.get('/reports/inventory-dashboard');
    if (data is Map<String, dynamic>) return data;
    return {};
  }

  List<dynamic> _extractList(dynamic data) {
    if (data is List) return data;
    if (data is Map) {
      if (data.containsKey('data')) {
        final inner = data['data'];
        if (inner is List) return inner;
        if (inner is Map && inner.containsKey('data')) {
          final nested = inner['data'];
          if (nested is List) return nested;
        }
      }
    }
    return [];
  }
}
