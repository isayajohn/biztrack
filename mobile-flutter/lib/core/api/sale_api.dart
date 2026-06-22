import '../models/sale.dart';
import 'api_client.dart';

class SaleApi {
  final ApiClient _client;
  SaleApi(this._client);

  Future<List<Sale>> getSales() async {
    final data = await _client.get('/sales');
    if (data is List) {
      return data.map((e) => Sale.fromJson(e as Map<String, dynamic>)).toList();
    }
    if (data is Map && data.containsKey('data')) {
      final inner = data['data'];
      if (inner is List) {
        return inner.map((e) => Sale.fromJson(e as Map<String, dynamic>)).toList();
      }
    }
    return [];
  }

  Future<Sale> getSale(String id) async {
    final data = await _client.get('/sales/$id');
    return Sale.fromJson(data as Map<String, dynamic>);
  }

  Future<Sale> createSale(Map<String, dynamic> payload) async {
    final data = await _client.post('/sales', payload);
    return Sale.fromJson(data as Map<String, dynamic>);
  }

  Future<Sale> updateSale(String id, Map<String, dynamic> payload) async {
    final data = await _client.put('/sales/$id', payload);
    return Sale.fromJson(data as Map<String, dynamic>);
  }

  Future<void> deleteSale(String id) async {
    await _client.delete('/sales/$id');
  }
}
