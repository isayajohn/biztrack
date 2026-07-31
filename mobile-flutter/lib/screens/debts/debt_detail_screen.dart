import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/models/debt.dart';
import '../../core/models/debt_payment.dart';
import '../../core/models/debt_reminder.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/debt_provider.dart';

class DebtDetailScreen extends StatefulWidget {
  final String debtId;
  const DebtDetailScreen({super.key, required this.debtId});

  @override
  State<DebtDetailScreen> createState() => _DebtDetailScreenState();
}

class _DebtDetailScreenState extends State<DebtDetailScreen> {
  Debt? _debt;
  List<DebtPayment> _payments = [];
  List<DebtReminder> _reminders = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final provider = context.read<DebtProvider>();
    try {
      final debt = await provider.getDebt(widget.debtId);
      final payments = await provider.getPayments(widget.debtId);
      final reminders = await provider.getReminders(widget.debtId);
      if (!mounted) return;
      setState(() {
        _debt = debt;
        _payments = payments;
        _reminders = reminders;
        _loading = false;
        _error = null;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _recordPayment() async {
    final amount = TextEditingController();
    final reference = TextEditingController();
    String method = 'CASH';
    final ok = await showDialog<bool>(
      context: context,
      builder: (c) => StatefulBuilder(
        builder: (c, setDialogState) => AlertDialog(
          title: const Text('Record payment'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: amount, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Amount')),
              const SizedBox(height: 10),
              DropdownButtonFormField<String>(
                initialValue: method,
                decoration: const InputDecoration(labelText: 'Payment method'),
                items: DebtPayment.methods.map((m) => DropdownMenuItem(value: m, child: Text(m.replaceAll('_', ' ')))).toList(),
                onChanged: (v) => setDialogState(() => method = v ?? 'CASH'),
              ),
              const SizedBox(height: 10),
              TextField(controller: reference, decoration: const InputDecoration(labelText: 'Reference (optional)')),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('Cancel')),
            FilledButton(onPressed: () => Navigator.pop(c, true), child: const Text('Record')),
          ],
        ),
      ),
    );
    if (ok != true) return;
    if (!mounted) return;
    final provider = context.read<DebtProvider>();
    try {
      await provider.recordPayment(widget.debtId, {
        'amount': double.tryParse(amount.text) ?? 0,
        'paymentDate': DateFormat('yyyy-MM-dd').format(DateTime.now()),
        'paymentMethod': method,
        if (reference.text.trim().isNotEmpty) 'transactionReference': reference.text.trim(),
      });
      await _load();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Payment recorded'), backgroundColor: kPrimaryGreen));
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  Future<String?> _promptReason(String title) {
    final controller = TextEditingController();
    return showDialog<String>(
      context: context,
      builder: (c) => AlertDialog(
        title: Text(title),
        content: TextField(controller: controller, decoration: const InputDecoration(labelText: 'Reason')),
        actions: [
          TextButton(onPressed: () => Navigator.pop(c), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(c, controller.text.trim()), child: const Text('Confirm')),
        ],
      ),
    );
  }

  Future<void> _reversePayment(DebtPayment payment) async {
    final reason = await _promptReason('Reverse payment');
    if (reason == null || reason.isEmpty) return;
    if (!mounted) return;
    final provider = context.read<DebtProvider>();
    try {
      await provider.reversePayment(payment.id, reason);
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  Future<void> _cancelDebt() async {
    final reason = await _promptReason('Cancel debt');
    if (reason == null || reason.isEmpty) return;
    if (!mounted) return;
    await context.read<DebtProvider>().cancelDebt(widget.debtId, reason);
    if (!mounted) return;
    await _load();
  }

  Future<void> _writeOffDebt() async {
    final reason = await _promptReason('Write off debt');
    if (reason == null || reason.isEmpty) return;
    if (!mounted) return;
    await context.read<DebtProvider>().writeOffDebt(widget.debtId, reason);
    if (!mounted) return;
    await _load();
  }

  Future<void> _disputeDebt() async {
    final reason = await _promptReason('Dispute debt');
    if (reason == null || reason.isEmpty) return;
    if (!mounted) return;
    await context.read<DebtProvider>().disputeDebt(widget.debtId, reason);
    if (!mounted) return;
    await _load();
  }

  Future<void> _sendReminder(String channel) async {
    final provider = context.read<DebtProvider>();
    try {
      await provider.sendReminderNow(widget.debtId, channel);
      await _load();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$channel reminder sent'), backgroundColor: kPrimaryGreen));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  @override
  Widget build(BuildContext context) {
    final currency = context.watch<AuthProvider>().user?.currency ?? 'TZS';
    final fmt = NumberFormat('#,##0');

    return Scaffold(
      appBar: AppBar(title: Text(_debt?.debtNumber ?? 'Debt')),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: kPrimaryGreen))
          : _error != null
          ? Center(child: Padding(padding: const EdgeInsets.all(24), child: Text(_error!, style: const TextStyle(color: Colors.red))))
          : _debt == null
          ? const SizedBox.shrink()
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(_debt!.partyName, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(color: kPrimaryGreen.withValues(alpha: kBadgeAlpha), borderRadius: BorderRadius.circular(20)),
                                child: Text(Debt.statusLabel(_debt!.status), style: const TextStyle(color: kPrimaryGreen, fontWeight: FontWeight.w700)),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Expanded(child: _amountBlock('Original', _debt!.originalAmount, currency, fmt)),
                              Expanded(child: _amountBlock('Paid', _debt!.totalPaid, currency, fmt, color: kPrimaryGreen)),
                              Expanded(child: _amountBlock('Balance', _debt!.outstandingBalance, currency, fmt, color: Colors.red.shade600)),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text('Debt date: ${_debt!.debtDate}   Due: ${_debt!.dueDate ?? "—"}', style: const TextStyle(color: kMuted, fontSize: 12)),
                          if (_debt!.description != null) Padding(padding: const EdgeInsets.only(top: 6), child: Text(_debt!.description!)),
                        ],
                      ),
                    ),
                  ),
                  if (!['PAID', 'CANCELLED', 'WRITTEN_OFF'].contains(_debt!.status)) ...[
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      children: [
                        OutlinedButton(onPressed: _disputeDebt, child: const Text('Dispute')),
                        OutlinedButton(onPressed: _cancelDebt, child: const Text('Cancel debt')),
                        OutlinedButton(
                          style: OutlinedButton.styleFrom(foregroundColor: Colors.red, side: const BorderSide(color: Colors.red)),
                          onPressed: _writeOffDebt,
                          child: const Text('Write off'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    ElevatedButton.icon(onPressed: _recordPayment, icon: const Icon(Icons.payments_outlined), label: const Text('Record a payment')),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      children: DebtReminder.channels
                          .map((c) => ActionChip(label: Text(c), onPressed: () => _sendReminder(c)))
                          .toList(),
                    ),
                  ],
                  const SizedBox(height: 20),
                  const Text('Payment history', style: TextStyle(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  if (_payments.isEmpty) const Text('No payments recorded.', style: TextStyle(color: kMuted)),
                  ..._payments.map((p) => Card(
                        child: ListTile(
                          title: Text('$currency ${fmt.format(p.amount)}', style: TextStyle(fontWeight: FontWeight.w700, decoration: p.isReversed ? TextDecoration.lineThrough : null)),
                          subtitle: Text('${p.paymentDate} · ${p.paymentMethod.replaceAll('_', ' ')}${p.isReversed ? ' · REVERSED' : ''}'),
                          trailing: p.isReversed ? null : TextButton(onPressed: () => _reversePayment(p), child: const Text('Reverse')),
                        ),
                      )),
                  const SizedBox(height: 20),
                  const Text('Reminders', style: TextStyle(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  if (_reminders.isEmpty) const Text('No reminders scheduled or sent yet.', style: TextStyle(color: kMuted)),
                  ..._reminders.map((r) => Card(
                        child: ListTile(
                          title: Text('${r.channel} · ${r.triggerType.replaceAll('_', ' ')}'),
                          subtitle: Text(r.sentAt != null ? 'Sent ${r.sentAt}' : 'Scheduled ${r.scheduledFor ?? ""}'),
                          trailing: Text(r.status, style: TextStyle(color: r.status == 'SENT' ? kPrimaryGreen : r.status == 'FAILED' ? Colors.red : kMuted, fontWeight: FontWeight.w700)),
                        ),
                      )),
                ],
              ),
            ),
    );
  }

  Widget _amountBlock(String label, double value, String currency, NumberFormat fmt, {Color? color}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label.toUpperCase(), style: const TextStyle(color: kMuted, fontSize: 11, fontWeight: FontWeight.w700)),
        const SizedBox(height: 4),
        Text('$currency ${fmt.format(value)}', style: TextStyle(fontWeight: FontWeight.w700, color: color ?? kDark)),
      ],
    );
  }
}
