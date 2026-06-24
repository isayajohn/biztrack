import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/api/api_client.dart';
import '../../core/api/purchase_api.dart';
import '../../core/models/purchase.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';

class PurchasesScreen extends StatefulWidget {
  const PurchasesScreen({super.key});

  @override
  State<PurchasesScreen> createState() => _PurchasesScreenState();
}

class _PurchasesScreenState extends State<PurchasesScreen> {
  List<Purchase> _purchases = [];
  bool _loading = true;
  String? _error;
  late PurchaseApi _api;

  @override
  void initState() {
    super.initState();
    _api = PurchaseApi(context.read<ApiClient>());
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final list = await _api.getPurchases();
      if (mounted) setState(() => _purchases = list);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final currency = context.watch<AuthProvider>().user?.currency ?? 'USD';

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 130,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Colors.orange.shade800, Colors.orange.shade600],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 48, 20, 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Purchases', style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800)),
                        const SizedBox(height: 4),
                        Text(
                          '${_purchases.length} order${_purchases.length == 1 ? '' : 's'}',
                          style: const TextStyle(color: Colors.white70, fontSize: 13),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
          if (_loading)
            const SliverFillRemaining(child: Center(child: CircularProgressIndicator(color: kPrimaryGreen)))
          else if (_error != null)
            SliverFillRemaining(
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(mainAxisSize: MainAxisSize.min, children: [
                    const Icon(Icons.cloud_off_outlined, size: 48, color: kMuted),
                    const SizedBox(height: 12),
                    Text(_error!, textAlign: TextAlign.center, style: const TextStyle(color: kMuted)),
                    const SizedBox(height: 16),
                    ElevatedButton(onPressed: _load, child: const Text('Retry')),
                  ]),
                ),
              ),
            )
          else if (_purchases.isEmpty)
            const SliverFillRemaining(
              child: Center(
                child: Padding(
                  padding: EdgeInsets.all(32),
                  child: Column(mainAxisSize: MainAxisSize.min, children: [
                    Icon(Icons.shopping_cart_outlined, size: 64, color: kMuted),
                    SizedBox(height: 16),
                    Text('No purchases yet', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: kDark)),
                    SizedBox(height: 8),
                    Text('Purchase orders will appear here.', style: TextStyle(color: kMuted), textAlign: TextAlign.center),
                  ]),
                ),
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.all(16),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (_, i) => _PurchaseCard(purchase: _purchases[i], currency: currency),
                  childCount: _purchases.length,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _PurchaseCard extends StatelessWidget {
  final Purchase purchase;
  final String currency;
  const _PurchaseCard({required this.purchase, required this.currency});

  Color get _statusColor {
    switch (purchase.status) {
      case 'RECEIVED': return Colors.green.shade600;
      case 'CANCELLED': return Colors.red.shade600;
      default: return Colors.orange.shade700;
    }
  }

  @override
  Widget build(BuildContext context) {
    final fmt = NumberFormat('#,##0.00');
    String dateStr = '';
    try {
      final d = DateTime.parse(purchase.purchaseDate);
      dateStr = DateFormat('MMM d, yyyy').format(d);
    } catch (_) {
      dateStr = purchase.purchaseDate;
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    purchase.supplierName ?? 'Unknown Supplier',
                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: kDark),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: _statusColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(purchase.statusLabel, style: TextStyle(color: _statusColor, fontSize: 11, fontWeight: FontWeight.w700)),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.calendar_today_outlined, size: 13, color: kMuted),
                const SizedBox(width: 4),
                Text(dateStr, style: const TextStyle(color: kMuted, fontSize: 12)),
                const Spacer(),
                Text(
                  '$currency ${fmt.format(purchase.totalAmount)}',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: kDark),
                ),
              ],
            ),
            if (purchase.items.isNotEmpty) ...[
              const SizedBox(height: 8),
              const Divider(height: 1),
              const SizedBox(height: 8),
              ...purchase.items.take(3).map((item) => Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Row(
                  children: [
                    const Icon(Icons.circle, size: 6, color: kMuted),
                    const SizedBox(width: 6),
                    Expanded(child: Text(item.productName, style: const TextStyle(fontSize: 12, color: kDark))),
                    Text('x${item.quantity}', style: const TextStyle(fontSize: 12, color: kMuted)),
                    const SizedBox(width: 8),
                    Text('$currency ${fmt.format(item.totalCost)}', style: const TextStyle(fontSize: 12, color: kMuted)),
                  ],
                ),
              )),
              if (purchase.items.length > 3)
                Text('+ ${purchase.items.length - 3} more items', style: const TextStyle(fontSize: 11, color: kMuted)),
            ],
          ],
        ),
      ),
    );
  }
}
