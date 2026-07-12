import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../core/api/api_client.dart';
import '../../core/models/dashboard_stats.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/stat_card.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  DashboardStats? _stats;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final client = context.read<ApiClient>();
      final raw = await client.get('/dashboard');
      if (mounted) {
        setState(() {
          _stats = raw is Map<String, dynamic>
              ? DashboardStats.fromJson(raw)
              : DashboardStats.empty();
        });
      }
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _fmt(double v, String currency) {
    return '$currency ${NumberFormat('#,##0.00').format(v)}';
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final currency = user?.currency ?? 'TZS';
    final firstName = user?.name.split(' ').first ?? 'there';

    return Scaffold(
      appBar: AppBar(
        title: const Text('BizTrack'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: CircleAvatar(
              radius: 16,
              backgroundColor: Colors.white.withValues(alpha: 0.25),
              child: Text(
                user?.name.isNotEmpty == true
                    ? user!.name[0].toUpperCase()
                    : 'B',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadStats,
        color: kPrimaryGreen,
        child: _loading
            ? const Center(
                child: CircularProgressIndicator(color: kPrimaryGreen),
              )
            : _error != null
            ? _buildError()
            : _buildContent(firstName, currency),
      ),
    );
  }

  Widget _buildError() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.cloud_off_outlined, size: 48, color: kMuted),
            const SizedBox(height: 12),
            Text(
              _error!,
              textAlign: TextAlign.center,
              style: const TextStyle(color: kMuted),
            ),
            const SizedBox(height: 16),
            ElevatedButton(onPressed: _loadStats, child: const Text('Retry')),
          ],
        ),
      ),
    );
  }

  Widget _buildContent(String firstName, String currency) {
    final stats = _stats ?? DashboardStats.empty();

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Greeting
        Text(
          'Hello, $firstName!',
          style: const TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w800,
            color: kDark,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          DateFormat('EEEE, MMMM d').format(DateTime.now()),
          style: const TextStyle(color: kMuted, fontSize: 13),
        ),
        const SizedBox(height: 20),

        // Profit hero card
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [kPrimaryGreen, kPrimaryGreen.withGreen(160)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(
                    Icons.trending_up_rounded,
                    color: Colors.white70,
                    size: 18,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    'Net Profit',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.8),
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                _fmt(stats.profit, currency),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 30,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -1,
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  _miniStat(
                    icon: Icons.arrow_upward_rounded,
                    label: 'Sales',
                    value: _fmt(stats.totalSales, currency),
                    color: Colors.greenAccent.shade200,
                  ),
                  const SizedBox(width: 16),
                  _miniStat(
                    icon: Icons.arrow_downward_rounded,
                    label: 'Expenses',
                    value: _fmt(stats.totalExpenses, currency),
                    color: Colors.orange.shade200,
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Stat cards grid
        GridView.count(
          crossAxisCount: 2,
          crossAxisSpacing: 10,
          mainAxisSpacing: 0,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          childAspectRatio: 1.3,
          children: [
            StatCard(
              title: 'Total Sales',
              value: stats.salesCount.toString(),
              icon: Icons.receipt_long_rounded,
              onTap: () => context.go('/sales'),
            ),
            StatCard(
              title: 'Total Expenses',
              value: stats.expensesCount.toString(),
              icon: Icons.account_balance_wallet_rounded,
              iconColor: Colors.orange.shade600,
              onTap: () => context.go('/expenses'),
            ),
            StatCard(
              title: 'Products',
              value: stats.totalProducts.toString(),
              icon: Icons.inventory_2_rounded,
              iconColor: Colors.blue.shade600,
              onTap: () => context.go('/inventory'),
            ),
            StatCard(
              title: 'Low Stock',
              value: stats.lowStockCount.toString(),
              icon: Icons.warning_amber_rounded,
              iconColor: stats.lowStockCount > 0 ? Colors.red.shade500 : kMuted,
              valueColor: stats.lowStockCount > 0 ? Colors.red.shade600 : kDark,
              onTap: () => context.push('/inventory/low-stock'),
            ),
          ],
        ),
        const SizedBox(height: 20),

        // Quick actions
        const Text(
          'Quick Actions',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: kDark,
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _quickAction(
                icon: Icons.add_circle_rounded,
                label: 'New Sale',
                color: kPrimaryGreen,
                onTap: () => context.push('/sales/add'),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _quickAction(
                icon: Icons.remove_circle_rounded,
                label: 'New Expense',
                color: Colors.orange.shade700,
                onTap: () => context.push('/expenses/add'),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _quickAction(
                icon: Icons.add_box_rounded,
                label: 'New Product',
                color: Colors.blue.shade700,
                onTap: () => context.push('/products/add'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 20),
      ],
    );
  }

  Widget _miniStat({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Expanded(
      child: Row(
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 4),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.7),
                    fontSize: 10,
                  ),
                ),
                Text(
                  value,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _quickAction({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 6),
            Text(
              label,
              style: TextStyle(
                color: color,
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
