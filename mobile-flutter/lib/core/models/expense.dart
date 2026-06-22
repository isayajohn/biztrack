class Expense {
  final String id;
  final String category;
  final String description;
  final double amount;
  final String paymentMethod;
  final String expenseDate;
  final String? notes;

  Expense({
    required this.id,
    required this.category,
    required this.description,
    required this.amount,
    required this.paymentMethod,
    required this.expenseDate,
    this.notes,
  });

  factory Expense.fromJson(Map<String, dynamic> json) {
    return Expense(
      id: json['id']?.toString() ?? '',
      category: json['category'] ?? 'OTHER',
      description: json['description'] ?? '',
      amount: _toDouble(json['amount']),
      paymentMethod:
          json['payment_method'] ?? json['paymentMethod'] ?? 'CASH',
      expenseDate: json['expense_date'] ?? json['expenseDate'] ?? '',
      notes: json['notes'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'category': category,
      'description': description,
      'amount': amount,
      'payment_method': paymentMethod,
      'expense_date': expenseDate,
      'notes': notes,
    };
  }

  static double _toDouble(dynamic v) {
    if (v == null) return 0.0;
    if (v is double) return v;
    if (v is int) return v.toDouble();
    return double.tryParse(v.toString()) ?? 0.0;
  }

  static String categoryLabel(String category) {
    switch (category) {
      case 'STOCK_PURCHASE':
        return 'Stock Purchase';
      case 'RENT':
        return 'Rent';
      case 'TRANSPORT':
        return 'Transport';
      case 'SALARY':
        return 'Salary';
      case 'ELECTRICITY':
        return 'Electricity';
      case 'INTERNET':
        return 'Internet';
      case 'FOOD':
        return 'Food';
      case 'MARKETING':
        return 'Marketing';
      case 'OTHER':
        return 'Other';
      default:
        return category
            .split('_')
            .map((w) => w[0].toUpperCase() + w.substring(1).toLowerCase())
            .join(' ');
    }
  }

  static const List<String> categories = [
    'STOCK_PURCHASE',
    'RENT',
    'TRANSPORT',
    'SALARY',
    'ELECTRICITY',
    'INTERNET',
    'FOOD',
    'MARKETING',
    'OTHER',
  ];

  static const List<String> paymentMethods = [
    'CASH',
    'MOBILE_MONEY',
    'BANK',
    'CREDIT',
  ];

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
}
