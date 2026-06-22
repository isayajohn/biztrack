class Business {
  final String id;
  final String name;
  final String currency;
  final String country;

  Business({
    required this.id,
    required this.name,
    required this.currency,
    required this.country,
  });

  factory Business.fromJson(Map<String, dynamic> json) {
    return Business(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      currency: json['currency']?.toString() ?? 'USD',
      country: json['country']?.toString() ?? '',
    );
  }
}

class User {
  final String id;
  final String name;
  final String email;
  final String role;
  final String status;
  final Business? business;

  User({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    required this.status,
    this.business,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    // Business may be nested under 'business' or as first item of 'businesses'
    Map<String, dynamic>? businessJson;
    if (json['business'] is Map<String, dynamic>) {
      businessJson = json['business'] as Map<String, dynamic>;
    } else if (json['businesses'] is List && (json['businesses'] as List).isNotEmpty) {
      businessJson = (json['businesses'] as List).first as Map<String, dynamic>;
    }

    return User(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      role: json['role']?.toString() ?? '',
      status: json['status']?.toString() ?? '',
      business: businessJson != null ? Business.fromJson(businessJson) : null,
    );
  }

  String get currency => business?.currency ?? 'USD';
  String get businessName => business?.name ?? 'My Business';
}
