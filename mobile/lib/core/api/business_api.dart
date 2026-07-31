import 'api_client.dart';

class BusinessApi {
  final ApiClient client;
  BusinessApi(this.client);

  List<Map<String, dynamic>> _list(dynamic data, String key) {
    final value = data is Map ? data[key] : data;
    if (value is! List) return [];
    return value.map((item) => Map<String, dynamic>.from(item as Map)).toList();
  }

  Future<Map<String, dynamic>> businessProfile() async =>
      Map<String, dynamic>.from(await client.get('/business') as Map);

  Future<List<Map<String, dynamic>>> customers() async =>
      _list(await client.get('/customers'), 'customers');
  Future<void> createCustomer(Map<String, dynamic> data) async =>
      client.post('/customers', data);
  Future<Map<String, dynamic>> customerStatement(String id) async =>
      Map<String, dynamic>.from(
        await client.get('/customers/$id/statement') as Map,
      );
  Future<void> recordCustomerPayment(
    String id,
    Map<String, dynamic> data,
  ) async => client.post('/customers/$id/payments', data);

  Future<List<Map<String, dynamic>>> promotions() async =>
      _list(await client.get('/promotions'), 'promotions');
  Future<void> createPromotion(Map<String, dynamic> data) async =>
      client.post('/promotions', data);

  Future<List<Map<String, dynamic>>> branches() async =>
      _list(await client.get('/branches'), 'branches');
  Future<void> createBranch(Map<String, dynamic> data) async =>
      client.post('/branches', data);
  Future<void> selectBranch(String id) async {
    await client.saveActiveBranch(id);
  }

  Future<Map<String, dynamic>> staff() async =>
      Map<String, dynamic>.from(await client.get('/staff') as Map);
  Future<void> createStaff(Map<String, dynamic> data) async =>
      client.post('/staff', data);

  Future<List<Map<String, dynamic>>> brands() async =>
      _list(await client.get('/brands'), 'brands');
  Future<void> createBrand(Map<String, dynamic> data) async =>
      client.post('/brands', data);

  Future<List<Map<String, dynamic>>> adjustments() async =>
      _list(await client.get('/stock/adjustments'), 'adjustments');
  Future<void> createAdjustment(Map<String, dynamic> data) async =>
      client.post('/stock/adjustment', data);
  Future<void> approveAdjustment(String id) async =>
      client.put('/stock/adjustment/$id/approve', {});
  Future<void> rejectAdjustment(String id) async =>
      client.put('/stock/adjustment/$id/reject', {});

  Future<Map<String, dynamic>> cashFlow(String start, String end) async =>
      Map<String, dynamic>.from(
        await client.get(
              '/reports/cash-flow',
              params: {'startDate': start, 'endDate': end},
            )
            as Map,
      );
  Future<Map<String, dynamic>> purchaseReport(String start, String end) async =>
      Map<String, dynamic>.from(
        await client.get(
              '/reports/purchases',
              params: {'startDate': start, 'endDate': end},
            )
            as Map,
      );
}
