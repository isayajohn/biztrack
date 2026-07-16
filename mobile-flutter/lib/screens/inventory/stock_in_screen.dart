import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/inventory_provider.dart';
import '../../providers/product_provider.dart';
import '../../widgets/form_field_wrapper.dart';

class StockInScreen extends StatefulWidget {
  const StockInScreen({super.key});

  @override
  State<StockInScreen> createState() => _StockInScreenState();
}

class _StockInScreenState extends State<StockInScreen> {
  final _formKey = GlobalKey<FormState>();
  final _quantityCtrl = TextEditingController();
  final _reasonCtrl = TextEditingController();

  String? _selectedProductId;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ProductProvider>().fetchProducts();
    });
  }

  @override
  void dispose() {
    _quantityCtrl.dispose();
    _reasonCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedProductId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select a product'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    final qty = int.tryParse(_quantityCtrl.text.trim()) ?? 0;
    final reason = _reasonCtrl.text.trim().isEmpty
        ? null
        : _reasonCtrl.text.trim();

    setState(() => _loading = true);
    try {
      await context.read<InventoryProvider>().stockIn(
        _selectedProductId!,
        qty,
        reason,
      );
      // Refresh products too so stock quantities update
      if (mounted) {
        context.read<ProductProvider>().fetchProducts();
      }
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Stock added successfully!'),
          backgroundColor: kPrimaryGreen,
        ),
      );
      context.pop();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString()), backgroundColor: Colors.red),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Stock In'),
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
            // Header info card
            Container(
              padding: const EdgeInsets.all(16),
              margin: const EdgeInsets.only(bottom: 20),
              decoration: BoxDecoration(
                color: kLightGreen,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: kPrimaryGreen.withValues(alpha: kBadgeAlpha),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(
                      Icons.add_circle_rounded,
                      color: kPrimaryGreen,
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Add Stock',
                          style: TextStyle(
                            fontWeight: FontWeight.w700,
                            color: kDark,
                            fontSize: 15,
                          ),
                        ),
                        SizedBox(height: 2),
                        Text(
                          'Record incoming inventory for a product',
                          style: TextStyle(color: kMuted, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Product picker
            Consumer<ProductProvider>(
              builder: (ctx, productProvider, _) {
                final products = productProvider.activeProducts;
                return FormFieldWrapper(
                  label: 'Product',
                  child: DropdownButtonFormField<String>(
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
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        )
                        .toList(),
                    onChanged: (id) => setState(() => _selectedProductId = id),
                    validator: (v) =>
                        v == null ? 'Please select a product' : null,
                    isExpanded: true,
                  ),
                );
              },
            ),

            // Quantity
            FormFieldWrapper(
              label: 'Quantity to Add',
              child: TextFormField(
                controller: _quantityCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  hintText: 'Enter quantity',
                  prefixIcon: Icon(Icons.numbers_outlined),
                ),
                validator: (v) {
                  if (v == null || v.isEmpty) return 'Quantity is required';
                  final qty = int.tryParse(v);
                  if (qty == null || qty <= 0) {
                    return 'Enter a valid quantity (> 0)';
                  }
                  return null;
                },
              ),
            ),

            // Reason
            FormFieldWrapper(
              label: 'Reason (optional)',
              child: TextFormField(
                controller: _reasonCtrl,
                maxLines: 3,
                decoration: const InputDecoration(
                  hintText: 'e.g. Purchase from supplier, Stock adjustment...',
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
                  : const Text('Add Stock'),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}
