import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/api/business_api.dart';
import '../../providers/auth_provider.dart';
import '../../core/theme/app_theme.dart';

class AdvancedReportsScreen extends StatefulWidget {
  const AdvancedReportsScreen({super.key});
  @override
  State<AdvancedReportsScreen> createState() => _State();
}

class _State extends State<AdvancedReportsScreen> {
  Map<String, dynamic>? cash, purchases;
  bool loading = true;
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => load());
  }

  Future<void> load() async {
    final api = BusinessApi(context.read());
    final now = DateTime.now(),
        start = DateTime(now.year, now.month, 1),
        fmt = DateFormat('yyyy-MM-dd');
    try {
      final values = await Future.wait([
        api.cashFlow(fmt.format(start), fmt.format(now)),
        api.purchaseReport(fmt.format(start), fmt.format(now)),
      ]);
      cash = values[0];
      purchases = values[1];
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    }
    if (mounted) setState(() => loading = false);
  }

  @override
  Widget build(BuildContext c) {
    final currency = context.watch<AuthProvider>().user?.currency ?? 'TZS',
        nf = NumberFormat('#,##0.00');
    final cs = cash?['summary'] as Map?, ps = purchases?['summary'] as Map?;
    return Scaffold(
      appBar: AppBar(title: const Text('Cash Flow & Purchases')),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: load,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  const Text(
                    'This month cash flow',
                    style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: _metric(
                          'Cash in',
                          '$currency ${nf.format(cs?['totalInflow'] ?? 0)}',
                          kPrimaryGreen,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _metric(
                          'Cash out',
                          '$currency ${nf.format(cs?['totalOutflow'] ?? 0)}',
                          Colors.red,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  _metric(
                    'Net cash flow',
                    '$currency ${nf.format(cs?['netCashFlow'] ?? 0)}',
                    (cs?['netCashFlow'] ?? 0) >= 0 ? kPrimaryGreen : Colors.red,
                  ),
                  const SizedBox(height: 22),
                  const Text(
                    'This month purchases',
                    style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: _metric(
                          'Total',
                          '$currency ${nf.format(ps?['totalPurchases'] ?? 0)}',
                          kDark,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _metric(
                          'Outstanding',
                          '$currency ${nf.format(ps?['outstanding'] ?? 0)}',
                          kClay,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  ...((purchases?['purchases'] as List?) ?? []).take(20).map((
                    raw,
                  ) {
                    final p = raw as Map;
                    return Card(
                      child: ListTile(
                        title: Text(p['orderNumber'].toString()),
                        subtitle: Text(
                          '${p['supplier'] ?? 'No supplier'} · ${p['status']}',
                        ),
                        trailing: Text(
                          '$currency ${nf.format(p['totalAmount'] ?? 0)}',
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ),
                    );
                  }),
                ],
              ),
            ),
    );
  }
}

Widget _metric(String label, String value, Color color) => Container(
  padding: const EdgeInsets.all(16),
  decoration: BoxDecoration(
    color: Colors.white,
    borderRadius: BorderRadius.circular(14),
    border: Border.all(color: kDark.withValues(alpha: .08)),
  ),
  child: Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(
        label,
        style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.bold,
          color: kMuted,
        ),
      ),
      const SizedBox(height: 6),
      Text(
        value,
        style: TextStyle(
          fontSize: 17,
          fontWeight: FontWeight.w800,
          color: color,
        ),
      ),
    ],
  ),
);
