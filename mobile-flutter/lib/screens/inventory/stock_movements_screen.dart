import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../core/models/stock_movement.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/inventory_provider.dart';

class StockMovementsScreen extends StatefulWidget {
  const StockMovementsScreen({super.key});

  @override
  State<StockMovementsScreen> createState() => _StockMovementsScreenState();
}

class _StockMovementsScreenState extends State<StockMovementsScreen> {
  String _selectedFilter = '';

  static const List<_FilterOption> _filters = [
    _FilterOption(label: 'All', value: ''),
    _FilterOption(label: 'Stock In', value: 'STOCK_IN'),
    _FilterOption(label: 'Sale', value: 'SALE'),
    _FilterOption(label: 'Purchase', value: 'PURCHASE'),
    _FilterOption(label: 'Damaged', value: 'DAMAGED'),
    _FilterOption(label: 'Adjustment', value: 'ADJUSTMENT'),
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadMovements();
    });
  }

  void _loadMovements() {
    context.read<InventoryProvider>().fetchMovements(
      movementType: _selectedFilter.isEmpty ? null : _selectedFilter,
    );
  }

  Future<void> _refresh() async {
    context.read<InventoryProvider>().fetchMovements(
      movementType: _selectedFilter.isEmpty ? null : _selectedFilter,
    );
  }

  void _selectFilter(String value) {
    if (_selectedFilter == value) return;
    setState(() => _selectedFilter = value);
    context.read<InventoryProvider>().fetchMovements(
      movementType: value.isEmpty ? null : value,
    );
  }

  String _formatDate(String raw) {
    if (raw.isEmpty) return '';
    try {
      final dt = DateTime.parse(raw).toLocal();
      return DateFormat('MMM d, yyyy h:mm a').format(dt);
    } catch (_) {
      return raw;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Stock Movements'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          onPressed: () => context.pop(),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline_rounded),
            onPressed: () => context.push('/inventory/stock-in'),
            tooltip: 'Add Stock',
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter pills
          SizedBox(
            height: 52,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              scrollDirection: Axis.horizontal,
              itemCount: _filters.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (_, i) {
                final f = _filters[i];
                final selected = _selectedFilter == f.value;
                return GestureDetector(
                  onTap: () => _selectFilter(f.value),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: selected ? kPrimaryGreen : Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: selected
                            ? kPrimaryGreen
                            : const Color(0xFFE5E7EB),
                      ),
                    ),
                    child: Text(
                      f.label,
                      style: TextStyle(
                        color: selected ? Colors.white : kMuted,
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          const Divider(height: 1),
          // Content
          Expanded(
            child: Consumer<InventoryProvider>(
              builder: (context, provider, _) {
                if (provider.loading && provider.movements.isEmpty) {
                  return const Center(
                    child: CircularProgressIndicator(color: kPrimaryGreen),
                  );
                }

                if (provider.error != null && provider.movements.isEmpty) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.cloud_off_outlined,
                            size: 48,
                            color: kMuted,
                          ),
                          const SizedBox(height: 12),
                          Text(
                            provider.error!,
                            textAlign: TextAlign.center,
                            style: const TextStyle(color: kMuted),
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton(
                            onPressed: _refresh,
                            child: const Text('Retry'),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                if (provider.movements.isEmpty) {
                  return RefreshIndicator(
                    onRefresh: _refresh,
                    color: kPrimaryGreen,
                    child: ListView(
                      children: const [
                        SizedBox(height: 120),
                        Center(
                          child: Column(
                            children: [
                              Icon(
                                Icons.swap_horiz_rounded,
                                size: 56,
                                color: kMuted,
                              ),
                              SizedBox(height: 16),
                              Text(
                                'No movements found',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                  color: kDark,
                                ),
                              ),
                              SizedBox(height: 6),
                              Text(
                                'Stock movements will appear here.',
                                style: TextStyle(color: kMuted),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  );
                }

                return RefreshIndicator(
                  onRefresh: _refresh,
                  color: kPrimaryGreen,
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    itemCount: provider.movements.length,
                    itemBuilder: (_, i) {
                      final m = provider.movements[i];
                      return _MovementCard(
                        movement: m,
                        formattedDate: _formatDate(m.createdAt),
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _MovementCard extends StatelessWidget {
  final StockMovement movement;
  final String formattedDate;

  const _MovementCard({required this.movement, required this.formattedDate});

  @override
  Widget build(BuildContext context) {
    final color = StockMovement.typeColor(movement.movementType);
    final isPositive = movement.quantity > 0;
    final qtyColor = isPositive
        ? const Color(0xFF10B981)
        : const Color(0xFFEF4444);
    final qtyPrefix = isPositive ? '+' : '';

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: IntrinsicHeight(
        child: Row(
          children: [
            // Left colored bar
            Container(
              width: 4,
              decoration: BoxDecoration(
                color: color,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(16),
                  bottomLeft: Radius.circular(16),
                ),
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            movement.productName,
                            style: const TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 14,
                              color: kDark,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          '$qtyPrefix${movement.quantity}',
                          style: TextStyle(
                            color: qtyColor,
                            fontWeight: FontWeight.w800,
                            fontSize: 16,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        _TypeBadge(label: movement.typeLabel, color: color),
                        const Spacer(),
                        Text(
                          '${movement.stockBefore} → ${movement.stockAfter}',
                          style: const TextStyle(color: kMuted, fontSize: 12),
                        ),
                        const SizedBox(width: 4),
                        const Icon(
                          Icons.arrow_right_alt_rounded,
                          color: kMuted,
                          size: 16,
                        ),
                      ],
                    ),
                    if (movement.reason != null &&
                        movement.reason!.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        movement.reason!,
                        style: const TextStyle(color: kMuted, fontSize: 11),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                    const SizedBox(height: 4),
                    Text(
                      formattedDate,
                      style: const TextStyle(color: kMuted, fontSize: 11),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TypeBadge extends StatelessWidget {
  final String label;
  final Color color;

  const _TypeBadge({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _FilterOption {
  final String label;
  final String value;
  const _FilterOption({required this.label, required this.value});
}
