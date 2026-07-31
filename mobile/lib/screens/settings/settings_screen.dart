import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Profile card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 28,
                    backgroundColor: kLightGreen,
                    child: Text(
                      user?.name.isNotEmpty == true
                          ? user!.name[0].toUpperCase()
                          : 'U',
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w800,
                        color: kPrimaryGreen,
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          user?.name ?? 'User',
                          style: const TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w700,
                            color: kDark,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          user?.email ?? '',
                          style: const TextStyle(color: kMuted, fontSize: 13),
                        ),
                        if (user?.businessName.isNotEmpty == true) ...[
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              const Icon(
                                Icons.storefront_outlined,
                                size: 13,
                                color: kPrimaryGreen,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                user!.businessName,
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: kPrimaryGreen,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Business info section
          _sectionLabel('Business'),
          Card(
            child: Column(
              children: [
                _infoTile(
                  icon: Icons.business_outlined,
                  title: 'Business Name',
                  value: user?.businessName ?? 'Not set',
                ),
                const Divider(height: 1, indent: 56),
                _infoTile(
                  icon: Icons.attach_money_outlined,
                  title: 'Currency',
                  value: user?.currency ?? 'TZS',
                ),
                const Divider(height: 1, indent: 56),
                _infoTile(
                  icon: Icons.public_outlined,
                  title: 'Country',
                  value: user?.business?.country ?? 'Not set',
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Account section
          _sectionLabel('Account'),
          Card(
            child: Column(
              children: [
                _infoTile(
                  icon: Icons.person_outline,
                  title: 'Full Name',
                  value: user?.name ?? '',
                ),
                const Divider(height: 1, indent: 56),
                _infoTile(
                  icon: Icons.email_outlined,
                  title: 'Email',
                  value: user?.email ?? '',
                ),
                const Divider(height: 1, indent: 56),
                _infoTile(
                  icon: Icons.shield_outlined,
                  title: 'Role',
                  value: user?.role ?? '',
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Actions section
          _sectionLabel('Actions'),
          Card(
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.lock_outline, color: kPrimaryGreen),
                  title: const Text('Change Password'),
                  trailing: const Icon(
                    Icons.chevron_right_rounded,
                    color: kMuted,
                    size: 20,
                  ),
                  onTap: () => context.push('/forgot-password'),
                ),
                const Divider(height: 1, indent: 56),
                ListTile(
                  leading: const Icon(
                    Icons.bar_chart_rounded,
                    color: kPrimaryGreen,
                  ),
                  title: const Text('View Reports'),
                  trailing: const Icon(
                    Icons.chevron_right_rounded,
                    color: kMuted,
                    size: 20,
                  ),
                  onTap: () => context.go('/reports'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Logout
          Card(
            child: ListTile(
              leading: Icon(Icons.logout_rounded, color: Colors.red.shade600),
              title: Text(
                'Log Out',
                style: TextStyle(
                  color: Colors.red.shade600,
                  fontWeight: FontWeight.w600,
                ),
              ),
              onTap: () => _confirmLogout(context, auth),
            ),
          ),
          const SizedBox(height: 32),

          // App version
          const Center(
            child: Text(
              'BizTrack v1.0.0',
              style: TextStyle(color: kMuted, fontSize: 12),
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Future<void> _confirmLogout(BuildContext context, AuthProvider auth) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Log Out'),
        content: const Text('Are you sure you want to log out?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Log Out'),
          ),
        ],
      ),
    );
    if (confirmed == true && context.mounted) {
      await auth.logout();
      if (context.mounted) context.go('/login');
    }
  }

  Widget _sectionLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8, left: 4),
      child: Text(
        text.toUpperCase(),
        style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: kMuted,
          letterSpacing: 0.8,
        ),
      ),
    );
  }

  Widget _infoTile({
    required IconData icon,
    required String title,
    required String value,
  }) {
    return ListTile(
      leading: Icon(icon, color: kPrimaryGreen, size: 20),
      title: Text(title, style: const TextStyle(fontSize: 13, color: kMuted)),
      subtitle: Text(
        value,
        style: const TextStyle(
          fontSize: 15,
          fontWeight: FontWeight.w600,
          color: kDark,
        ),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
    );
  }
}
