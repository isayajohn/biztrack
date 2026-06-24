import '../models/category.dart';
import 'api_client.dart';

class CategoryApi {
  final ApiClient _client;
  CategoryApi(this._client);

  Future<List<Category>> getCategories() async {
    final data = await _client.get('/categories');
    if (data is List) {
      return data.map((e) => Category.fromJson(e as Map<String, dynamic>)).toList();
    }
    if (data is Map) {
      final inner = data['categories'] ?? data['data'];
      if (inner is List) {
        return inner.map((e) => Category.fromJson(e as Map<String, dynamic>)).toList();
      }
    }
    return [];
  }

  Future<Category> createCategory(String name, {String? description}) async {
    final data = await _client.post('/categories', {
      'name': name,
      if (description != null && description.isNotEmpty) 'description': description,
    });
    return Category.fromJson(data as Map<String, dynamic>);
  }

  Future<Category> updateCategory(String id, String name, {String? description}) async {
    final data = await _client.put('/categories/$id', {
      'name': name,
      if (description != null) 'description': description,
    });
    return Category.fromJson(data as Map<String, dynamic>);
  }

  Future<void> deleteCategory(String id) async {
    await _client.delete('/categories/$id');
  }
}
