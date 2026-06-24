import 'api_client.dart';

class ReportData {
  final double totalSales;
  final double totalExpenses;
  final double netProfit;
  final int salesCount;
  final int expensesCount;
  final List<Map<String, dynamic>> topProducts;

  ReportData({
    required this.totalSales,
    required this.totalExpenses,
    required this.netProfit,
    required this.salesCount,
    required this.expensesCount,
    required this.topProducts,
  });

  factory ReportData.fromJson(Map<String, dynamic> json) {
    // Backend returns: { summary: { totalRevenue, totalExpenses, profit, totalSales (count), totalExpenseCount }, topProducts: [] }
    final summary = json['summary'] is Map ? json['summary'] as Map : null;

    List<Map<String, dynamic>> products = [];
    final raw = json['topProducts'] ?? json['top_products'] ?? json['products'] ?? [];
    if (raw is List) {
      products = raw.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    }

    return ReportData(
      totalSales: _toDouble(
          summary?['totalRevenue'] ?? json['total_sales'] ?? json['totalSales'] ?? 0),
      totalExpenses: _toDouble(
          summary?['totalExpenses'] ?? json['total_expenses'] ?? json['totalExpenses'] ?? 0),
      netProfit: _toDouble(
          summary?['profit'] ?? json['net_profit'] ?? json['netProfit'] ?? 0),
      salesCount: _toInt(
          summary?['totalSales'] ?? json['sales_count'] ?? json['salesCount'] ?? 0),
      expensesCount: _toInt(
          summary?['totalExpenseCount'] ?? json['expenses_count'] ?? json['expensesCount'] ?? 0),
      topProducts: products,
    );
  }

  factory ReportData.empty() {
    return ReportData(
      totalSales: 0,
      totalExpenses: 0,
      netProfit: 0,
      salesCount: 0,
      expensesCount: 0,
      topProducts: [],
    );
  }

  static double _toDouble(dynamic v) {
    if (v == null) return 0.0;
    if (v is double) return v;
    if (v is int) return v.toDouble();
    return double.tryParse(v.toString()) ?? 0.0;
  }

  static int _toInt(dynamic v) {
    if (v == null) return 0;
    if (v is int) return v;
    return int.tryParse(v.toString()) ?? 0;
  }
}

class ReportApi {
  final ApiClient _client;
  ReportApi(this._client);

  Future<ReportData> getReports(
      {required String startDate, required String endDate}) async {
    final data = await _client.get('/reports', params: {
      'startDate': startDate,
      'endDate': endDate,
    });
    if (data is Map<String, dynamic>) {
      return ReportData.fromJson(data);
    }
    return ReportData.empty();
  }
}
