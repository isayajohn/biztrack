import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/models/product.dart';
import '../../core/models/sale.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/product_provider.dart';
import '../../providers/sale_provider.dart';
import '../../widgets/form_field_wrapper.dart';

class SaleFormScreen extends StatefulWidget {
  final Sale? sale;

  const SaleFormScreen({super.key, this.sale});

  @override
  State<SaleFormScreen> createState() => _SaleFormScreenState();
}

class _SaleFormScreenState extends State<SaleFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _productNameCtrl = TextEditingController();
  final _quantityCtrl = TextEditingController();
  final _unitPriceCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();

  String? _selectedProductId;
  String _paymentMethod = 'CASH';
  DateTime _saleDate = DateTime.now();
  bool _loading = false;
  double _total = 0;

  bool get _isEditing => widget.sale != null;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ProductProvider>().fetchProducts();
    });

    if (_isEditing) {
      final s = widget.sale!;
      _selectedProductId = s.productId;
      _productNameCtrl.text = s.productName;
      _quantityCtrl.text = s.quantity.toString();
      _unitPriceCtrl.text = s.unitPrice.toString();
      _paymentMethod = s.paymentMethod;
      _saleDate = DateTime.tryParse(s.saleDate) ?? DateTime.now();
      _notesCtrl.text = s.notes ?? '';
      _total = s.totalAmount;
    }

    _quantityCtrl.addListener(_calcTotal);
    _unitPriceCtrl.addListener(_calcTotal);
  }

  void _calcTotal() {
    final q = int.tryParse(_quantityCtrl.text) ?? 0;
    final p = double.tryParse(_unitPriceCtrl.text) ?? 0;
    setState(() => _total = q * p);
  }

  @override
  void dispose() {
    _productNameCtrl.dispose();
    _quantityCtrl.dispose();
    _unitPriceCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  void _onProductSelected(Product p) {
    setState(() {
      _selectedProductId = p.id;
      _productNameCtrl.text = p.name;
      _unitPriceCtrl.text = p.sellingPrice.toString();
    });
    _calcTotal();
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _saleDate,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
      builder: (ctx, child) => Theme(
        data: Theme.of(ctx).copyWith(
          colorScheme: const ColorScheme.light(primary: kPrimaryGreen),
        ),
        child: child!,
      ),
    );
    if (picked != null) setState(() => _saleDate = picked);
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    final payload = {
      'product_id': _selectedProductId,
      'product_name': _productNameCtrl.text.trim(),
      'quantity': int.tryParse(_quantityCtrl.text) ?? 0,
      'unit_price': double.tryParse(_unitPriceCtrl.text) ?? 0,
      'total_amount': _total,
      'payment_method': _paymentMethod,
      'sale_date': DateFormat('yyyy-MM-dd').format(_saleDate),
      'notes': _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
    };
    try {
      final provider = context.read<SaleProvider>();
      if (_isEditing) {
        await provider.updateSale(widget.sale!.id, payload);
      } else {
        await provider.createSale(payload);
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(_isEditing ? 'Sale updated!' : 'Sale recorded!'),
          backgroundColor: kPrimaryGreen,
        ));
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(e.toString()),
          backgroundColor: Colors.red,
        ));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEditing ? 'Edit Sale' : 'New Sale'),
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
            // Product picker
            Consumer<ProductProvider>(
              builder: (ctx, provider, _) {
                final products = provider.activeProducts;
                return FormFieldWrapper(
                  label: 'Product',
                  child: products.isEmpty
                      ? TextFormField(
                          controller: _productNameCtrl,
                          decoration: const InputDecoration(
                            hintText: 'Enter product name',
                            prefixIcon: Icon(Icons.inventory_2_outlined),
                          ),
                          validator: (v) => v == null || v.isEmpty
                              ? 'Enter product name'
                              : null,
                        )
                      : DropdownButtonFormField<String>(
                          initialValue: _selectedProductId,
                          decoration: const InputDecoration(
                            prefixIcon: Icon(Icons.inventory_2_outlined),
                            hintText: 'Select a product',
                          ),
                          items: products
                              .map((p) => DropdownMenuItem(
                                    value: p.id,
                                    child: Text('${p.name} (${p.stockQuantity} in stock)'),
                                  ))
                              .toList(),
                          onChanged: (id) {
                            final p = products.firstWhere((p) => p.id == id);
                            _onProductSelected(p);
                          },
                          validator: (v) =>
                              v == null ? 'Select a product' : null,
                        ),
                );
              },
            ),

            Row(
              children: [
                Expanded(
                  child: FormFieldWrapper(
                    label: 'Quantity',
                    child: TextFormField(
                      controller: _quantityCtrl,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        hintText: '1',
                        prefixIcon: Icon(Icons.numbers_outlined),
                      ),
                      validator: (v) {
                        if (v == null || v.isEmpty) return 'Required';
                        if (int.tryParse(v) == null || int.parse(v) < 1) {
                          return 'Must be > 0';
                        }
                        return null;
                      },
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: FormFieldWrapper(
                    label: 'Unit Price',
                    child: TextFormField(
                      controller: _unitPriceCtrl,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: const InputDecoration(
                        hintText: '0.00',
                        prefixIcon: Icon(Icons.attach_money_outlined),
                      ),
                      validator: (v) {
                        if (v == null || v.isEmpty) return 'Required';
                        if (double.tryParse(v) == null) return 'Invalid';
                        return null;
                      },
                    ),
                  ),
                ),
              ],
            ),

            // Total display
            Container(
              padding: const EdgeInsets.all(16),
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: kLightGreen,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Total Amount',
                      style: TextStyle(
                          fontWeight: FontWeight.w600, color: kDark)),
                  Text(
                    NumberFormat('#,##0.00').format(_total),
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: kPrimaryGreen,
                    ),
                  ),
                ],
              ),
            ),

            AppDropdownField<String>(
              label: 'Payment Method',
              value: _paymentMethod,
              items: Sale.paymentMethods
                  .map((m) => DropdownMenuItem(
                        value: m,
                        child: Text(Sale.paymentMethodLabel(m)),
                      ))
                  .toList(),
              onChanged: (v) => setState(() => _paymentMethod = v!),
            ),

            FormFieldWrapper(
              label: 'Sale Date',
              child: InkWell(
                onTap: _pickDate,
                child: InputDecorator(
                  decoration: const InputDecoration(
                    prefixIcon: Icon(Icons.calendar_today_outlined),
                  ),
                  child: Text(DateFormat('MMM d, yyyy').format(_saleDate)),
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
                          strokeWidth: 2, color: Colors.white),
                    )
                  : Text(_isEditing ? 'Update Sale' : 'Record Sale'),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}
