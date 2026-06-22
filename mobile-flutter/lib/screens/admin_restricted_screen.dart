import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/theme/app_theme.dart';
import '../providers/auth_provider.dart';

class AdminRestrictedScreen extends StatelessWidget {
  const AdminRestrictedScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;

    return Scaffold(
      backgroundColor: kBg,
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.all(28),
                  decoration: const BoxDecoration(color: kLightGreen, shape: BoxShape.circle),
                  child: const Icon(Icons.admin_panel_settings_rounded, size: 52, color: kPrimaryGreen),
                ),
                const SizedBox(height: 28),
                const Text(
                  'Super Admin Account',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: kDark),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
                Text(
                  'Hi ${user?.name ?? 'Admin'}, this mobile app is for business owners.\n\nAs a Super Admin, please use the web dashboard to manage businesses, users, subscriptions, and platform settings.',
                  style: const TextStyle(fontSize: 14, color: kMuted, height: 1.6),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: kLightGreen, width: 1.5),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.language_rounded, color: kPrimaryGreen, size: 20),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Web Admin Panel', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: kDark)),
                            Text(kApiBaseUrl.replaceAll('/api', ''), style: const TextStyle(fontSize: 12, color: kMuted)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                OutlinedButton.icon(
                  onPressed: () async {
                    final auth = context.read<AuthProvider>();
                    await auth.logout();
                  },
                  icon: const Icon(Icons.logout_rounded),
                  label: const Text('Sign Out'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.red,
                    side: const BorderSide(color: Colors.red),
                    minimumSize: const Size.fromHeight(48),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
