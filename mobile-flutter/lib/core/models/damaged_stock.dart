class DamagedStock {
  final String id;
  final String productId;
  final String productName;
  final int quantity;
  final double estimatedLoss;
  final String reason;
  final String status;
  final String reportedAt;

  DamagedStock({
    required this.id,
    required this.productId,
    required this.productName,
    required this.quantity,
    required this.estimatedLoss,
    required this.reason,
    required this.status,
    required this.reportedAt,
  });

  factory DamagedStock.fromJson(Map<String, dynamic> json) {
    return DamagedStock(
      id: json['id']?.toString() ?? '',
      productId: (json['product_id'] ?? json['productId'])?.toString() ?? '',
      productName: json['product_name'] ??
          json['productName'] ??
          (json['product'] is Map ? json['product']['name'] : null) ??
          '',
      quantity: _toInt(json['quantity']),
      estimatedLoss: _toDouble(json['estimated_loss'] ?? json['estimatedLoss']),
      reason: json['reason'] ?? '',
      status: json['status'] ?? 'PENDING',
      reportedAt: json['reported_at'] ?? json['reportedAt'] ?? json['created_at'] ?? '',
    );
  }

  String get statusLabel {
    switch (status) {
      case 'PENDING':
        return 'Pending';
      case 'APPROVED':
        return 'Approved';
      case 'REJECTED':
        return 'Rejected';
      default:
        return status;
    }
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
