class InventoryNotification {
  final String id;
  final String title;
  final String message;
  final String type;
  final bool isRead;
  final String createdAt;

  const InventoryNotification({
    required this.id,
    required this.title,
    required this.message,
    required this.type,
    required this.isRead,
    required this.createdAt,
  });

  factory InventoryNotification.fromJson(Map<String, dynamic> json) =>
      InventoryNotification(
        id: json['id']?.toString() ?? '',
        title: json['title'] ?? '',
        message: json['message'] ?? '',
        type: json['type'] ?? 'GENERAL',
        isRead: json['isRead'] ?? json['is_read'] ?? false,
        createdAt: json['createdAt'] ?? json['created_at'] ?? '',
      );

  InventoryNotification copyWith({bool? isRead}) => InventoryNotification(
    id: id,
    title: title,
    message: message,
    type: type,
    isRead: isRead ?? this.isRead,
    createdAt: createdAt,
  );
}
