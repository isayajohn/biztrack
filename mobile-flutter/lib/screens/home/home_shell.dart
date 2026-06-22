import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';

class HomeShell extends StatelessWidget {
  final StatefulNavigationShell navigationShell;

  const HomeShell({super.key, required this.navigationShell});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: kDark.withValues(alpha: 0.07),
              blurRadius: 12,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: SafeArea(
          child: BottomNavigationBar(
            currentIndex: navigationShell.currentIndex,
            onTap: (index) => navigationShell.goBranch(index,
                initialLocation: index == navigationShell.currentIndex),
            type: BottomNavigationBarType.fixed,
            backgroundColor: Colors.white,
            selectedItemColor: kPrimaryGreen,
            unselectedItemColor: kMuted,
            selectedLabelStyle: const TextStyle(
                fontSize: 11, fontWeight: FontWeight.w600),
            unselectedLabelStyle: const TextStyle(fontSize: 11),
            elevation: 0,
            items: const [
              BottomNavigationBarItem(
                icon: Icon(Icons.dashboard_outlined),
                activeIcon: Icon(Icons.dashboard_rounded),
                label: 'Dashboard',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.receipt_long_outlined),
                activeIcon: Icon(Icons.receipt_long_rounded),
                label: 'Sales',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.account_balance_wallet_outlined),
                activeIcon: Icon(Icons.account_balance_wallet_rounded),
                label: 'Expenses',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.inventory_2_outlined),
                activeIcon: Icon(Icons.inventory_2_rounded),
                label: 'Products',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.settings_outlined),
                activeIcon: Icon(Icons.settings_rounded),
                label: 'Settings',
              ),
            ],
          ),
        ),
      ),
    );
  }
}
