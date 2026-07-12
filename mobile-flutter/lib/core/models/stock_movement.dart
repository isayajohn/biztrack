import 'package:flutter/material.dart';

class StockMovement {
  final String id;
  final String productId;
  final String productName;
  final String movementType;
  final int quantity;
  final int stockBefore;
  final int stockAfter;
  final String? reason;
  final String createdAt;

  const StockMovement({
    required this.id,
    required this.productId,
    required this.productName,
    required this.movementType,
    required this.quantity,
    required this.stockBefore,
    required this.stockAfter,
    this.reason,
    required this.createdAt,
  });

  factory StockMovement.fromJson(Map<String, dynamic> json) => StockMovement(
    id: json['id']?.toString() ?? '',
    productId:
        json['productId']?.toString() ?? json['product_id']?.toString() ?? '',
    productName: json['productName'] ?? json['product_name'] ?? '',
    movementType: json['movementType'] ?? json['movement_type'] ?? '',
    quantity: json['quantity'] ?? 0,
    stockBefore: json['stockBefore'] ?? json['stock_before'] ?? 0,
    stockAfter: json['stockAfter'] ?? json['stock_after'] ?? 0,
    reason: json['reason'] as String?,
    createdAt: json['createdAt'] ?? json['created_at'] ?? '',
  );

  bool get isInbound => quantity > 0;

  static Color typeColor(String type) {
    switch (type) {
      case 'STOCK_IN':
      case 'PURCHASE':
      case 'RETURN':
        return const Color(0xFF10B981);
      case 'SALE':
        return const Color(0xFF3B82F6);
      case 'STOCK_OUT':
      case 'DAMAGED':
      case 'EXPIRED':
        return const Color(0xFFEF4444);
      case 'ADJUSTMENT':
        return const Color(0xFF8B5CF6);
      default:
        return const Color(0xFF6B7280);
    }
  }

  String get typeLabel {
    switch (movementType) {
      case 'STOCK_IN':
        return 'Stock In';
      case 'STOCK_OUT':
        return 'Stock Out';
      case 'PURCHASE':
        return 'Purchase';
      case 'SALE':
        return 'Sale';
      case 'RETURN':
        return 'Return';
      case 'DAMAGED':
        return 'Damaged';
      case 'EXPIRED':
        return 'Expired';
      case 'ADJUSTMENT':
        return 'Adjustment';
      default:
        return movementType;
    }
  }
}
