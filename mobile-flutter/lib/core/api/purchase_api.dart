import '../models/purchase.dart';
import 'api_client.dart';

class PurchaseApi {
  final ApiClient _client;
  PurchaseApi(this._client);

  Future<List<Purchase>> getPurchases() async {
    final data = await _client.get('/purchases');
    if (data is List) {
      return data.map((e) => Purchase.fromJson(e as Map<String, dynamic>)).toList();
    }
    if (data is Map) {
      final inner = data['purchases'] ?? data['data'];
      if (inner is List) {
        return inner.map((e) => Purchase.fromJson(e as Map<String, dynamic>)).toList();
      }
    }
    return [];
  }

  Future<List<dynamic>> getDamagedStock() async {
    final data = await _client.get('/damaged-stock');
    if (data is List) return data;
    if (data is Map) {
      final inner = data['damaged_stock'] ?? data['damagedStock'] ?? data['data'];
      if (inner is List) return inner;
    }
    return [];
  }
}
