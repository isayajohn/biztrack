class Debt {
  final String id;
  final String debtNumber;
  final String type; // CUSTOMER | SUPPLIER
  final String status;
  final String source;
  final String? branchId;
  final String? customerId;
  final String? customerName;
  final String? customerPhone;
  final String? supplierId;
  final String? supplierName;
  final String? supplierPhone;
  final String? saleId;
  final String? purchaseOrderId;
  final double originalAmount;
  final double totalPaid;
  final double outstandingBalance;
  final String debtDate;
  final String? dueDate;
  final String? description;
  final String? notes;
  final bool isOverdue;
  final String? createdAt;

  Debt({
    required this.id,
    required this.debtNumber,
    required this.type,
    required this.status,
    required this.source,
    this.branchId,
    this.customerId,
    this.customerName,
    this.customerPhone,
    this.supplierId,
    this.supplierName,
    this.supplierPhone,
    this.saleId,
    this.purchaseOrderId,
    required this.originalAmount,
    required this.totalPaid,
    required this.outstandingBalance,
    required this.debtDate,
    this.dueDate,
    this.description,
    this.notes,
    this.isOverdue = false,
    this.createdAt,
  });

  String get partyName => type == 'CUSTOMER' ? (customerName ?? '—') : (supplierName ?? '—');
  String? get partyPhone => type == 'CUSTOMER' ? customerPhone : supplierPhone;

  factory Debt.fromJson(Map<String, dynamic> json) {
    final customer = json['customer'] is Map ? json['customer'] as Map : null;
    final supplier = json['supplier'] is Map ? json['supplier'] as Map : null;
    return Debt(
      id: json['id']?.toString() ?? '',
      debtNumber: json['debtNumber']?.toString() ?? '',
      type: json['type']?.toString() ?? 'CUSTOMER',
      status: json['status']?.toString() ?? 'ACTIVE',
      source: json['source']?.toString() ?? 'MANUAL',
      branchId: json['branchId']?.toString(),
      customerId: customer?['id']?.toString(),
      customerName: customer?['name']?.toString(),
      customerPhone: customer?['phone']?.toString(),
      supplierId: supplier?['id']?.toString(),
      supplierName: supplier?['name']?.toString(),
      supplierPhone: supplier?['phone']?.toString(),
      saleId: json['saleId']?.toString(),
      purchaseOrderId: json['purchaseOrderId']?.toString(),
      originalAmount: _toDouble(json['originalAmount']),
      totalPaid: _toDouble(json['totalPaid']),
      outstandingBalance: _toDouble(json['outstandingBalance']),
      debtDate: json['debtDate']?.toString() ?? '',
      dueDate: json['dueDate']?.toString(),
      description: json['description']?.toString(),
      notes: json['notes']?.toString(),
      isOverdue: json['isOverdue'] == true,
      createdAt: json['createdAt']?.toString(),
    );
  }

  static double _toDouble(dynamic v) {
    if (v == null) return 0.0;
    if (v is double) return v;
    if (v is int) return v.toDouble();
    return double.tryParse(v.toString()) ?? 0.0;
  }

  static const List<String> statuses = [
    'DRAFT',
    'ACTIVE',
    'PARTIALLY_PAID',
    'OVERDUE',
    'PAID',
    'DISPUTED',
    'WRITTEN_OFF',
    'CANCELLED',
  ];

  static String statusLabel(String status) {
    switch (status) {
      case 'PARTIALLY_PAID':
        return 'Partially paid';
      case 'WRITTEN_OFF':
        return 'Written off';
      default:
        return status[0] + status.substring(1).toLowerCase();
    }
  }
}
