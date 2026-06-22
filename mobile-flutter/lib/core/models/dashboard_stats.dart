class DashboardStats {
  final double totalSales;
  final double totalExpenses;
  final double profit;
  final int salesCount;
  final int expensesCount;
  final int lowStockCount;
  final int totalProducts;

  DashboardStats({
    required this.totalSales,
    required this.totalExpenses,
    required this.profit,
    required this.salesCount,
    required this.expensesCount,
    required this.lowStockCount,
    required this.totalProducts,
  });

  factory DashboardStats.fromJson(Map<String, dynamic> json) {
    return DashboardStats(
      totalSales: _toDouble(
          json['total_sales'] ?? json['totalSales'] ?? json['sales_total'] ?? 0),
      totalExpenses: _toDouble(
          json['total_expenses'] ?? json['totalExpenses'] ?? json['expenses_total'] ?? 0),
      profit: _toDouble(
          json['profit'] ?? json['net_profit'] ?? json['netProfit'] ?? 0),
      salesCount: _toInt(
          json['sales_count'] ?? json['salesCount'] ?? json['total_sales_count'] ?? 0),
      expensesCount: _toInt(
          json['expenses_count'] ?? json['expensesCount'] ?? json['total_expenses_count'] ?? 0),
      lowStockCount: _toInt(
          json['low_stock_count'] ?? json['lowStockCount'] ?? json['low_stock'] ?? 0),
      totalProducts: _toInt(
          json['total_products'] ?? json['totalProducts'] ?? 0),
    );
  }

  factory DashboardStats.empty() {
    return DashboardStats(
      totalSales: 0,
      totalExpenses: 0,
      profit: 0,
      salesCount: 0,
      expensesCount: 0,
      lowStockCount: 0,
      totalProducts: 0,
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
