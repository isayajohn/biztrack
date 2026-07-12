import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/api/api_client.dart';
import '../../core/api/report_api.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen>
    with SingleTickerProviderStateMixin {
  DateTime _startDate = DateTime.now().subtract(const Duration(days: 30));
  DateTime _endDate = DateTime.now();
  ReportData? _report;
  bool _loading = false;
  String? _error;
  late ReportApi _api;
  late TabController _tabCtrl;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 2, vsync: this);
    _api = ReportApi(context.read<ApiClient>());
    _loadReport();
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickDate(bool isStart) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: isStart ? _startDate : _endDate,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
      builder: (ctx, child) => Theme(
        data: Theme.of(ctx).copyWith(
          colorScheme: const ColorScheme.light(primary: kPrimaryGreen),
        ),
        child: child!,
      ),
    );
    if (picked != null) {
      setState(() {
        if (isStart) {
          _startDate = picked;
          if (_endDate.isBefore(_startDate)) _endDate = _startDate;
        } else {
          _endDate = picked;
        }
      });
      _loadReport();
    }
  }

  Future<void> _loadReport() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final report = await _api.getReports(
        startDate: DateFormat('yyyy-MM-dd').format(_startDate),
        endDate: DateFormat('yyyy-MM-dd').format(_endDate),
      );
      if (mounted) setState(() => _report = report);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _fmt(double v, String currency) =>
      '$currency ${NumberFormat('#,##0.00').format(v)}';

  String _pct(double val, double total) {
    if (total == 0) return '0%';
    return '${((val / total) * 100).toStringAsFixed(1)}%';
  }

  @override
  Widget build(BuildContext context) {
    final currency = context.watch<AuthProvider>().user?.currency ?? 'TZS';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Reports & P&L'),
        bottom: TabBar(
          controller: _tabCtrl,
          labelColor: kPrimaryGreen,
          unselectedLabelColor: kMuted,
          indicatorColor: kPrimaryGreen,
          tabs: const [
            Tab(text: 'Profit & Loss'),
            Tab(text: 'Top Products'),
          ],
        ),
      ),
      body: Column(
        children: [
          // Date range card
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: _dateBtn(
                        'From',
                        _startDate,
                        () => _pickDate(true),
                      ),
                    ),
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 8),
                      child: Icon(
                        Icons.arrow_forward_rounded,
                        color: kMuted,
                        size: 16,
                      ),
                    ),
                    Expanded(
                      child: _dateBtn('To', _endDate, () => _pickDate(false)),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    _preset('7D', 7),
                    const SizedBox(width: 6),
                    _preset('30D', 30),
                    const SizedBox(width: 6),
                    _preset('90D', 90),
                    const SizedBox(width: 6),
                    _preset('1Y', 365),
                  ],
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          Expanded(
            child: _loading
                ? const Center(
                    child: CircularProgressIndicator(color: kPrimaryGreen),
                  )
                : _error != null
                ? _buildError()
                : _report == null
                ? const SizedBox()
                : TabBarView(
                    controller: _tabCtrl,
                    children: [
                      _buildPL(_report!, currency),
                      _buildTopProducts(_report!, currency),
                    ],
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildPL(ReportData report, String currency) {
    final isProfit = report.netProfit >= 0;
    final profitColor = isProfit ? kPrimaryGreen : Colors.red.shade600;
    final margin = report.totalSales > 0
        ? (report.netProfit / report.totalSales) * 100
        : 0.0;

    return RefreshIndicator(
      onRefresh: _loadReport,
      color: kPrimaryGreen,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Hero P&L card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: isProfit
                    ? [kPrimaryGreen, const Color(0xFF1B5E20)]
                    : [Colors.red.shade700, Colors.red.shade900],
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
                    Icon(
                      isProfit
                          ? Icons.trending_up_rounded
                          : Icons.trending_down_rounded,
                      color: Colors.white70,
                      size: 18,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      isProfit ? 'Profitable Period' : 'Loss Period',
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  _fmt(report.netProfit, currency),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 32,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -1,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Net Profit/Loss  •  Margin: ${margin.toStringAsFixed(1)}%',
                  style: const TextStyle(color: Colors.white60, fontSize: 12),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Income statement section
          _sectionLabel('INCOME STATEMENT'),
          _plRow(
            label: 'Total Revenue',
            value: _fmt(report.totalSales, currency),
            sub: '${report.salesCount} sales',
            color: kPrimaryGreen,
            icon: Icons.arrow_upward_rounded,
          ),
          _plRow(
            label: 'Total Expenses',
            value: _fmt(report.totalExpenses, currency),
            sub: '${report.expensesCount} expense entries',
            color: Colors.red.shade600,
            icon: Icons.arrow_downward_rounded,
          ),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 8),
            child: Divider(),
          ),
          _plRow(
            label: 'Net Profit / Loss',
            value: _fmt(report.netProfit, currency),
            sub: isProfit ? 'Profitable' : 'Loss',
            color: profitColor,
            icon: isProfit ? Icons.check_circle_outline : Icons.cancel_outlined,
            bold: true,
          ),
          const SizedBox(height: 20),

          // Ratios section
          _sectionLabel('KEY RATIOS'),
          Row(
            children: [
              Expanded(
                child: _ratioCard(
                  'Profit Margin',
                  '${margin.toStringAsFixed(1)}%',
                  isProfit ? kPrimaryGreen : Colors.red.shade600,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _ratioCard(
                  'Revenue Share',
                  _pct(
                    report.totalSales,
                    report.totalSales + report.totalExpenses,
                  ),
                  Colors.blue.shade600,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _ratioCard(
                  'Cost Ratio',
                  _pct(report.totalExpenses, report.totalSales),
                  Colors.orange.shade700,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildTopProducts(ReportData report, String currency) {
    if (report.topProducts.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.inventory_2_outlined, size: 64, color: kMuted),
              SizedBox(height: 16),
              Text(
                'No product data',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: kDark,
                ),
              ),
              SizedBox(height: 8),
              Text(
                'Record sales to see top-performing products.',
                style: TextStyle(color: kMuted),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    final maxRevenue = report.topProducts
        .map(
          (p) => (p['total'] ?? p['total_amount'] ?? p['revenue'] ?? 0) as num,
        )
        .fold<num>(0, (a, b) => a > b ? a : b)
        .toDouble();

    return RefreshIndicator(
      onRefresh: _loadReport,
      color: kPrimaryGreen,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: report.topProducts.length,
        itemBuilder: (_, i) {
          final p = report.topProducts[i];
          final name = p['name'] ?? p['product_name'] ?? 'Unknown';
          final total =
              (p['total'] ?? p['total_amount'] ?? p['revenue'] ?? 0) as num;
          final qty = (p['quantity'] ?? p['total_quantity'] ?? 0) as num;
          final pct = maxRevenue > 0 ? total.toDouble() / maxRevenue : 0.0;

          return Card(
            margin: const EdgeInsets.only(bottom: 10),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: kLightGreen,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Center(
                      child: Text(
                        '${i + 1}',
                        style: const TextStyle(
                          color: kPrimaryGreen,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          name.toString(),
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            color: kDark,
                            fontSize: 14,
                          ),
                        ),
                        const SizedBox(height: 6),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: pct,
                            backgroundColor: kLightGreen,
                            color: kPrimaryGreen,
                            minHeight: 6,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '$qty units sold',
                          style: const TextStyle(color: kMuted, fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    _fmt(
                      total.toDouble(),
                      context.read<AuthProvider>().user?.currency ?? 'TZS',
                    ),
                    style: const TextStyle(
                      color: kPrimaryGreen,
                      fontWeight: FontWeight.w800,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _sectionLabel(String label) => Padding(
    padding: const EdgeInsets.only(bottom: 10),
    child: Text(
      label,
      style: const TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w700,
        color: kMuted,
        letterSpacing: 1,
      ),
    ),
  );

  Widget _plRow({
    required String label,
    required String value,
    required String sub,
    required Color color,
    required IconData icon,
    bool bold = false,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: bold ? Border.all(color: color.withValues(alpha: 0.3)) : null,
        boxShadow: [
          BoxShadow(
            color: kDark.withValues(alpha: 0.04),
            blurRadius: 4,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 18),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    color: kMuted,
                    fontSize: 12,
                    fontWeight: bold ? FontWeight.w700 : FontWeight.normal,
                  ),
                ),
                Text(sub, style: const TextStyle(color: kMuted, fontSize: 10)),
              ],
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: bold ? 16 : 15,
              fontWeight: FontWeight.w800,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _ratioCard(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Column(
        children: [
          Text(
            value,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(fontSize: 10, color: kMuted),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _dateBtn(String label, DateTime date, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: kLightGreen,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(fontSize: 10, color: kMuted)),
            Text(
              DateFormat('MMM d, yyyy').format(date),
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: kPrimaryGreen,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _preset(String label, int days) {
    return OutlinedButton(
      onPressed: () {
        setState(() {
          _endDate = DateTime.now();
          _startDate = _endDate.subtract(Duration(days: days));
        });
        _loadReport();
      },
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        minimumSize: Size.zero,
        side: const BorderSide(color: kPrimaryGreen),
        foregroundColor: kPrimaryGreen,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
      ),
      child: Text(label, style: const TextStyle(fontSize: 11)),
    );
  }

  Widget _buildError() => Center(
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
          ElevatedButton(onPressed: _loadReport, child: const Text('Retry')),
        ],
      ),
    ),
  );
}
