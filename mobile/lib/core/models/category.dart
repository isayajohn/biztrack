class Category {
  final String id;
  final String name;
  final String? description;
  final bool isActive;
  final int productCount;

  const Category({
    required this.id,
    required this.name,
    this.description,
    required this.isActive,
    required this.productCount,
  });

  factory Category.fromJson(Map<String, dynamic> json) {
    return Category(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? '',
      description: json['description'] as String?,
      isActive: json['isActive'] ?? json['is_active'] ?? true,
      productCount: json['productCount'] ?? json['product_count'] ?? 0,
    );
  }
}
