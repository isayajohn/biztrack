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
import '../../core/api/business_api.dart';
import '../../core/api/api_client.dart';

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
  final _discountCtrl = TextEditingController(text: '0');
  final _taxCtrl = TextEditingController(text: '0');
  final _paidCtrl = TextEditingController();

  String? _selectedProductId;
  String _paymentMethod = 'CASH';
  String? _customerId;
  String? _promotionId;
  List<Map<String, dynamic>> _customers = [];
  List<Map<String, dynamic>> _promotions = [];
  DateTime _saleDate = DateTime.now();
  bool _loading = false;
  double _total = 0;

  bool get _isEditing => widget.sale != null;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ProductProvider>().fetchProducts();
      _loadBusinessOptions();
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
      _customerId = s.customerId;
      _discountCtrl.text = s.discount.toString();
      _paidCtrl.text = s.paidAmount.toString();
      _total = s.totalAmount;
    }

    _quantityCtrl.addListener(_calcTotal);
    _unitPriceCtrl.addListener(_calcTotal);
    _discountCtrl.addListener(_calcTotal);
    _taxCtrl.addListener(_calcTotal);
  }

  Future<void> _loadBusinessOptions() async {
    try {
      final api = BusinessApi(context.read<ApiClient>());
      final values = await Future.wait([api.customers(), api.promotions()]);
      if (mounted) {
        setState(() {
          _customers = values[0].where((c) => c['isActive'] == true).toList();
          _promotions = values[1]
              .where((p) => p['isAvailable'] == true)
              .toList();
        });
      }
    } catch (_) {}
  }

  void _calcTotal() {
    final q = int.tryParse(_quantityCtrl.text) ?? 0;
    final p = double.tryParse(_unitPriceCtrl.text) ?? 0;
    final subtotal = q * p;
    final discount = double.tryParse(_discountCtrl.text) ?? 0;
    final beforePromotion = (subtotal - discount).clamp(0, double.infinity);
    Map<String, dynamic>? promotion;
    for (final item in _promotions) {
      if (item['id']?.toString() == _promotionId) promotion = item;
    }
    var promotionDiscount = 0.0;
    if (promotion != null) {
      final value = (promotion['value'] as num?)?.toDouble() ?? 0;
      promotionDiscount = promotion['type'] == 'PERCENTAGE'
          ? beforePromotion * value / 100
          : value;
      final cap = (promotion['maximumDiscount'] as num?)?.toDouble();
      if (cap != null && promotionDiscount > cap) promotionDiscount = cap;
    }
    final taxable = (beforePromotion - promotionDiscount).clamp(
      0,
      double.infinity,
    );
    final tax = taxable * (double.tryParse(_taxCtrl.text) ?? 0) / 100;
    setState(() => _total = taxable + tax);
  }

  @override
  void dispose() {
    _productNameCtrl.dispose();
    _quantityCtrl.dispose();
    _unitPriceCtrl.dispose();
    _notesCtrl.dispose();
    _discountCtrl.dispose();
    _taxCtrl.dispose();
    _paidCtrl.dispose();
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
      'productId': _selectedProductId,
      'productName': _productNameCtrl.text.trim(),
      'quantity': int.tryParse(_quantityCtrl.text) ?? 0,
      'unitPrice': double.tryParse(_unitPriceCtrl.text) ?? 0,
      'totalAmount': _total,
      'customerId': _customerId,
      'promotionId': _promotionId,
      'discount': double.tryParse(_discountCtrl.text) ?? 0,
      'taxRate': double.tryParse(_taxCtrl.text) ?? 0,
      'paidAmount': _paidCtrl.text.isEmpty
          ? (_paymentMethod == 'CREDIT' ? 0 : _total)
          : double.tryParse(_paidCtrl.text) ?? 0,
      'paymentMethod': _paymentMethod,
      'saleDate': DateFormat('yyyy-MM-dd').format(_saleDate),
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
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_isEditing ? 'Sale updated!' : 'Sale recorded!'),
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
                              .map(
                                (p) => DropdownMenuItem(
                                  value: p.id,
                                  child: Text(
                                    '${p.name} (${p.stockQuantity} in stock)',
                                  ),
                                ),
                              )
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
                      keyboardType: const TextInputType.numberWithOptions(
                        decimal: true,
                      ),
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
                  const Text(
                    'Total Amount',
                    style: TextStyle(fontWeight: FontWeight.w600, color: kDark),
                  ),
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
                  .map(
                    (m) => DropdownMenuItem(
                      value: m,
                      child: Text(Sale.paymentMethodLabel(m)),
                    ),
                  )
                  .toList(),
              onChanged: (v) => setState(() => _paymentMethod = v!),
            ),

            if (_customers.isNotEmpty)
              DropdownButtonFormField<String>(
                initialValue: _customerId,
                decoration: const InputDecoration(
                  labelText: 'Customer (required for credit)',
                  prefixIcon: Icon(Icons.person_outline),
                ),
                items: [
                  const DropdownMenuItem<String>(
                    value: '',
                    child: Text('Walk-in customer'),
                  ),
                  ..._customers.map(
                    (c) => DropdownMenuItem<String>(
                      value: c['id'].toString(),
                      child: Text(c['name'].toString()),
                    ),
                  ),
                ],
                onChanged: (value) => setState(
                  () => _customerId = value == null || value.isEmpty
                      ? null
                      : value,
                ),
              ),
            const SizedBox(height: 12),
            if (_promotions.isNotEmpty)
              DropdownButtonFormField<String>(
                initialValue: _promotionId,
                decoration: const InputDecoration(
                  labelText: 'Promotion',
                  prefixIcon: Icon(Icons.local_offer_outlined),
                ),
                items: [
                  const DropdownMenuItem<String>(
                    value: '',
                    child: Text('No promotion'),
                  ),
                  ..._promotions.map(
                    (p) => DropdownMenuItem<String>(
                      value: p['id'].toString(),
                      child: Text(
                        '${p['code']} · ${p['value']}${p['type'] == 'PERCENTAGE' ? '%' : ''} off',
                      ),
                    ),
                  ),
                ],
                onChanged: (value) {
                  setState(
                    () => _promotionId = value == null || value.isEmpty
                        ? null
                        : value,
                  );
                  _calcTotal();
                },
              ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: FormFieldWrapper(
                    label: 'Discount',
                    child: TextFormField(
                      controller: _discountCtrl,
                      keyboardType: const TextInputType.numberWithOptions(
                        decimal: true,
                      ),
                      decoration: const InputDecoration(
                        prefixIcon: Icon(Icons.discount_outlined),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: FormFieldWrapper(
                    label: 'Tax / VAT %',
                    child: TextFormField(
                      controller: _taxCtrl,
                      keyboardType: const TextInputType.numberWithOptions(
                        decimal: true,
                      ),
                      decoration: const InputDecoration(
                        prefixIcon: Icon(Icons.percent),
                      ),
                    ),
                  ),
                ),
              ],
            ),
            FormFieldWrapper(
              label: 'Amount paid',
              child: TextFormField(
                controller: _paidCtrl,
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
                decoration: InputDecoration(
                  prefixIcon: const Icon(Icons.payments_outlined),
                  hintText: _paymentMethod == 'CREDIT'
                      ? '0.00'
                      : _total.toStringAsFixed(2),
                ),
              ),
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
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
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
