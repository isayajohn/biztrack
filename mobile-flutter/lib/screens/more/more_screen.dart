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
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFF0D47A1), Color(0xFF1565C0)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
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
                              backgroundColor: Colors.white.withValues(alpha: 0.25),
                              child: Text(
                                user?.name.isNotEmpty == true ? user!.name[0].toUpperCase() : 'B',
                                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 20),
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(user?.name ?? 'User', style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700)),
                                  Text(user?.businessName ?? 'My Business', style: const TextStyle(color: Colors.white70, fontSize: 13)),
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
                _tile(context, icon: Icons.bar_chart_rounded, color: Colors.indigo.shade600, label: 'Reports & P&L', subtitle: 'Profit, loss & top products', route: '/reports'),
                const SizedBox(height: 20),
                _sectionHeader('Account'),
                const SizedBox(height: 8),
                _tile(context, icon: Icons.notifications_outlined, color: Colors.amber.shade700, label: 'Notifications', subtitle: 'Alerts & stock warnings', route: '/notifications'),
                _tile(context, icon: Icons.settings_outlined, color: kMuted, label: 'Settings', subtitle: 'Profile & business settings', route: '/settings'),
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
    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: kMuted, letterSpacing: 0.5),
  );

  Widget _tile(BuildContext context, {
    required IconData icon,
    required Color color,
    required String label,
    required String subtitle,
    required String route,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [BoxShadow(color: kDark.withValues(alpha: 0.05), blurRadius: 6, offset: const Offset(0, 2))],
      ),
      child: ListTile(
        onTap: () => context.push(route),
        leading: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(12)),
          child: Icon(icon, color: color, size: 22),
        ),
        title: Text(label, style: const TextStyle(fontWeight: FontWeight.w600, color: kDark, fontSize: 14)),
        subtitle: Text(subtitle, style: const TextStyle(color: kMuted, fontSize: 12)),
        trailing: const Icon(Icons.chevron_right_rounded, color: kMuted),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
    );
  }
}
