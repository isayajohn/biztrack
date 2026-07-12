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
      currency: json['currency']?.toString() ?? 'TZS',
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
  final String businessRole;
  final List<String> permissions;
  final Map<String, dynamic>? branch;
  final Business? business;

  User({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    required this.status,
    this.businessRole = '',
    this.permissions = const [],
    this.branch,
    this.business,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    // Business may be nested under 'business' or as first item of 'businesses'
    Map<String, dynamic>? businessJson;
    if (json['business'] is Map<String, dynamic>) {
      businessJson = json['business'] as Map<String, dynamic>;
    } else if (json['businesses'] is List &&
        (json['businesses'] as List).isNotEmpty) {
      businessJson = (json['businesses'] as List).first as Map<String, dynamic>;
    }

    return User(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      role: json['role']?.toString() ?? '',
      status: json['status']?.toString() ?? '',
      businessRole: json['businessRole']?.toString() ?? '',
      permissions: json['permissions'] is List
          ? List<String>.from(
              (json['permissions'] as List).map((e) => e.toString()),
            )
          : const [],
      branch: json['branch'] is Map
          ? Map<String, dynamic>.from(json['branch'] as Map)
          : null,
      business: businessJson != null ? Business.fromJson(businessJson) : null,
    );
  }

  String get currency => business?.currency ?? 'TZS';
  String get businessName => business?.name ?? 'My Business';
  bool can(String permission) =>
      businessRole == 'OWNER' ||
      permissions.contains('*') ||
      permissions.contains(permission);
}
