class PurchaseItem {
  final String id;
  final String productId;
  final String productName;
  final int quantity;
  final double unitCost;
  final double totalCost;

  PurchaseItem({
    required this.id,
    required this.productId,
    required this.productName,
    required this.quantity,
    required this.unitCost,
    required this.totalCost,
  });

  factory PurchaseItem.fromJson(Map<String, dynamic> json) {
    return PurchaseItem(
      id: json['id']?.toString() ?? '',
      productId: (json['product_id'] ?? json['productId'])?.toString() ?? '',
      productName: json['product_name'] ??
          json['productName'] ??
          (json['product'] is Map ? json['product']['name'] : null) ??
          '',
      quantity: _toInt(json['quantity']),
      unitCost: _toDouble(json['unit_cost'] ?? json['unitCost']),
      totalCost: _toDouble(json['total_cost'] ?? json['totalCost']),
    );
  }

  static int _toInt(dynamic v) {
    if (v == null) return 0;
    if (v is int) return v;
    return int.tryParse(v.toString()) ?? 0;
  }

  static double _toDouble(dynamic v) {
    if (v == null) return 0.0;
    if (v is double) return v;
    if (v is int) return v.toDouble();
    return double.tryParse(v.toString()) ?? 0.0;
  }
}

class Purchase {
  final String id;
  final String? supplierId;
  final String? supplierName;
  final String status;
  final double totalAmount;
  final String? notes;
  final String purchaseDate;
  final List<PurchaseItem> items;

  Purchase({
    required this.id,
    this.supplierId,
    this.supplierName,
    required this.status,
    required this.totalAmount,
    this.notes,
    required this.purchaseDate,
    required this.items,
  });

  factory Purchase.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'] ?? json['purchase_items'] ?? [];
    final items = rawItems is List
        ? rawItems
            .map((e) => PurchaseItem.fromJson(e as Map<String, dynamic>))
            .toList()
        : <PurchaseItem>[];

    return Purchase(
      id: json['id']?.toString() ?? '',
      supplierId: (json['supplier_id'] ?? json['supplierId'])?.toString(),
      supplierName: json['supplier_name'] ??
          json['supplierName'] ??
          (json['supplier'] is Map ? json['supplier']['name'] : null),
      status: json['status'] ?? 'PENDING',
      totalAmount: _toDouble(json['total_amount'] ?? json['totalAmount']),
      notes: json['notes'],
      purchaseDate: json['purchase_date'] ?? json['purchaseDate'] ?? json['created_at'] ?? '',
      items: items,
    );
  }

  static double _toDouble(dynamic v) {
    if (v == null) return 0.0;
    if (v is double) return v;
    if (v is int) return v.toDouble();
    return double.tryParse(v.toString()) ?? 0.0;
  }

  String get statusLabel {
    switch (status) {
      case 'PENDING':
        return 'Pending';
      case 'RECEIVED':
        return 'Received';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  }
}
