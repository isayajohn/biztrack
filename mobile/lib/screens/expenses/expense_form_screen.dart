import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/models/expense.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/expense_provider.dart';
import '../../widgets/form_field_wrapper.dart';

class ExpenseFormScreen extends StatefulWidget {
  final Expense? expense;

  const ExpenseFormScreen({super.key, this.expense});

  @override
  State<ExpenseFormScreen> createState() => _ExpenseFormScreenState();
}

class _ExpenseFormScreenState extends State<ExpenseFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _descCtrl = TextEditingController();
  final _amountCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();

  String _category = 'OTHER';
  String _paymentMethod = 'CASH';
  DateTime _expenseDate = DateTime.now();
  bool _loading = false;

  bool get _isEditing => widget.expense != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) {
      final e = widget.expense!;
      _category = e.category;
      _descCtrl.text = e.description;
      _amountCtrl.text = e.amount.toString();
      _paymentMethod = e.paymentMethod;
      _expenseDate = DateTime.tryParse(e.expenseDate) ?? DateTime.now();
      _notesCtrl.text = e.notes ?? '';
    }
  }

  @override
  void dispose() {
    _descCtrl.dispose();
    _amountCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _expenseDate,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
      builder: (ctx, child) => Theme(
        data: Theme.of(ctx).copyWith(
          colorScheme: const ColorScheme.light(primary: kPrimaryGreen),
        ),
        child: child!,
      ),
    );
    if (picked != null) setState(() => _expenseDate = picked);
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    final payload = {
      'category': _category,
      'description': _descCtrl.text.trim(),
      'amount': double.tryParse(_amountCtrl.text) ?? 0,
      'paymentMethod': _paymentMethod,
      'expenseDate': DateFormat('yyyy-MM-dd').format(_expenseDate),
      'notes': _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
    };
    try {
      final provider = context.read<ExpenseProvider>();
      if (_isEditing) {
        await provider.updateExpense(widget.expense!.id, payload);
      } else {
        await provider.createExpense(payload);
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_isEditing ? 'Expense updated!' : 'Expense added!'),
            backgroundColor: kPrimaryGreen,
          ),
        );
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEditing ? 'Edit Expense' : 'New Expense'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => context.pop(),
        ),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            AppDropdownField<String>(
              label: 'Category',
              value: _category,
              items: Expense.categories
                  .map(
                    (c) => DropdownMenuItem(
                      value: c,
                      child: Text(Expense.categoryLabel(c)),
                    ),
                  )
                  .toList(),
              onChanged: (v) => setState(() => _category = v!),
            ),

            FormFieldWrapper(
              label: 'Description',
              child: TextFormField(
                controller: _descCtrl,
                textInputAction: TextInputAction.next,
                decoration: const InputDecoration(
                  hintText: 'What was this expense for?',
                  prefixIcon: Icon(Icons.notes_outlined),
                ),
                validator: (v) =>
                    v == null || v.isEmpty ? 'Enter a description' : null,
              ),
            ),

            FormFieldWrapper(
              label: 'Amount',
              child: TextFormField(
                controller: _amountCtrl,
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
                textInputAction: TextInputAction.next,
                decoration: const InputDecoration(
                  hintText: '0.00',
                  prefixIcon: Icon(Icons.attach_money_outlined),
                ),
                validator: (v) {
                  if (v == null || v.isEmpty) return 'Enter amount';
                  final d = double.tryParse(v);
                  if (d == null || d <= 0) return 'Enter a valid amount';
                  return null;
                },
              ),
            ),

            AppDropdownField<String>(
              label: 'Payment Method',
              value: _paymentMethod,
              items: Expense.paymentMethods
                  .map(
                    (m) => DropdownMenuItem(
                      value: m,
                      child: Text(Expense.paymentMethodLabel(m)),
                    ),
                  )
                  .toList(),
              onChanged: (v) => setState(() => _paymentMethod = v!),
            ),

            FormFieldWrapper(
              label: 'Date',
              child: InkWell(
                onTap: _pickDate,
                child: InputDecorator(
                  decoration: const InputDecoration(
                    prefixIcon: Icon(Icons.calendar_today_outlined),
                  ),
                  child: Text(DateFormat('MMM d, yyyy').format(_expenseDate)),
                ),
              ),
            ),

            FormFieldWrapper(
              label: 'Notes (optional)',
              child: TextFormField(
                controller: _notesCtrl,
                maxLines: 3,
                decoration: const InputDecoration(
                  hintText: 'Any additional notes...',
                  alignLabelWithHint: true,
                ),
              ),
            ),

            const SizedBox(height: 8),
            ElevatedButton(
              onPressed: _loading ? null : _submit,
              child: _loading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : Text(_isEditing ? 'Update Expense' : 'Add Expense'),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}
