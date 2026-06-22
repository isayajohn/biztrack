class Sale {
  final String id;
  final String? productId;
  final String productName;
  final int quantity;
  final double unitPrice;
  final double totalAmount;
  final String paymentMethod;
  final String saleDate;
  final String? notes;

  Sale({
    required this.id,
    this.productId,
    required this.productName,
    required this.quantity,
    required this.unitPrice,
    required this.totalAmount,
    required this.paymentMethod,
    required this.saleDate,
    this.notes,
  });

  factory Sale.fromJson(Map<String, dynamic> json) {
    return Sale(
      id: json['id']?.toString() ?? '',
      productId: (json['product_id'] ?? json['productId'])?.toString(),
      productName: json['product_name'] ?? json['productName'] ??
          (json['product'] is Map ? json['product']['name'] : null) ?? '',
      quantity: (json['quantity'] ?? 0) is int
          ? json['quantity']
          : int.tryParse(json['quantity'].toString()) ?? 0,
      unitPrice: _toDouble(json['unit_price'] ?? json['unitPrice']),
      totalAmount: _toDouble(json['total_amount'] ?? json['totalAmount']),
      paymentMethod:
          json['payment_method'] ?? json['paymentMethod'] ?? 'CASH',
      saleDate: json['sale_date'] ?? json['saleDate'] ?? '',
      notes: json['notes'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'product_id': productId,
      'product_name': productName,
      'quantity': quantity,
      'unit_price': unitPrice,
      'total_amount': totalAmount,
      'payment_method': paymentMethod,
      'sale_date': saleDate,
      'notes': notes,
    };
  }

  static double _toDouble(dynamic v) {
    if (v == null) return 0.0;
    if (v is double) return v;
    if (v is int) return v.toDouble();
    return double.tryParse(v.toString()) ?? 0.0;
  }

  static String paymentMethodLabel(String method) {
    switch (method) {
      case 'CASH':
        return 'Cash';
      case 'MOBILE_MONEY':
        return 'Mobile Money';
      case 'BANK':
        return 'Bank';
      case 'CREDIT':
        return 'Credit';
      default:
        return method;
    }
  }

  static const List<String> paymentMethods = [
    'CASH',
    'MOBILE_MONEY',
    'BANK',
    'CREDIT',
  ];
}
