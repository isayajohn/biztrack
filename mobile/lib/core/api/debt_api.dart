import '../models/debt.dart';
import '../models/debt_payment.dart';
import '../models/debt_reminder.dart';
import 'api_client.dart';

class DebtOverview {
  final double totalCustomerDebts;
  final double totalSupplierDebts;
  final double customerOverdueAmount;
  final double supplierOverdueAmount;
  final double collectedThisMonth;
  final double paidToSuppliersThisMonth;
  final int debtsDueToday;
  final int debtsDueWithin7Days;

  DebtOverview({
    required this.totalCustomerDebts,
    required this.totalSupplierDebts,
    required this.customerOverdueAmount,
    required this.supplierOverdueAmount,
    required this.collectedThisMonth,
    required this.paidToSuppliersThisMonth,
    required this.debtsDueToday,
    required this.debtsDueWithin7Days,
  });

  factory DebtOverview.fromJson(Map<String, dynamic> json) {
    double d(dynamic v) => v == null ? 0.0 : (v is num ? v.toDouble() : double.tryParse(v.toString()) ?? 0.0);
    int i(dynamic v) => v == null ? 0 : (v is num ? v.toInt() : int.tryParse(v.toString()) ?? 0);
    return DebtOverview(
      totalCustomerDebts: d(json['totalCustomerDebts']),
      totalSupplierDebts: d(json['totalSupplierDebts']),
      customerOverdueAmount: d(json['customerOverdueAmount']),
      supplierOverdueAmount: d(json['supplierOverdueAmount']),
      collectedThisMonth: d(json['collectedThisMonth']),
      paidToSuppliersThisMonth: d(json['paidToSuppliersThisMonth']),
      debtsDueToday: i(json['debtsDueToday']),
      debtsDueWithin7Days: i(json['debtsDueWithin7Days']),
    );
  }
}

class DebtApi {
  final ApiClient _client;
  DebtApi(this._client);

  Future<List<Debt>> getDebts({String? type, String? status, String? search}) async {
    final params = <String, String>{
      if (type != null) 'type': type,
      if (status != null) 'status': status,
      if (search != null && search.isNotEmpty) 'search': search,
      'limit': '100',
    };
    final data = await _client.get('/debts', params: params);
    final list = data is Map ? data['debts'] : data;
    if (list is List) {
      return list.map((e) => Debt.fromJson(Map<String, dynamic>.from(e as Map))).toList();
    }
    return [];
  }

  Future<Debt> getDebt(String id) async {
    final data = await _client.get('/debts/$id');
    return Debt.fromJson(Map<String, dynamic>.from(data as Map));
  }

  Future<List<DebtPayment>> getDebtPayments(String debtId) async {
    final data = await _client.get('/debts/$debtId');
    final list = (data as Map)['payments'];
    if (list is List) {
      return list.map((e) => DebtPayment.fromJson(Map<String, dynamic>.from(e as Map))).toList();
    }
    return [];
  }

  Future<List<DebtReminder>> getDebtReminders(String debtId) async {
    final data = await _client.get('/debts/$debtId');
    final list = (data as Map)['reminders'];
    if (list is List) {
      return list.map((e) => DebtReminder.fromJson(Map<String, dynamic>.from(e as Map))).toList();
    }
    return [];
  }

  Future<Debt> createDebt(Map<String, dynamic> payload) async {
    final data = await _client.post('/debts', payload);
    return Debt.fromJson(Map<String, dynamic>.from(data as Map));
  }

  Future<Map<String, dynamic>> recordPayment(String debtId, Map<String, dynamic> payload) async {
    final data = await _client.post('/debts/$debtId/payments', payload);
    return Map<String, dynamic>.from(data as Map);
  }

  Future<void> reversePayment(String paymentId, String reason) async {
    await _client.delete('/debt-payments/$paymentId', body: {'reason': reason});
  }

  Future<Debt> cancelDebt(String id, String reason) async {
    final data = await _client.post('/debts/$id/cancel', {'reason': reason});
    return Debt.fromJson(Map<String, dynamic>.from(data as Map));
  }

  Future<Debt> writeOffDebt(String id, String reason) async {
    final data = await _client.post('/debts/$id/write-off', {'reason': reason});
    return Debt.fromJson(Map<String, dynamic>.from(data as Map));
  }

  Future<Debt> disputeDebt(String id, String reason) async {
    final data = await _client.post('/debts/$id/dispute', {'reason': reason});
    return Debt.fromJson(Map<String, dynamic>.from(data as Map));
  }

  Future<void> sendReminderNow(String debtId, String channel) async {
    final scheduled = await _client.post('/debts/$debtId/reminders', {'channel': channel});
    final reminderId = (scheduled as Map)['id']?.toString();
    if (reminderId != null) {
      await _client.post('/debts/$debtId/reminders/$reminderId/send-now', {});
    }
  }

  Future<DebtOverview> getOverview() async {
    final data = await _client.get('/debts/overview');
    return DebtOverview.fromJson(Map<String, dynamic>.from(data as Map));
  }
}
