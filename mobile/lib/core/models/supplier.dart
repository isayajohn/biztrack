class Supplier {
  final String id;
  final String name;
  final String? phone;
  final String? email;
  final String? address;
  final double balance;
  final bool isActive;

  const Supplier({
    required this.id,
    required this.name,
    this.phone,
    this.email,
    this.address,
    required this.balance,
    required this.isActive,
  });

  factory Supplier.fromJson(Map<String, dynamic> json) => Supplier(
    id: json['id']?.toString() ?? '',
    name: json['name'] ?? '',
    phone: json['phone'] as String?,
    email: json['email'] as String?,
    address: json['address'] as String?,
    balance: (json['balance'] ?? 0).toDouble(),
    isActive: json['isActive'] ?? json['is_active'] ?? true,
  );
}
