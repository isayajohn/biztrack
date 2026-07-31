import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/models/debt.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/debt_provider.dart';

class DebtsListScreen extends StatefulWidget {
  final String initialType;
  const DebtsListScreen({super.key, this.initialType = 'CUSTOMER'});

  @override
  State<DebtsListScreen> createState() => _DebtsListScreenState();
}

class _DebtsListScreenState extends State<DebtsListScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _search = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this, initialIndex: widget.initialType == 'SUPPLIER' ? 1 : 0);
    WidgetsBinding.instance.addPostFrameCallback((_) => context.read<DebtProvider>().fetchDebts());
  }

  @override
  void dispose() {
    _tabController.dispose();
    _search.dispose();
    super.dispose();
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'PAID':
        return kPrimaryGreen;
      case 'PARTIALLY_PAID':
        return kSun;
      case 'OVERDUE':
        return Colors.red.shade600;
      case 'DISPUTED':
        return Colors.purple;
      case 'WRITTEN_OFF':
      case 'CANCELLED':
        return kMuted;
      default:
        return kSecondaryGreen;
    }
  }

  @override
  Widget build(BuildContext context) {
    final currency = context.watch<AuthProvider>().user?.currency ?? 'TZS';
    final fmt = NumberFormat('#,##0');

    return Scaffold(
      appBar: AppBar(
        title: const Text('Debts'),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          tabs: const [Tab(text: 'Customers'), Tab(text: 'Suppliers')],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/debts/new'),
        child: const Icon(Icons.add),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              controller: _search,
              decoration: const InputDecoration(
                prefixIcon: Icon(Icons.search),
                hintText: 'Search debt # or name',
                isDense: true,
              ),
              onSubmitted: (v) => context.read<DebtProvider>().fetchDebts(search: v),
            ),
          ),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _list(context, context.watch<DebtProvider>().customerDebts, currency, fmt),
                _list(context, context.watch<DebtProvider>().supplierDebts, currency, fmt),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _list(BuildContext context, List<Debt> debts, String currency, NumberFormat fmt) {
    final provider = context.watch<DebtProvider>();
    if (provider.loading && debts.isEmpty) {
      return const Center(child: CircularProgressIndicator(color: kPrimaryGreen));
    }
    if (debts.isEmpty) {
      return RefreshIndicator(
        onRefresh: () => context.read<DebtProvider>().fetchDebts(),
        child: ListView(
          children: const [
            Padding(
              padding: EdgeInsets.all(60),
              child: Center(child: Text('No debts yet', style: TextStyle(color: kMuted))),
            ),
          ],
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: () => context.read<DebtProvider>().fetchDebts(),
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: debts.length,
        separatorBuilder: (_, __) => const SizedBox(height: 8),
        itemBuilder: (_, i) {
          final d = debts[i];
          return Card(
            child: ListTile(
              onTap: () => context.push('/debts/${d.id}'),
              title: Text(d.debtNumber, style: const TextStyle(fontWeight: FontWeight.w700)),
              subtitle: Text('${d.partyName}\nDue: ${d.dueDate ?? "—"}'),
              isThreeLine: true,
              trailing: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('$currency ${fmt.format(d.outstandingBalance)}', style: const TextStyle(fontWeight: FontWeight.w700, color: kDark)),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(color: _statusColor(d.status).withValues(alpha: kBadgeAlpha), borderRadius: BorderRadius.circular(20)),
                    child: Text(Debt.statusLabel(d.status), style: TextStyle(color: _statusColor(d.status), fontSize: 11, fontWeight: FontWeight.w700)),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
