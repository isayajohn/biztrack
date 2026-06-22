import 'package:flutter/foundation.dart';
import '../core/api/api_client.dart';
import '../core/api/product_api.dart';
import '../core/models/product.dart';

class ProductProvider extends ChangeNotifier {
  final ProductApi _api;

  List<Product> _products = [];
  bool _loading = false;
  String? _error;

  ProductProvider(ApiClient client) : _api = ProductApi(client);

  List<Product> get products => _products;
  bool get loading => _loading;
  String? get error => _error;

  List<Product> get activeProducts =>
      _products.where((p) => p.isActive).toList();

  void _setLoading(bool v) {
    _loading = v;
    notifyListeners();
  }

  Future<void> fetchProducts() async {
    _setLoading(true);
    _error = null;
    try {
      _products = await _api.getProducts();
    } catch (e) {
      _error = e.toString();
    } finally {
      _setLoading(false);
    }
  }

  Future<Product> createProduct(Map<String, dynamic> payload) async {
    final product = await _api.createProduct(payload);
    _products.add(product);
    notifyListeners();
    return product;
  }

  Future<Product> updateProduct(String id, Map<String, dynamic> payload) async {
    final updated = await _api.updateProduct(id, payload);
    final idx = _products.indexWhere((p) => p.id == id);
    if (idx != -1) _products[idx] = updated;
    notifyListeners();
    return updated;
  }

  Future<void> deleteProduct(String id) async {
    await _api.deleteProduct(id);
    _products.removeWhere((p) => p.id == id);
    notifyListeners();
  }
}
