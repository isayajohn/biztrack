import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';

class MoreScreen extends StatelessWidget {
  const MoreScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;

    return Scaffold(
      backgroundColor: kBg,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 140,
            pinned: true,
            automaticallyImplyLeading: false,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                color: kPrimaryGreen,
                child: SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        Row(
                          children: [
                            CircleAvatar(
                              radius: 24,
                              backgroundColor: Colors.white.withValues(
                                alpha: 0.25,
                              ),
                              child: Text(
                                user?.name.isNotEmpty == true
                                    ? user!.name[0].toUpperCase()
                                    : 'B',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w700,
                                  fontSize: 20,
                                ),
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    user?.name ?? 'User',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 18,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                  Text(
                                    user?.businessName ?? 'My Business',
                                    style: const TextStyle(
                                      color: Colors.white70,
                                      fontSize: 13,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
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
                _sectionHeader('Analytics'),
                const SizedBox(height: 8),
                _tile(
                  context,
                  icon: Icons.bar_chart_rounded,
                  color: kPrimaryGreen,
                  label: 'Reports & P&L',
                  subtitle: 'Profit, loss & top products',
                  route: '/reports',
                ),
                _tile(
                  context,
                  icon: Icons.account_balance_wallet_outlined,
                  color: kPrimaryGreen,
                  label: 'Cash Flow & Purchases',
                  subtitle: 'Cash movements and purchase analytics',
                  route: '/reports/advanced',
                ),
                if (user?.can('customers.view') == true)
                  _tile(
                    context,
                    icon: Icons.people_outline,
                    color: kPrimaryGreen,
                    label: 'Customers & Credit',
                    subtitle: 'Customers, balances and repayments',
                    route: '/customers',
                  ),
                if (user?.can('promotions.manage') == true)
                  _tile(
                    context,
                    icon: Icons.local_offer_outlined,
                    color: kPrimaryGreen,
                    label: 'Promotions',
                    subtitle: 'Discount codes and campaigns',
                    route: '/promotions',
                  ),
                if (user?.can('branches.manage') == true ||
                    user?.can('staff.manage') == true)
                  _tile(
                    context,
                    icon: Icons.corporate_fare_outlined,
                    color: kPrimaryGreen,
                    label: 'Branches & Staff',
                    subtitle: 'Locations, roles and permissions',
                    route: '/organization',
                  ),
                const SizedBox(height: 20),
                _sectionHeader('Account'),
                const SizedBox(height: 8),
                _tile(
                  context,
                  icon: Icons.notifications_outlined,
                  color: kPrimaryGreen,
                  label: 'Notifications',
                  subtitle: 'Alerts & stock warnings',
                  route: '/notifications',
                ),
                _tile(
                  context,
                  icon: Icons.settings_outlined,
                  color: kMuted,
                  label: 'Settings',
                  subtitle: 'Profile & business settings',
                  route: '/settings',
                ),
                const SizedBox(height: 24),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _sectionHeader(String title) => Text(
    title,
    style: const TextStyle(
      fontSize: 13,
      fontWeight: FontWeight.w700,
      color: kMuted,
      letterSpacing: 0.5,
    ),
  );

  Widget _tile(
    BuildContext context, {
    required IconData icon,
    required Color color,
    required String label,
    required String subtitle,
    required String route,
  }) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        onTap: () => context.push(route),
        leading: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: color.withValues(alpha: kBadgeAlpha),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: color, size: 22),
        ),
        title: Text(
          label,
          style: const TextStyle(
            fontWeight: FontWeight.w600,
            color: kDark,
            fontSize: 14,
          ),
        ),
        subtitle: Text(
          subtitle,
          style: const TextStyle(color: kMuted, fontSize: 12),
        ),
        trailing: const Icon(Icons.chevron_right_rounded, color: kMuted),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
    );
  }
}
