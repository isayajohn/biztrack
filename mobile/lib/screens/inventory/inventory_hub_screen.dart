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
                color: kPrimaryGreen,
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
                  const _MenuItem(
                    icon: Icons.tag_rounded,
                    label: 'Categories',
                    subtitle: 'Organise product types',
                    color: kPrimaryGreen,
                    route: '/inventory/categories',
                  ),
                  const _MenuItem(
                    icon: Icons.add_box_rounded,
                    label: 'Stock In',
                    subtitle: 'Record incoming stock',
                    color: kPrimaryGreen,
                    route: '/inventory/stock-in',
                  ),
                  const _MenuItem(
                    icon: Icons.swap_horiz_rounded,
                    label: 'Movements',
                    subtitle: 'Track stock changes',
                    color: kPrimaryGreen,
                    route: '/inventory/movements',
                  ),
                  const _MenuItem(
                    icon: Icons.tune_rounded,
                    label: 'Brands & Counts',
                    subtitle: 'Brands and stock adjustments',
                    color: kPrimaryGreen,
                    route: '/inventory/management',
                  ),
                ]),
                const SizedBox(height: 20),
                _sectionHeader('Procurement'),
                const SizedBox(height: 8),
                _menuGrid(context, [
                  const _MenuItem(
                    icon: Icons.people_alt_rounded,
                    label: 'Suppliers',
                    subtitle: 'Manage your suppliers',
                    color: kPrimaryGreen,
                    route: '/inventory/suppliers',
                  ),
                  const _MenuItem(
                    icon: Icons.shopping_cart_rounded,
                    label: 'Purchases',
                    subtitle: 'Purchase orders',
                    color: kPrimaryGreen,
                    route: '/inventory/purchases',
                  ),
                ]),
                const SizedBox(height: 20),
                _sectionHeader('Alerts & Losses'),
                const SizedBox(height: 8),
                _menuGrid(context, [
                  const _MenuItem(
                    icon: Icons.warning_amber_rounded,
                    label: 'Low Stock',
                    subtitle: 'Items running low',
                    color: kClay,
                    route: '/inventory/low-stock',
                  ),
                  const _MenuItem(
                    icon: Icons.broken_image_rounded,
                    label: 'Damaged Stock',
                    subtitle: 'Report damaged items',
                    color: kClay,
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
    return Card(
      margin: EdgeInsets.zero,
      child: InkWell(
        onTap: () => context.push(item.route),
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: item.color.withValues(alpha: kBadgeAlpha),
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
      ),
    );
  }
}
