import '../models/expense.dart';
import 'api_client.dart';

class ExpenseApi {
  final ApiClient _client;
  ExpenseApi(this._client);

  Future<List<Expense>> getExpenses() async {
    final data = await _client.get('/expenses');
    if (data is List) {
      return data
          .map((e) => Expense.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    if (data is Map) {
      final inner = data['expenses'] ?? data['data'];
      if (inner is List) {
        return inner
            .map((e) => Expense.fromJson(e as Map<String, dynamic>))
            .toList();
      }
    }
    return [];
  }

  Future<Expense> getExpense(String id) async {
    final data = await _client.get('/expenses/$id');
    return Expense.fromJson(data as Map<String, dynamic>);
  }

  Future<Expense> createExpense(Map<String, dynamic> payload) async {
    final data = await _client.post('/expenses', payload);
    return Expense.fromJson(data as Map<String, dynamic>);
  }

  Future<Expense> updateExpense(String id, Map<String, dynamic> payload) async {
    final data = await _client.put('/expenses/$id', payload);
    return Expense.fromJson(data as Map<String, dynamic>);
  }

  Future<void> deleteExpense(String id) async {
    await _client.delete('/expenses/$id');
  }
}
