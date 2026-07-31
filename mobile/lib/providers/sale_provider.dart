import 'package:flutter/foundation.dart';
import '../core/api/api_client.dart';
import '../core/api/sale_api.dart';
import '../core/models/sale.dart';

class SaleProvider extends ChangeNotifier {
  final SaleApi _api;

  List<Sale> _sales = [];
  bool _loading = false;
  String? _error;

  SaleProvider(ApiClient client) : _api = SaleApi(client);

  List<Sale> get sales => _sales;
  bool get loading => _loading;
  String? get error => _error;

  void _setLoading(bool v) {
    _loading = v;
    notifyListeners();
  }

  Future<void> fetchSales() async {
    _setLoading(true);
    _error = null;
    try {
      _sales = await _api.getSales();
      _sales.sort((a, b) => b.saleDate.compareTo(a.saleDate));
    } catch (e) {
      _error = e.toString();
    } finally {
      _setLoading(false);
    }
  }

  Future<Sale> createSale(Map<String, dynamic> payload) async {
    final sale = await _api.createSale(payload);
    _sales.insert(0, sale);
    notifyListeners();
    return sale;
  }

  Future<Sale> createPosSale(Map<String, dynamic> payload) async {
    final sale = await _api.createPosSale(payload);
    _sales.insert(0, sale);
    notifyListeners();
    return sale;
  }

  Future<Sale> updateSale(String id, Map<String, dynamic> payload) async {
    final updated = await _api.updateSale(id, payload);
    final idx = _sales.indexWhere((s) => s.id == id);
    if (idx != -1) _sales[idx] = updated;
    notifyListeners();
    return updated;
  }

  Future<void> deleteSale(String id) async {
    await _api.deleteSale(id);
    _sales.removeWhere((s) => s.id == id);
    notifyListeners();
  }

  List<Sale> filterByPeriod(String period) {
    final now = DateTime.now();
    return _sales.where((s) {
      final date = DateTime.tryParse(s.saleDate);
      if (date == null) return true;
      switch (period) {
        case 'today':
          return date.year == now.year &&
              date.month == now.month &&
              date.day == now.day;
        case 'week':
          final weekAgo = now.subtract(const Duration(days: 7));
          return date.isAfter(weekAgo);
        case 'month':
          return date.year == now.year && date.month == now.month;
        default:
          return true;
      }
    }).toList();
  }
}
