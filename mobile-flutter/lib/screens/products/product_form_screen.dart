import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/models/product.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/product_provider.dart';
import '../../widgets/form_field_wrapper.dart';
import '../../core/api/business_api.dart';
import '../../core/api/api_client.dart';
import '../scanner/barcode_scanner_screen.dart';

class ProductFormScreen extends StatefulWidget {
  final Product? product;

  const ProductFormScreen({super.key, this.product});

  @override
  State<ProductFormScreen> createState() => _ProductFormScreenState();
}

class _ProductFormScreenState extends State<ProductFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _skuCtrl = TextEditingController();
  final _barcodeCtrl = TextEditingController();
  String? _brandId;
  List<Map<String, dynamic>> _brands = [];
  final _buyingCtrl = TextEditingController();
  final _sellingCtrl = TextEditingController();
  final _stockCtrl = TextEditingController();
  final _lowStockCtrl = TextEditingController();
  bool _isActive = true;
  bool _loading = false;

  bool get _isEditing => widget.product != null;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      try {
        final values = await BusinessApi(context.read<ApiClient>()).brands();
        if (mounted) {
          setState(
            () => _brands = values.where((b) => b['isActive'] == true).toList(),
          );
        }
      } catch (_) {}
    });
    if (_isEditing) {
      final p = widget.product!;
      _nameCtrl.text = p.name;
      _skuCtrl.text = p.sku ?? '';
      _barcodeCtrl.text = p.barcode ?? '';
      _brandId = p.brandId;
      _buyingCtrl.text = p.buyingPrice.toString();
      _sellingCtrl.text = p.sellingPrice.toString();
      _stockCtrl.text = p.stockQuantity.toString();
      _lowStockCtrl.text = p.lowStockLevel.toString();
      _isActive = p.isActive;
    } else {
      _stockCtrl.text = '0';
      _lowStockCtrl.text = '5';
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _skuCtrl.dispose();
    _barcodeCtrl.dispose();
    _buyingCtrl.dispose();
    _sellingCtrl.dispose();
    _stockCtrl.dispose();
    _lowStockCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    final payload = {
      'name': _nameCtrl.text.trim(),
      'sku': _skuCtrl.text.trim().isEmpty ? null : _skuCtrl.text.trim(),
      'barcode': _barcodeCtrl.text.trim().isEmpty
          ? null
          : _barcodeCtrl.text.trim(),
      'brandId': _brandId,
      'buyingPrice': double.tryParse(_buyingCtrl.text) ?? 0,
      'sellingPrice': double.tryParse(_sellingCtrl.text) ?? 0,
      'stockQuantity': int.tryParse(_stockCtrl.text) ?? 0,
      'lowStockLevel': int.tryParse(_lowStockCtrl.text) ?? 5,
      'isActive': _isActive,
    };
    try {
      final provider = context.read<ProductProvider>();
      if (_isEditing) {
        await provider.updateProduct(widget.product!.id, payload);
      } else {
        await provider.createProduct(payload);
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_isEditing ? 'Product updated!' : 'Product created!'),
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

  Future<void> _scanBarcode() async {
    final value = await Navigator.of(context).push<String>(
      MaterialPageRoute(builder: (_) => const BarcodeScannerScreen()),
    );
    if (value != null && mounted) setState(() => _barcodeCtrl.text = value);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEditing ? 'Edit Product' : 'New Product'),
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
            FormFieldWrapper(
              label: 'Product Name',
              child: TextFormField(
                controller: _nameCtrl,
                textInputAction: TextInputAction.next,
                decoration: const InputDecoration(
                  hintText: 'e.g. Maize Flour 2kg',
                  prefixIcon: Icon(Icons.inventory_2_outlined),
                ),
                validator: (v) =>
                    v == null || v.isEmpty ? 'Enter product name' : null,
              ),
            ),

            FormFieldWrapper(
              label: 'Barcode',
              child: TextFormField(
                controller: _barcodeCtrl,
                decoration: InputDecoration(
                  hintText: 'Scan or enter barcode',
                  prefixIcon: const Icon(Icons.barcode_reader),
                  suffixIcon: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      IconButton(
                        tooltip: 'Scan barcode',
                        icon: const Icon(Icons.qr_code_scanner),
                        onPressed: _scanBarcode,
                      ),
                      IconButton(
                        tooltip: 'Generate barcode',
                        icon: const Icon(Icons.auto_awesome),
                        onPressed: () => setState(
                          () => _barcodeCtrl.text = DateTime.now()
                              .millisecondsSinceEpoch
                              .toString()
                              .substring(1),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            if (_brands.isNotEmpty)
              FormFieldWrapper(
                label: 'Brand',
                child: DropdownButtonFormField<String>(
                  initialValue: _brandId,
                  decoration: const InputDecoration(
                    prefixIcon: Icon(Icons.branding_watermark_outlined),
                  ),
                  items: _brands
                      .map(
                        (b) => DropdownMenuItem<String>(
                          value: b['id'].toString(),
                          child: Text(b['name'].toString()),
                        ),
                      )
                      .toList(),
                  onChanged: (value) => setState(() => _brandId = value),
                ),
              ),

            FormFieldWrapper(
              label: 'SKU / Code (optional)',
              child: TextFormField(
                controller: _skuCtrl,
                textInputAction: TextInputAction.next,
                decoration: const InputDecoration(
                  hintText: 'e.g. MF-001',
                  prefixIcon: Icon(Icons.qr_code_outlined),
                ),
              ),
            ),

            Row(
              children: [
                Expanded(
                  child: FormFieldWrapper(
                    label: 'Buying Price',
                    child: TextFormField(
                      controller: _buyingCtrl,
                      keyboardType: const TextInputType.numberWithOptions(
                        decimal: true,
                      ),
                      textInputAction: TextInputAction.next,
                      decoration: const InputDecoration(
                        hintText: '0.00',
                        prefixIcon: Icon(Icons.shopping_cart_outlined),
                      ),
                      validator: (v) {
                        if (v == null || v.isEmpty) return 'Required';
                        if (double.tryParse(v) == null) return 'Invalid';
                        return null;
                      },
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: FormFieldWrapper(
                    label: 'Selling Price',
                    child: TextFormField(
                      controller: _sellingCtrl,
                      keyboardType: const TextInputType.numberWithOptions(
                        decimal: true,
                      ),
                      textInputAction: TextInputAction.next,
                      decoration: const InputDecoration(
                        hintText: '0.00',
                        prefixIcon: Icon(Icons.sell_outlined),
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

            Row(
              children: [
                Expanded(
                  child: FormFieldWrapper(
                    label: 'Stock Quantity',
                    child: TextFormField(
                      controller: _stockCtrl,
                      keyboardType: TextInputType.number,
                      textInputAction: TextInputAction.next,
                      decoration: const InputDecoration(
                        hintText: '0',
                        prefixIcon: Icon(Icons.numbers_outlined),
                      ),
                      validator: (v) {
                        if (v == null || v.isEmpty) return 'Required';
                        if (int.tryParse(v) == null) return 'Invalid';
                        return null;
                      },
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: FormFieldWrapper(
                    label: 'Low Stock Alert',
                    hint: 'Warn when stock falls below this',
                    child: TextFormField(
                      controller: _lowStockCtrl,
                      keyboardType: TextInputType.number,
                      textInputAction: TextInputAction.done,
                      decoration: const InputDecoration(
                        hintText: '5',
                        prefixIcon: Icon(Icons.warning_amber_outlined),
                      ),
                      validator: (v) {
                        if (v == null || v.isEmpty) return 'Required';
                        if (int.tryParse(v) == null) return 'Invalid';
                        return null;
                      },
                    ),
                  ),
                ),
              ],
            ),

            // Active toggle
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE5E7EB)),
              ),
              child: SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text(
                  'Product Active',
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                    color: kDark,
                  ),
                ),
                subtitle: Text(
                  _isActive
                      ? 'Visible and available for sale'
                      : 'Hidden from sales',
                  style: const TextStyle(fontSize: 12, color: kMuted),
                ),
                value: _isActive,
                onChanged: (v) => setState(() => _isActive = v),
                activeThumbColor: kPrimaryGreen,
              ),
            ),
            const SizedBox(height: 24),

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
                  : Text(_isEditing ? 'Update Product' : 'Create Product'),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}
