import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/debt_provider.dart';
import '../../widgets/stat_card.dart';

class DebtsOverviewScreen extends StatefulWidget {
  const DebtsOverviewScreen({super.key});

  @override
  State<DebtsOverviewScreen> createState() => _DebtsOverviewScreenState();
}

class _DebtsOverviewScreenState extends State<DebtsOverviewScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DebtProvider>().fetchOverview();
    });
  }

  @override
  Widget build(BuildContext context) {
    final currency = context.watch<AuthProvider>().user?.currency ?? 'TZS';
    final overview = context.watch<DebtProvider>().overview;
    final fmt = NumberFormat('#,##0');

    return Scaffold(
      appBar: AppBar(
        title: const Text('Debts & Credit'),
        leading: IconButton(icon: const Icon(Icons.arrow_back_ios_new_rounded), onPressed: () => context.pop()),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/debts/new'),
        icon: const Icon(Icons.add),
        label: const Text('Record Debt'),
      ),
      body: RefreshIndicator(
        onRefresh: () => context.read<DebtProvider>().fetchOverview(),
        child: overview == null
            ? const Center(child: CircularProgressIndicator(color: kPrimaryGreen))
            : ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    mainAxisSpacing: 10,
                    crossAxisSpacing: 10,
                    childAspectRatio: 1.5,
                    children: [
                      StatCard(title: 'Customer debts', value: '$currency ${fmt.format(overview.totalCustomerDebts)}', icon: Icons.handshake_outlined, iconColor: kPrimaryGreen, onTap: () => context.push('/debts/list?type=CUSTOMER')),
                      StatCard(title: 'Supplier debts', value: '$currency ${fmt.format(overview.totalSupplierDebts)}', icon: Icons.account_balance_outlined, iconColor: kSecondaryGreen, onTap: () => context.push('/debts/list?type=SUPPLIER')),
                      StatCard(title: 'Customer overdue', value: '$currency ${fmt.format(overview.customerOverdueAmount)}', icon: Icons.warning_amber_rounded, iconColor: Colors.red.shade600),
                      StatCard(title: 'Supplier overdue', value: '$currency ${fmt.format(overview.supplierOverdueAmount)}', icon: Icons.warning_amber_rounded, iconColor: Colors.red.shade600),
                      StatCard(title: 'Collected this month', value: '$currency ${fmt.format(overview.collectedThisMonth)}', icon: Icons.trending_up_rounded, iconColor: kPrimaryGreen),
                      StatCard(title: 'Paid to suppliers', value: '$currency ${fmt.format(overview.paidToSuppliersThisMonth)}', icon: Icons.trending_down_rounded, iconColor: kMuted),
                      StatCard(title: 'Due today', value: '${overview.debtsDueToday}', icon: Icons.today_outlined, iconColor: kSun),
                      StatCard(title: 'Due within 7 days', value: '${overview.debtsDueWithin7Days}', icon: Icons.date_range_outlined, iconColor: kSun),
                    ],
                  ),
                  const SizedBox(height: 20),
                  Card(
                    child: ListTile(
                      leading: const Icon(Icons.people_outline, color: kPrimaryGreen),
                      title: const Text('Customer Debts', style: TextStyle(fontWeight: FontWeight.w700)),
                      subtitle: const Text('Receivables owed to you'),
                      trailing: const Icon(Icons.chevron_right_rounded),
                      onTap: () => context.push('/debts/list?type=CUSTOMER'),
                    ),
                  ),
                  Card(
                    child: ListTile(
                      leading: const Icon(Icons.local_shipping_outlined, color: kSecondaryGreen),
                      title: const Text('Supplier Debts', style: TextStyle(fontWeight: FontWeight.w700)),
                      subtitle: const Text('Payables you owe to suppliers'),
                      trailing: const Icon(Icons.chevron_right_rounded),
                      onTap: () => context.push('/debts/list?type=SUPPLIER'),
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}
