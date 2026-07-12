import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';

class InventoryHubScreen extends StatelessWidget {
  const InventoryHubScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBg,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 120,
            pinned: true,
            automaticallyImplyLeading: false,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [kSecondaryGreen, kPrimaryGreen],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: const SafeArea(
                  child: Padding(
                    padding: EdgeInsets.fromLTRB(20, 16, 20, 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        Text(
                          'Inventory',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 26,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        Text(
                          'Manage stock, suppliers & purchases',
                          style: TextStyle(color: Colors.white70, fontSize: 13),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.all(16),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                _sectionHeader('Products & Stock'),
                const SizedBox(height: 8),
                _menuGrid(context, [
                  _MenuItem(
                    icon: Icons.inventory_2_rounded,
                    label: 'Products',
                    subtitle: 'View & manage products',
                    color: kPrimaryGreen,
                    route: '/products',
                  ),
                  _MenuItem(
                    icon: Icons.tag_rounded,
                    label: 'Categories',
                    subtitle: 'Organise product types',
                    color: Colors.blue.shade600,
                    route: '/inventory/categories',
                  ),
                  _MenuItem(
                    icon: Icons.add_box_rounded,
                    label: 'Stock In',
                    subtitle: 'Record incoming stock',
                    color: Colors.teal.shade600,
                    route: '/inventory/stock-in',
                  ),
                  _MenuItem(
                    icon: Icons.swap_horiz_rounded,
                    label: 'Movements',
                    subtitle: 'Track stock changes',
                    color: Colors.indigo.shade600,
                    route: '/inventory/movements',
                  ),
                  const _MenuItem(
                    icon: Icons.tune_rounded,
                    label: 'Brands & Counts',
                    subtitle: 'Brands and stock adjustments',
                    color: kClay,
                    route: '/inventory/management',
                  ),
                ]),
                const SizedBox(height: 20),
                _sectionHeader('Procurement'),
                const SizedBox(height: 8),
                _menuGrid(context, [
                  _MenuItem(
                    icon: Icons.people_alt_rounded,
                    label: 'Suppliers',
                    subtitle: 'Manage your suppliers',
                    color: const Color(0xFF7C3AED),
                    route: '/inventory/suppliers',
                  ),
                  _MenuItem(
                    icon: Icons.shopping_cart_rounded,
                    label: 'Purchases',
                    subtitle: 'Purchase orders',
                    color: Colors.orange.shade700,
                    route: '/inventory/purchases',
                  ),
                ]),
                const SizedBox(height: 20),
                _sectionHeader('Alerts & Losses'),
                const SizedBox(height: 8),
                _menuGrid(context, [
                  _MenuItem(
                    icon: Icons.warning_amber_rounded,
                    label: 'Low Stock',
                    subtitle: 'Items running low',
                    color: Colors.red.shade600,
                    route: '/inventory/low-stock',
                  ),
                  _MenuItem(
                    icon: Icons.broken_image_rounded,
                    label: 'Damaged Stock',
                    subtitle: 'Report damaged items',
                    color: Colors.brown.shade600,
                    route: '/inventory/damaged-stock',
                  ),
                ]),
                const SizedBox(height: 24),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _sectionHeader(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w700,
        color: kMuted,
        letterSpacing: 0.5,
      ),
    );
  }

  Widget _menuGrid(BuildContext context, List<_MenuItem> items) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      childAspectRatio: 1.55,
      children: items.map((item) => _MenuCard(item: item)).toList(),
    );
  }
}

class _MenuItem {
  final IconData icon;
  final String label;
  final String subtitle;
  final Color color;
  final String route;

  const _MenuItem({
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.color,
    required this.route,
  });
}

class _MenuCard extends StatelessWidget {
  final _MenuItem item;
  const _MenuCard({required this.item});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push(item.route),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: kDark.withValues(alpha: 0.06),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: item.color.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(item.icon, color: item.color, size: 22),
            ),
            const Spacer(),
            Text(
              item.label,
              style: const TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 13,
                color: kDark,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              item.subtitle,
              style: const TextStyle(fontSize: 10, color: kMuted),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
