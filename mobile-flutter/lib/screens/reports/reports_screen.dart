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

class _ReportsScreenState extends State<ReportsScreen> {
  DateTime _startDate = DateTime.now().subtract(const Duration(days: 30));
  DateTime _endDate = DateTime.now();
  ReportData? _report;
  bool _loading = false;
  String? _error;
  late ReportApi _api;

  @override
  void initState() {
    super.initState();
    _api = ReportApi(context.read<ApiClient>());
    _loadReport();
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

  @override
  Widget build(BuildContext context) {
    final currency = context.watch<AuthProvider>().user?.currency ?? 'USD';

    return Scaffold(
      appBar: AppBar(title: const Text('Reports')),
      body: RefreshIndicator(
        onRefresh: _loadReport,
        color: kPrimaryGreen,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Date range picker
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Date Range',
                      style: TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                          color: kDark),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: _datePickerButton(
                            label: 'From',
                            date: _startDate,
                            onTap: () => _pickDate(true),
                          ),
                        ),
                        const Padding(
                          padding: EdgeInsets.symmetric(horizontal: 8),
                          child: Icon(Icons.arrow_forward_rounded,
                              color: kMuted, size: 18),
                        ),
                        Expanded(
                          child: _datePickerButton(
                            label: 'To',
                            date: _endDate,
                            onTap: () => _pickDate(false),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        _presetBtn('7D', 7),
                        const SizedBox(width: 8),
                        _presetBtn('30D', 30),
                        const SizedBox(width: 8),
                        _presetBtn('90D', 90),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),

            if (_loading)
              const Padding(
                padding: EdgeInsets.all(48),
                child: Center(
                    child: CircularProgressIndicator(color: kPrimaryGreen)),
              )
            else if (_error != null)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    children: [
                      const Icon(Icons.error_outline, size: 40, color: kMuted),
                      const SizedBox(height: 8),
                      Text(_error!,
                          textAlign: TextAlign.center,
                          style: const TextStyle(color: kMuted)),
                      const SizedBox(height: 12),
                      TextButton(
                          onPressed: _loadReport, child: const Text('Retry')),
                    ],
                  ),
                ),
              )
            else if (_report != null)
              ..._buildReportContent(_report!, currency),
          ],
        ),
      ),
    );
  }

  List<Widget> _buildReportContent(ReportData report, String currency) {
    final profitColor =
        report.netProfit >= 0 ? kPrimaryGreen : Colors.red.shade600;
    return [
      // Summary cards
      _summaryCard(
        title: 'Total Sales',
        value: _fmt(report.totalSales, currency),
        subtitle: '${report.salesCount} transactions',
        icon: Icons.trending_up_rounded,
        color: kPrimaryGreen,
      ),
      _summaryCard(
        title: 'Total Expenses',
        value: _fmt(report.totalExpenses, currency),
        subtitle: '${report.expensesCount} transactions',
        icon: Icons.trending_down_rounded,
        color: Colors.orange.shade700,
      ),
      _summaryCard(
        title: 'Net Profit',
        value: _fmt(report.netProfit, currency),
        subtitle: report.netProfit >= 0 ? 'Profitable period' : 'Loss period',
        icon: Icons.account_balance_outlined,
        color: profitColor,
        highlighted: true,
      ),
      const SizedBox(height: 8),

      // Top products
      if (report.topProducts.isNotEmpty) ...[
        const Text(
          'Top Products',
          style: TextStyle(
              fontSize: 16, fontWeight: FontWeight.w700, color: kDark),
        ),
        const SizedBox(height: 8),
        ...report.topProducts.asMap().entries.map((e) {
          final i = e.key;
          final p = e.value;
          final name = p['name'] ?? p['product_name'] ?? 'Unknown';
          final total = p['total'] ?? p['total_amount'] ?? p['revenue'] ?? 0;
          final qty = p['quantity'] ?? p['total_quantity'] ?? 0;
          return Card(
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: kLightGreen,
                child: Text('${i + 1}',
                    style: const TextStyle(
                        color: kPrimaryGreen, fontWeight: FontWeight.w700)),
              ),
              title: Text(name.toString(),
                  style: const TextStyle(fontWeight: FontWeight.w600)),
              subtitle: Text('Qty sold: $qty'),
              trailing: Text(
                _fmt(
                    total is num ? total.toDouble() : 0,
                    context.read<AuthProvider>().user?.currency ?? 'USD'),
                style: const TextStyle(
                    color: kPrimaryGreen, fontWeight: FontWeight.w700),
              ),
            ),
          );
        }),
      ],
      const SizedBox(height: 24),
    ];
  }

  Widget _summaryCard({
    required String title,
    required String value,
    required String subtitle,
    required IconData icon,
    required Color color,
    bool highlighted = false,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: highlighted ? color.withValues(alpha: 0.08) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: highlighted
            ? Border.all(color: color.withValues(alpha: 0.3), width: 1.5)
            : null,
        boxShadow: [
          BoxShadow(
            color: kDark.withValues(alpha: 0.05),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: const TextStyle(color: kMuted, fontSize: 12)),
                Text(value,
                    style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: highlighted ? color : kDark)),
                Text(subtitle,
                    style: const TextStyle(fontSize: 11, color: kMuted)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _datePickerButton({
    required String label,
    required DateTime date,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: kLightGreen,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label,
                style: const TextStyle(fontSize: 10, color: kMuted)),
            Text(
              DateFormat('MMM d, yyyy').format(date),
              style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: kPrimaryGreen),
            ),
          ],
        ),
      ),
    );
  }

  Widget _presetBtn(String label, int days) {
    return OutlinedButton(
      onPressed: () {
        setState(() {
          _endDate = DateTime.now();
          _startDate = _endDate.subtract(Duration(days: days));
        });
        _loadReport();
      },
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        minimumSize: Size.zero,
        side: const BorderSide(color: kPrimaryGreen),
        foregroundColor: kPrimaryGreen,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
      ),
      child: Text(label, style: const TextStyle(fontSize: 12)),
    );
  }
}
