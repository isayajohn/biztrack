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
    // Backend returns nested shape: { revenue: { current }, expenses: { current },
    // sales: { current }, profit: { current }, products: { total, lowStock } }
    final revenue = json['revenue'] is Map ? json['revenue'] as Map : null;
    final expenses = json['expenses'] is Map ? json['expenses'] as Map : null;
    final sales = json['sales'] is Map ? json['sales'] as Map : null;
    final profit = json['profit'] is Map ? json['profit'] as Map : null;
    final products = json['products'] is Map ? json['products'] as Map : null;

    return DashboardStats(
      totalSales: _toDouble(
          revenue?['current'] ?? json['total_sales'] ?? json['totalSales'] ?? 0),
      totalExpenses: _toDouble(
          expenses?['current'] ?? json['total_expenses'] ?? json['totalExpenses'] ?? 0),
      profit: _toDouble(
          profit?['current'] ?? json['net_profit'] ?? json['netProfit'] ?? 0),
      salesCount: _toInt(
          sales?['current'] ?? json['sales_count'] ?? json['salesCount'] ?? 0),
      expensesCount: _toInt(
          expenses?['current'] ?? json['expenses_count'] ?? json['expensesCount'] ?? 0),
      lowStockCount: _toInt(
          products?['lowStock'] ?? json['low_stock_count'] ?? json['lowStockCount'] ?? 0),
      totalProducts: _toInt(
          products?['total'] ?? json['total_products'] ?? json['totalProducts'] ?? 0),
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
