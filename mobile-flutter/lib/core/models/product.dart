class Product {
  final String id;
  final String name;
  final String? sku;
  final double buyingPrice;
  final double sellingPrice;
  final int stockQuantity;
  final int lowStockLevel;
  final bool isActive;

  Product({
    required this.id,
    required this.name,
    this.sku,
    required this.buyingPrice,
    required this.sellingPrice,
    required this.stockQuantity,
    required this.lowStockLevel,
    required this.isActive,
  });

  bool get isLowStock => stockQuantity <= lowStockLevel;

  factory Product.fromJson(Map<String, dynamic> json) {
    final stock = json['stock'] ?? json['stock_quantity'] ?? json['stockQuantity'] ?? 0;
    final lowStock = json['low_stock_level'] ?? json['lowStockLevel'] ?? 5;
    return Product(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? '',
      sku: json['sku'],
      buyingPrice: _toDouble(json['buying_price'] ?? json['buyingPrice']),
      sellingPrice: _toDouble(json['selling_price'] ?? json['sellingPrice']),
      stockQuantity: stock is int ? stock : int.tryParse(stock.toString()) ?? 0,
      lowStockLevel:
          lowStock is int ? lowStock : int.tryParse(lowStock.toString()) ?? 5,
      isActive: json['is_active'] ?? json['isActive'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'sku': sku,
      'buying_price': buyingPrice,
      'selling_price': sellingPrice,
      'stock_quantity': stockQuantity,
      'low_stock_level': lowStockLevel,
      'is_active': isActive,
    };
  }

  static double _toDouble(dynamic v) {
    if (v == null) return 0.0;
    if (v is double) return v;
    if (v is int) return v.toDouble();
    return double.tryParse(v.toString()) ?? 0.0;
  }
}
