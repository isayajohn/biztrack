import 'package:flutter/foundation.dart';
import '../core/api/api_client.dart';
import '../core/api/expense_api.dart';
import '../core/models/expense.dart';

class ExpenseProvider extends ChangeNotifier {
  final ExpenseApi _api;

  List<Expense> _expenses = [];
  bool _loading = false;
  String? _error;

  ExpenseProvider(ApiClient client) : _api = ExpenseApi(client);

  List<Expense> get expenses => _expenses;
  bool get loading => _loading;
  String? get error => _error;

  void _setLoading(bool v) {
    _loading = v;
    notifyListeners();
  }

  Future<void> fetchExpenses() async {
    _setLoading(true);
    _error = null;
    try {
      _expenses = await _api.getExpenses();
      _expenses.sort((a, b) => b.expenseDate.compareTo(a.expenseDate));
    } catch (e) {
      _error = e.toString();
    } finally {
      _setLoading(false);
    }
  }

  Future<Expense> createExpense(Map<String, dynamic> payload) async {
    final expense = await _api.createExpense(payload);
    _expenses.insert(0, expense);
    notifyListeners();
    return expense;
  }

  Future<Expense> updateExpense(String id, Map<String, dynamic> payload) async {
    final updated = await _api.updateExpense(id, payload);
    final idx = _expenses.indexWhere((e) => e.id == id);
    if (idx != -1) _expenses[idx] = updated;
    notifyListeners();
    return updated;
  }

  Future<void> deleteExpense(String id) async {
    await _api.deleteExpense(id);
    _expenses.removeWhere((e) => e.id == id);
    notifyListeners();
  }

  List<Expense> filterByCategory(String? category) {
    if (category == null || category == 'ALL') return _expenses;
    return _expenses.where((e) => e.category == category).toList();
  }
}
