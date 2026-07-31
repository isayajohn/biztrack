class DebtPayment {
  final String id;
  final String debtId;
  final double amount;
  final String paymentDate;
  final String paymentMethod;
  final String? transactionReference;
  final String? notes;
  final bool isReversed;
  final String? reversalReason;
  final String? createdAt;

  DebtPayment({
    required this.id,
    required this.debtId,
    required this.amount,
    required this.paymentDate,
    required this.paymentMethod,
    this.transactionReference,
    this.notes,
    this.isReversed = false,
    this.reversalReason,
    this.createdAt,
  });

  factory DebtPayment.fromJson(Map<String, dynamic> json) => DebtPayment(
    id: json['id']?.toString() ?? '',
    debtId: json['debtId']?.toString() ?? '',
    amount: _toDouble(json['amount']),
    paymentDate: json['paymentDate']?.toString() ?? '',
    paymentMethod: json['paymentMethod']?.toString() ?? 'CASH',
    transactionReference: json['transactionReference']?.toString(),
    notes: json['notes']?.toString(),
    isReversed: json['isReversed'] == true,
    reversalReason: json['reversalReason']?.toString(),
    createdAt: json['createdAt']?.toString(),
  );

  static double _toDouble(dynamic v) {
    if (v == null) return 0.0;
    if (v is double) return v;
    if (v is int) return v.toDouble();
    return double.tryParse(v.toString()) ?? 0.0;
  }

  static const List<String> methods = ['CASH', 'MOBILE_MONEY', 'BANK', 'OTHER'];
}
