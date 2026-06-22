import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/models/expense.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/expense_provider.dart';

class ExpensesScreen extends StatefulWidget {
  const ExpensesScreen({super.key});

  @override
  State<ExpensesScreen> createState() => _ExpensesScreenState();
}

class _ExpensesScreenState extends State<ExpensesScreen> {
  String? _selectedCategory;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ExpenseProvider>().fetchExpenses();
    });
  }

  Future<void> _confirmDelete(Expense expense) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Delete expense?'),
        content: Text('Remove "${expense.description}"? This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirm != true || !mounted) return;
    try {
      await context.read<ExpenseProvider>().deleteExpense(expense.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Expense deleted'), backgroundColor: kPrimaryGreen),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final currency = context.watch<AuthProvider>().user?.currency ?? 'USD';
    final fmt = NumberFormat('#,##0.00');
    const accentColor = Color(0xFFD97706); // amber-600

    return Scaffold(
      backgroundColor: kBg,
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/expenses/add'),
        tooltip: 'New Expense',
        backgroundColor: accentColor,
        child: const Icon(Icons.add_rounded),
      ),
      body: Consumer<ExpenseProvider>(
        builder: (context, provider, _) {
          final expenses = provider.filterByCategory(_selectedCategory);
          final total = expenses.fold<double>(0, (sum, e) => sum + e.amount);
          final count = expenses.length;

          return RefreshIndicator(
            onRefresh: provider.fetchExpenses,
            color: accentColor,
            child: CustomScrollView(
              slivers: [
                // ── App bar ──────────────────────────────────────────
                SliverAppBar(
                  pinned: true,
                  expandedHeight: 160,
                  backgroundColor: accentColor,
                  foregroundColor: Colors.white,
                  flexibleSpace: FlexibleSpaceBar(
                    collapseMode: CollapseMode.pin,
                    background: Container(
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          colors: [Color(0xFF92400e), accentColor],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                      ),
                      padding: const EdgeInsets.fromLTRB(20, 60, 20, 16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          const Text('Expenses', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w800)),
                          const SizedBox(height: 8),
                          Text('$currency ${fmt.format(total)}',
                              style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w700)),
                          Text('$count expense${count != 1 ? 's' : ''}',
                              style: const TextStyle(color: Colors.white70, fontSize: 13)),
                        ],
                      ),
                    ),
                  ),
                ),

                // ── Category filter ───────────────────────────────────
                SliverToBoxAdapter(
                  child: Container(
                    color: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    child: SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          _CategoryChip(
                            label: 'All',
                            selected: _selectedCategory == null,
                            onTap: () => setState(() => _selectedCategory = null),
                            color: accentColor,
                          ),
                          ...Expense.categories.map((cat) => Padding(
                            padding: const EdgeInsets.only(left: 8),
                            child: _CategoryChip(
                              label: Expense.categoryLabel(cat),
                              selected: _selectedCategory == cat,
                              onTap: () => setState(() => _selectedCategory = cat),
                              color: accentColor,
                            ),
                          )),
                        ],
                      ),
                    ),
                  ),
                ),

                const SliverToBoxAdapter(child: SizedBox(height: 8)),

                // ── Content ───────────────────────────────────────────
                if (provider.loading)
                  SliverFillRemaining(
                    child: Center(child: CircularProgressIndicator(color: accentColor)),
                  )
                else if (provider.error != null)
                  SliverFillRemaining(
                    child: _ErrorView(message: provider.error!, onRetry: provider.fetchExpenses, color: accentColor),
                  )
                else if (expenses.isEmpty)
                  const SliverFillRemaining(
                    child: _EmptyView(
                      icon: Icons.account_balance_wallet_outlined,
                      message: 'No expenses recorded',
                      hint: 'Tap the + button to log your first expense',
                      color: Color(0xFFD97706),
                    ),
                  )
                else
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
                    sliver: SliverList.builder(
                      itemCount: expenses.length,
                      itemBuilder: (ctx, i) => _ExpenseCard(
                        expense: expenses[i],
                        currency: currency,
                        onTap: () => context.push('/expenses/edit/${expenses[i].id}', extra: expenses[i]),
                        onDelete: () => _confirmDelete(expenses[i]),
                        accentColor: accentColor,
                      ),
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _CategoryChip extends StatelessWidget {
  const _CategoryChip({required this.label, required this.selected, required this.onTap, required this.color});
  final String label;
  final bool selected;
  final VoidCallback onTap;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? color : color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(30),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? Colors.white : color,
            fontWeight: FontWeight.w600,
            fontSize: 12,
          ),
        ),
      ),
    );
  }
}

class _ExpenseCard extends StatelessWidget {
  const _ExpenseCard({required this.expense, required this.currency, required this.onTap, required this.onDelete, required this.accentColor});
  final Expense expense;
  final String currency;
  final VoidCallback onTap;
  final VoidCallback onDelete;
  final Color accentColor;

  @override
  Widget build(BuildContext context) {
    final date = DateTime.tryParse(expense.expenseDate);
    final dateStr = date != null ? DateFormat('MMM d, yyyy').format(date) : expense.expenseDate;

    return Dismissible(
      key: ValueKey(expense.id),
      direction: DismissDirection.endToStart,
      confirmDismiss: (_) async {
        onDelete();
        return false;
      },
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        margin: const EdgeInsets.symmetric(vertical: 5),
        decoration: BoxDecoration(
          color: Colors.red.shade100,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Icon(Icons.delete_outline_rounded, color: Colors.red.shade600, size: 24),
      ),
      child: Card(
        margin: const EdgeInsets.symmetric(vertical: 5),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        elevation: 0,
        color: Colors.white,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: accentColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(Icons.account_balance_wallet_rounded, color: accentColor, size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(expense.description,
                          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: kDark),
                          maxLines: 1, overflow: TextOverflow.ellipsis),
                      const SizedBox(height: 3),
                      Text('$dateStr · ${Expense.categoryLabel(expense.category)}',
                          style: const TextStyle(fontSize: 12, color: kMuted)),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Text('$currency ${NumberFormat('#,##0').format(expense.amount)}',
                    style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: accentColor)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _EmptyView extends StatelessWidget {
  const _EmptyView({required this.icon, required this.message, required this.hint, required this.color});
  final IconData icon;
  final String message;
  final String hint;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(color: color.withValues(alpha: 0.1), shape: BoxShape.circle),
              child: Icon(icon, size: 40, color: color),
            ),
            const SizedBox(height: 20),
            Text(message, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: kDark)),
            const SizedBox(height: 8),
            Text(hint, style: const TextStyle(fontSize: 13, color: kMuted), textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.message, required this.onRetry, required this.color});
  final String message;
  final VoidCallback onRetry;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.wifi_off_rounded, size: 48, color: kMuted),
            const SizedBox(height: 16),
            Text(message, textAlign: TextAlign.center, style: const TextStyle(color: kMuted, fontSize: 13)),
            const SizedBox(height: 20),
            FilledButton(
              style: FilledButton.styleFrom(backgroundColor: color),
              onPressed: onRetry,
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}
