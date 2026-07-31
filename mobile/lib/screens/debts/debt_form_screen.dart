import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/api/business_api.dart';
import '../../core/api/inventory_api.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/debt_provider.dart';

class DebtFormScreen extends StatefulWidget {
  const DebtFormScreen({super.key});

  @override
  State<DebtFormScreen> createState() => _DebtFormScreenState();
}

class _DebtFormScreenState extends State<DebtFormScreen> {
  String _type = 'CUSTOMER';
  String? _partyId;
  final _amount = TextEditingController();
  final _description = TextEditingController();
  final _notes = TextEditingController();
  DateTime _debtDate = DateTime.now();
  DateTime? _dueDate;

  List<Map<String, dynamic>> _customers = [];
  List<dynamic> _suppliers = [];
  bool _loadingParties = true;
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadParties();
  }

  Future<void> _loadParties() async {
    final businessApi = BusinessApi(context.read());
    final inventoryApi = InventoryApi(context.read());
    try {
      final customers = await businessApi.customers();
      final suppliers = await inventoryApi.getSuppliers();
      if (!mounted) return;
      setState(() {
        _customers = customers;
        _suppliers = suppliers;
        _loadingParties = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _loadingParties = false);
    }
  }

  List<Map<String, dynamic>> get _parties {
    final source = _type == 'CUSTOMER' ? _customers : _suppliers;
    return source.map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  Future<void> _pickDate({required bool isDue}) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: isDue ? (_dueDate ?? _debtDate) : _debtDate,
      firstDate: DateTime(2020),
      lastDate: DateTime(2100),
    );
    if (picked != null) {
      setState(() => isDue ? _dueDate = picked : _debtDate = picked);
    }
  }

  Future<void> _submit() async {
    final amount = double.tryParse(_amount.text);
    if (_partyId == null) {
      setState(() => _error = 'Select a ${_type == 'CUSTOMER' ? 'customer' : 'supplier'}.');
      return;
    }
    if (amount == null || amount <= 0) {
      setState(() => _error = 'Enter a valid amount greater than 0.');
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      final debt = await context.read<DebtProvider>().createDebt({
        'type': _type,
        if (_type == 'CUSTOMER') 'customerId': _partyId,
        if (_type == 'SUPPLIER') 'supplierId': _partyId,
        'originalAmount': amount,
        'debtDate': DateFormat('yyyy-MM-dd').format(_debtDate),
        if (_dueDate != null) 'dueDate': DateFormat('yyyy-MM-dd').format(_dueDate!),
        if (_description.text.trim().isNotEmpty) 'description': _description.text.trim(),
        if (_notes.text.trim().isNotEmpty) 'notes': _notes.text.trim(),
      });
      if (mounted) context.pushReplacement('/debts/${debt.id}');
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Record Debt')),
      body: _loadingParties
          ? const Center(child: CircularProgressIndicator(color: kPrimaryGreen))
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                if (_error != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Text(_error!, style: const TextStyle(color: Colors.red)),
                  ),
                SegmentedButton<String>(
                  segments: const [
                    ButtonSegment(value: 'CUSTOMER', label: Text('Customer debt')),
                    ButtonSegment(value: 'SUPPLIER', label: Text('Supplier debt')),
                  ],
                  selected: {_type},
                  onSelectionChanged: (s) => setState(() {
                    _type = s.first;
                    _partyId = null;
                  }),
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  initialValue: _partyId,
                  decoration: InputDecoration(labelText: _type == 'CUSTOMER' ? 'Customer' : 'Supplier'),
                  items: _parties
                      .map((p) => DropdownMenuItem(value: p['id'].toString(), child: Text(p['name']?.toString() ?? '')))
                      .toList(),
                  onChanged: (v) => setState(() => _partyId = v),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _amount,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(labelText: 'Amount owed'),
                ),
                const SizedBox(height: 16),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Debt date'),
                  subtitle: Text(DateFormat('yyyy-MM-dd').format(_debtDate)),
                  trailing: const Icon(Icons.calendar_today_outlined),
                  onTap: () => _pickDate(isDue: false),
                ),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Due date (optional)'),
                  subtitle: Text(_dueDate != null ? DateFormat('yyyy-MM-dd').format(_dueDate!) : 'Not set'),
                  trailing: const Icon(Icons.calendar_today_outlined),
                  onTap: () => _pickDate(isDue: true),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _description,
                  decoration: const InputDecoration(labelText: 'Description (optional)'),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _notes,
                  maxLines: 3,
                  decoration: const InputDecoration(labelText: 'Notes (optional)'),
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: _saving ? null : _submit,
                  child: _saving ? const CircularProgressIndicator(color: Colors.white) : const Text('Record debt'),
                ),
              ],
            ),
    );
  }
}
