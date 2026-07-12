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
  final String? receiptNumber;
  final String? customerId;
  final String? customerName;
  final double discount;
  final double promotionDiscount;
  final double taxAmount;
  final double paidAmount;
  final double balanceDue;
  final List<SaleLineItem> items;

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
    this.receiptNumber,
    this.customerId,
    this.customerName,
    this.discount = 0,
    this.promotionDiscount = 0,
    this.taxAmount = 0,
    this.paidAmount = 0,
    this.balanceDue = 0,
    this.items = const [],
  });

  factory Sale.fromJson(Map<String, dynamic> json) {
    return Sale(
      id: json['id']?.toString() ?? '',
      productId: (json['product_id'] ?? json['productId'])?.toString(),
      productName:
          json['product_name'] ??
          json['productName'] ??
          (json['product'] is Map ? json['product']['name'] : null) ??
          '',
      quantity: (json['quantity'] ?? 0) is int
          ? json['quantity']
          : int.tryParse(json['quantity'].toString()) ?? 0,
      unitPrice: _toDouble(json['unit_price'] ?? json['unitPrice']),
      totalAmount: _toDouble(json['total_amount'] ?? json['totalAmount']),
      paymentMethod: json['payment_method'] ?? json['paymentMethod'] ?? 'CASH',
      saleDate: json['sale_date'] ?? json['saleDate'] ?? '',
      notes: json['notes'],
      receiptNumber: json['receiptNumber']?.toString(),
      customerId: json['customerId']?.toString(),
      customerName: json['customerName']?.toString(),
      discount: _toDouble(json['discount']),
      promotionDiscount: _toDouble(json['promotionDiscount']),
      taxAmount: _toDouble(json['taxAmount']),
      paidAmount: _toDouble(json['paidAmount']),
      balanceDue: _toDouble(json['balanceDue']),
      items: json['items'] is List
          ? (json['items'] as List)
                .map(
                  (item) => SaleLineItem.fromJson(
                    Map<String, dynamic>.from(item as Map),
                  ),
                )
                .toList()
          : const [],
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

class SaleLineItem {
  final String id;
  final String? productId;
  final String productName;
  final int quantity;
  final double unitPrice;
  final double total;

  const SaleLineItem({
    required this.id,
    this.productId,
    required this.productName,
    required this.quantity,
    required this.unitPrice,
    required this.total,
  });

  factory SaleLineItem.fromJson(Map<String, dynamic> json) => SaleLineItem(
    id: json['id']?.toString() ?? '',
    productId: json['productId']?.toString(),
    productName: json['productName']?.toString() ?? '',
    quantity: int.tryParse(json['quantity']?.toString() ?? '') ?? 0,
    unitPrice: Sale._toDouble(json['unitPrice']),
    total: Sale._toDouble(json['total']),
  );
}
