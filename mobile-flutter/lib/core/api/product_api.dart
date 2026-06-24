import '../models/product.dart';
import 'api_client.dart';

class ProductApi {
  final ApiClient _client;
  ProductApi(this._client);

  Future<List<Product>> getProducts() async {
    final data = await _client.get('/products');
    if (data is List) {
      return data
          .map((e) => Product.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    if (data is Map) {
      final inner = data['products'] ?? data['data'];
      if (inner is List) {
        return inner
            .map((e) => Product.fromJson(e as Map<String, dynamic>))
            .toList();
      }
    }
    return [];
  }

  Future<Product> getProduct(String id) async {
    final data = await _client.get('/products/$id');
    return Product.fromJson(data as Map<String, dynamic>);
  }

  Future<Product> createProduct(Map<String, dynamic> payload) async {
    final data = await _client.post('/products', payload);
    return Product.fromJson(data as Map<String, dynamic>);
  }

  Future<Product> updateProduct(String id, Map<String, dynamic> payload) async {
    final data = await _client.put('/products/$id', payload);
    return Product.fromJson(data as Map<String, dynamic>);
  }

  Future<void> deleteProduct(String id) async {
    await _client.delete('/products/$id');
  }
}
