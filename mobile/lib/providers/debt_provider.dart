import 'package:flutter/foundation.dart';
import '../core/api/api_client.dart';
import '../core/api/debt_api.dart';
import '../core/models/debt.dart';
import '../core/models/debt_payment.dart';
import '../core/models/debt_reminder.dart';

class DebtProvider extends ChangeNotifier {
  final DebtApi _api;

  List<Debt> _debts = [];
  DebtOverview? _overview;
  bool _loading = false;
  String? _error;

  DebtProvider(ApiClient client) : _api = DebtApi(client);

  List<Debt> get debts => _debts;
  DebtOverview? get overview => _overview;
  bool get loading => _loading;
  String? get error => _error;

  List<Debt> get customerDebts => _debts.where((d) => d.type == 'CUSTOMER').toList();
  List<Debt> get supplierDebts => _debts.where((d) => d.type == 'SUPPLIER').toList();

  void _setLoading(bool v) {
    _loading = v;
    notifyListeners();
  }

  Future<void> fetchDebts({String? type, String? status, String? search}) async {
    _setLoading(true);
    _error = null;
    try {
      _debts = await _api.getDebts(type: type, status: status, search: search);
    } catch (e) {
      _error = e.toString();
    } finally {
      _setLoading(false);
    }
  }

  Future<void> fetchOverview() async {
    try {
      _overview = await _api.getOverview();
      notifyListeners();
    } catch (e) {
      _error = e.toString();
    }
  }

  Future<Debt> getDebt(String id) => _api.getDebt(id);

  Future<List<DebtPayment>> getPayments(String debtId) => _api.getDebtPayments(debtId);

  Future<List<DebtReminder>> getReminders(String debtId) => _api.getDebtReminders(debtId);

  Future<Debt> createDebt(Map<String, dynamic> payload) async {
    final debt = await _api.createDebt(payload);
    _debts.insert(0, debt);
    notifyListeners();
    return debt;
  }

  Future<Map<String, dynamic>> recordPayment(String debtId, Map<String, dynamic> payload) async {
    final result = await _api.recordPayment(debtId, payload);
    await fetchDebts();
    return result;
  }

  Future<void> reversePayment(String paymentId, String reason) async {
    await _api.reversePayment(paymentId, reason);
    await fetchDebts();
  }

  Future<void> cancelDebt(String id, String reason) async {
    await _api.cancelDebt(id, reason);
    await fetchDebts();
  }

  Future<void> writeOffDebt(String id, String reason) async {
    await _api.writeOffDebt(id, reason);
    await fetchDebts();
  }

  Future<void> disputeDebt(String id, String reason) async {
    await _api.disputeDebt(id, reason);
    await fetchDebts();
  }

  Future<void> sendReminderNow(String debtId, String channel) => _api.sendReminderNow(debtId, channel);
}
