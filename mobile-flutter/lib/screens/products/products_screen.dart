import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/models/product.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/product_provider.dart';

class ProductsScreen extends StatefulWidget {
  const ProductsScreen({super.key});

  @override
  State<ProductsScreen> createState() => _ProductsScreenState();
}

class _ProductsScreenState extends State<ProductsScreen> {
  String _filter = 'all';

  static const _filters = [
    ('all', 'All'),
    ('active', 'Active'),
    ('low-stock', 'Low Stock'),
    ('inactive', 'Inactive'),
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ProductProvider>().fetchProducts();
    });
  }

  List<Product> _filtered(List<Product> products) {
    switch (_filter) {
      case 'active':
        return products.where((p) => p.isActive).toList();
      case 'low-stock':
        return products.where((p) => p.isLowStock).toList();
      case 'inactive':
        return products.where((p) => !p.isActive).toList();
      default:
        return products;
    }
  }

  Future<void> _confirmDelete(BuildContext context, Product p, ProductProvider provider) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Delete product?'),
        content: Text('Delete "${p.name}"? This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirm != true || !context.mounted) return;
    try {
      await provider.deleteProduct(p.id);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${p.name} deleted'), backgroundColor: kPrimaryGreen),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final currency = context.watch<AuthProvider>().user?.currency ?? 'USD';
    const accentColor = Color(0xFF6366F1); // indigo

    return Scaffold(
      backgroundColor: kBg,
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/products/add'),
        tooltip: 'New Product',
        backgroundColor: accentColor,
        child: const Icon(Icons.add_rounded),
      ),
      body: Consumer<ProductProvider>(
        builder: (context, provider, _) {
          final allProducts = provider.products;
          final displayed = _filtered(allProducts);
          final lowCount = allProducts.where((p) => p.isLowStock).length;

          return RefreshIndicator(
            onRefresh: provider.fetchProducts,
            color: accentColor,
            child: CustomScrollView(
              slivers: [
                // ── App bar ──────────────────────────────────────────
                SliverAppBar(
                  pinned: true,
                  expandedHeight: 160,
                  backgroundColor: accentColor,
                  foregroundColor: Colors.white,
                  flexibleSpace: FlexibleSpaceBar(
                    collapseMode: CollapseMode.pin,
                    background: Container(
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          colors: [Color(0xFF3730a3), accentColor],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                      ),
                      padding: const EdgeInsets.fromLTRB(20, 60, 20, 16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          const Text('Products', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w800)),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              _HeaderBadge(label: '${allProducts.length} total', icon: Icons.inventory_2_outlined),
                              const SizedBox(width: 12),
                              if (lowCount > 0)
                                _HeaderBadge(label: '$lowCount low stock', icon: Icons.warning_amber_rounded, color: Colors.orange.shade300),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

                // ── Filter bar ────────────────────────────────────────
                SliverToBoxAdapter(
                  child: Container(
                    color: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    child: SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: _filters.map((f) {
                          final sel = _filter == f.$1;
                          return Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: GestureDetector(
                              onTap: () => setState(() => _filter = f.$1),
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 180),
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                decoration: BoxDecoration(
                                  color: sel ? accentColor : accentColor.withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(30),
                                ),
                                child: Text(
                                  f.$2,
                                  style: TextStyle(
                                    color: sel ? Colors.white : accentColor,
                                    fontWeight: FontWeight.w600,
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                  ),
                ),

                const SliverToBoxAdapter(child: SizedBox(height: 8)),

                // ── Content ───────────────────────────────────────────
                if (provider.loading)
                  SliverFillRemaining(
                    child: Center(child: CircularProgressIndicator(color: accentColor)),
                  )
                else if (provider.error != null)
                  SliverFillRemaining(
                    child: _ErrorView(message: provider.error!, onRetry: provider.fetchProducts, color: accentColor),
                  )
                else if (displayed.isEmpty)
                  const SliverFillRemaining(
                    child: _EmptyView(
                      icon: Icons.inventory_2_outlined,
                      message: 'No products found',
                      hint: 'Tap the + button to add your first product',
                      color: Color(0xFF6366F1),
                    ),
                  )
                else
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
                    sliver: SliverList.builder(
                      itemCount: displayed.length,
                      itemBuilder: (ctx, i) => _ProductCard(
                        product: displayed[i],
                        currency: currency,
                        accentColor: accentColor,
                        onTap: () => context.push('/products/edit/${displayed[i].id}', extra: displayed[i]),
                        onDelete: () => _confirmDelete(ctx, displayed[i], provider),
                      ),
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _HeaderBadge extends StatelessWidget {
  const _HeaderBadge({required this.label, required this.icon, this.color = Colors.white70});
  final String label;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: color),
        const SizedBox(width: 4),
        Text(label, style: TextStyle(color: color, fontSize: 13, fontWeight: FontWeight.w600)),
      ],
    );
  }
}

class _ProductCard extends StatelessWidget {
  const _ProductCard({required this.product, required this.currency, required this.accentColor, required this.onTap, required this.onDelete});
  final Product product;
  final String currency;
  final Color accentColor;
  final VoidCallback onTap;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final isLow = product.isLowStock;
    final isActive = product.isActive;

    return Dismissible(
      key: ValueKey(product.id),
      direction: DismissDirection.endToStart,
      confirmDismiss: (_) async {
        onDelete();
        return false;
      },
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        margin: const EdgeInsets.symmetric(vertical: 5),
        decoration: BoxDecoration(
          color: Colors.red.shade100,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Icon(Icons.delete_outline_rounded, color: Colors.red.shade600, size: 24),
      ),
      child: Card(
        margin: const EdgeInsets.symmetric(vertical: 5),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        elevation: 0,
        color: Colors.white,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: isActive ? accentColor.withValues(alpha: 0.1) : Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    Icons.inventory_2_rounded,
                    color: isActive ? accentColor : kMuted,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(product.name,
                                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: kDark),
                                maxLines: 1, overflow: TextOverflow.ellipsis),
                          ),
                          if (!isActive)
                            _Badge(label: 'Inactive', bg: Colors.grey.shade100, fg: kMuted),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        product.sku != null && product.sku!.isNotEmpty ? 'SKU: ${product.sku}' : 'No SKU',
                        style: const TextStyle(fontSize: 11, color: kMuted),
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          Text(
                            '$currency ${NumberFormat('#,##0').format(product.sellingPrice)}',
                            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: accentColor),
                          ),
                          const Spacer(),
                          _Badge(
                            label: 'Stock ${product.stockQuantity}',
                            bg: isLow ? Colors.red.shade50 : kLightGreen,
                            fg: isLow ? Colors.red.shade700 : kPrimaryGreen,
                            icon: isLow ? Icons.warning_amber_rounded : null,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 6),
                const Icon(Icons.chevron_right_rounded, color: kMuted, size: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  const _Badge({required this.label, required this.bg, required this.fg, this.icon});
  final String label;
  final Color bg;
  final Color fg;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(8)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[Icon(icon, size: 11, color: fg), const SizedBox(width: 3)],
          Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: fg)),
        ],
      ),
    );
  }
}

class _EmptyView extends StatelessWidget {
  const _EmptyView({required this.icon, required this.message, required this.hint, required this.color});
  final IconData icon;
  final String message;
  final String hint;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(color: color.withValues(alpha: 0.1), shape: BoxShape.circle),
              child: Icon(icon, size: 40, color: color),
            ),
            const SizedBox(height: 20),
            Text(message, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: kDark)),
            const SizedBox(height: 8),
            Text(hint, style: const TextStyle(fontSize: 13, color: kMuted), textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.message, required this.onRetry, required this.color});
  final String message;
  final VoidCallback onRetry;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.wifi_off_rounded, size: 48, color: kMuted),
            const SizedBox(height: 16),
            Text(message, textAlign: TextAlign.center, style: const TextStyle(color: kMuted, fontSize: 13)),
            const SizedBox(height: 20),
            FilledButton(
              style: FilledButton.styleFrom(backgroundColor: color),
              onPressed: onRetry,
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}
