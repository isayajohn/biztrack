import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/api/business_api.dart';
import '../../core/models/product.dart';
import '../../core/models/sale.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/product_provider.dart';
import '../../providers/sale_provider.dart';
import '../scanner/barcode_scanner_screen.dart';

class PosScreen extends StatefulWidget {
  const PosScreen({super.key});

  @override
  State<PosScreen> createState() => _PosScreenState();
}

class _PosScreenState extends State<PosScreen> {
  final _searchController = TextEditingController();
  final Map<String, _CartLine> _cart = {};
  List<Map<String, dynamic>> _customers = [];
  List<Map<String, dynamic>> _promotions = [];
  double _defaultTaxRate = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    final productProvider = context.read<ProductProvider>();
    final api = BusinessApi(context.read<ApiClient>());
    await productProvider.fetchProducts();
    try {
      final values = await Future.wait([
        api.customers(),
        api.promotions(),
        api.businessProfile(),
      ]);
      if (!mounted) return;
      setState(() {
        _customers = (values[0] as List<Map<String, dynamic>>)
            .where((item) => item['isActive'] == true)
            .toList();
        _promotions = (values[1] as List<Map<String, dynamic>>)
            .where((item) => item['isAvailable'] == true)
            .toList();
        _defaultTaxRate =
            ((values[2] as Map<String, dynamic>)['defaultTaxRate'] as num?)
                ?.toDouble() ??
            0;
      });
    } catch (_) {}
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  int get _itemCount =>
      _cart.values.fold(0, (total, line) => total + line.quantity);

  double get _subtotal => _cart.values.fold(
    0,
    (total, line) => total + line.product.sellingPrice * line.quantity,
  );

  void _add(Product product) {
    final current = _cart[product.id]?.quantity ?? 0;
    if (current >= product.stockQuantity) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Only ${product.stockQuantity} in stock')),
      );
      return;
    }
    setState(() => _cart[product.id] = _CartLine(product, current + 1));
  }

  void _changeQuantity(Product product, int quantity) {
    setState(() {
      if (quantity <= 0) {
        _cart.remove(product.id);
      } else if (quantity <= product.stockQuantity) {
        _cart[product.id] = _CartLine(product, quantity);
      }
    });
  }

  String _scannerValue(String raw) {
    try {
      final decoded = jsonDecode(raw);
      if (decoded is Map) {
        return (decoded['barcode'] ?? decoded['sku'] ?? decoded['id'] ?? raw)
            .toString();
      }
    } catch (_) {}
    return raw;
  }

  Future<void> _scan() async {
    final raw = await Navigator.of(context).push<String>(
      MaterialPageRoute(builder: (_) => const BarcodeScannerScreen()),
    );
    if (raw == null || !mounted) return;
    final value = _scannerValue(raw);
    final products = context.read<ProductProvider>().activeProducts;
    Product? match;
    for (final product in products) {
      if (product.barcode == value ||
          product.sku == value ||
          product.id == value) {
        match = product;
        break;
      }
    }
    if (match == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('No product found for code $value'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }
    _add(match);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${match.name} added'),
        backgroundColor: kPrimaryGreen,
      ),
    );
  }

  double _promotionDiscount(double amount, Map<String, dynamic>? promotion) {
    if (promotion == null) return 0;
    final minimum = (promotion['minimumPurchase'] as num?)?.toDouble() ?? 0;
    if (amount < minimum) return 0;
    final value = (promotion['value'] as num?)?.toDouble() ?? 0;
    var result = promotion['type'] == 'PERCENTAGE'
        ? amount * value / 100
        : value;
    final maximum = (promotion['maximumDiscount'] as num?)?.toDouble();
    if (maximum != null && result > maximum) result = maximum;
    return result.clamp(0, amount);
  }

  Future<void> _checkout() async {
    if (_cart.isEmpty) return;
    final discountController = TextEditingController(text: '0');
    final taxController = TextEditingController(
      text: NumberFormat('0.##').format(_defaultTaxRate),
    );
    final paidController = TextEditingController();
    String paymentMethod = 'CASH';
    String? customerId;
    String? promotionId;
    bool busy = false;

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (sheetContext) => StatefulBuilder(
        builder: (sheetContext, setSheetState) {
          Map<String, dynamic>? promotion;
          for (final item in _promotions) {
            if (item['id']?.toString() == promotionId) promotion = item;
          }
          final discount = double.tryParse(discountController.text) ?? 0;
          final afterDiscount = (_subtotal - discount)
              .clamp(0, double.infinity)
              .toDouble();
          final promoDiscount = _promotionDiscount(afterDiscount, promotion);
          final taxable = (afterDiscount - promoDiscount).clamp(
            0,
            double.infinity,
          );
          final taxRate = double.tryParse(taxController.text) ?? 0;
          final total = taxable + taxable * taxRate / 100;

          return Padding(
            padding: EdgeInsets.fromLTRB(
              20,
              16,
              20,
              MediaQuery.viewInsetsOf(sheetContext).bottom + 20,
            ),
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      const Expanded(
                        child: Text(
                          'Complete sale',
                          style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                      IconButton(
                        onPressed: () => Navigator.pop(sheetContext),
                        icon: const Icon(Icons.close),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  if (_customers.isNotEmpty)
                    DropdownButtonFormField<String>(
                      initialValue: customerId,
                      decoration: const InputDecoration(
                        labelText: 'Customer (optional)',
                        prefixIcon: Icon(Icons.person_outline),
                      ),
                      items: [
                        const DropdownMenuItem<String>(
                          value: null,
                          child: Text('Walk-in customer'),
                        ),
                        ..._customers.map(
                          (customer) => DropdownMenuItem<String>(
                            value: customer['id'].toString(),
                            child: Text(customer['name'].toString()),
                          ),
                        ),
                      ],
                      onChanged: (value) =>
                          setSheetState(() => customerId = value),
                    ),
                  const SizedBox(height: 12),
                  if (_promotions.isNotEmpty)
                    DropdownButtonFormField<String>(
                      initialValue: promotionId,
                      decoration: const InputDecoration(
                        labelText: 'Promotion (optional)',
                        prefixIcon: Icon(Icons.local_offer_outlined),
                      ),
                      items: [
                        const DropdownMenuItem<String>(
                          value: null,
                          child: Text('No promotion'),
                        ),
                        ..._promotions.map(
                          (promotion) => DropdownMenuItem<String>(
                            value: promotion['id'].toString(),
                            child: Text(
                              '${promotion['code']} · ${promotion['name']}',
                            ),
                          ),
                        ),
                      ],
                      onChanged: (value) =>
                          setSheetState(() => promotionId = value),
                    ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: discountController,
                          keyboardType: const TextInputType.numberWithOptions(
                            decimal: true,
                          ),
                          decoration: const InputDecoration(
                            labelText: 'Discount',
                          ),
                          onChanged: (_) => setSheetState(() {}),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextField(
                          controller: taxController,
                          keyboardType: const TextInputType.numberWithOptions(
                            decimal: true,
                          ),
                          decoration: const InputDecoration(labelText: 'Tax %'),
                          onChanged: (_) => setSheetState(() {}),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: paymentMethod,
                    decoration: const InputDecoration(
                      labelText: 'Payment method',
                      prefixIcon: Icon(Icons.payments_outlined),
                    ),
                    items: Sale.paymentMethods
                        .map(
                          (method) => DropdownMenuItem(
                            value: method,
                            child: Text(Sale.paymentMethodLabel(method)),
                          ),
                        )
                        .toList(),
                    onChanged: (value) => setSheetState(() {
                      paymentMethod = value!;
                      if (paymentMethod == 'CREDIT') paidController.text = '0';
                    }),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: paidController,
                    keyboardType: const TextInputType.numberWithOptions(
                      decimal: true,
                    ),
                    decoration: InputDecoration(
                      labelText: 'Amount paid',
                      hintText: paymentMethod == 'CREDIT'
                          ? '0'
                          : NumberFormat('0.##').format(total),
                    ),
                  ),
                  const SizedBox(height: 18),
                  _CheckoutRow(label: 'Subtotal', value: _subtotal),
                  _CheckoutRow(label: 'Discount', value: -discount),
                  if (promoDiscount > 0)
                    _CheckoutRow(label: 'Promotion', value: -promoDiscount),
                  _CheckoutRow(label: 'Tax', value: total - taxable),
                  const Divider(height: 24),
                  _CheckoutRow(label: 'Total', value: total, strong: true),
                  const SizedBox(height: 18),
                  FilledButton.icon(
                    onPressed: busy
                        ? null
                        : () async {
                            final productProvider = context
                                .read<ProductProvider>();
                            final paid = paidController.text.trim().isEmpty
                                ? (paymentMethod == 'CREDIT' ? 0 : total)
                                : double.tryParse(paidController.text) ?? 0;
                            if (discount > _subtotal || paid > total) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text(
                                    'Check the discount and paid amount',
                                  ),
                                ),
                              );
                              return;
                            }
                            if (paid < total && customerId == null) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text(
                                    'Select a customer for an unpaid balance',
                                  ),
                                ),
                              );
                              return;
                            }
                            setSheetState(() => busy = true);
                            try {
                              final sale = await context
                                  .read<SaleProvider>()
                                  .createPosSale({
                                    'items': _cart.values
                                        .map(
                                          (line) => {
                                            'productId': line.product.id,
                                            'quantity': line.quantity,
                                            'unitPrice':
                                                line.product.sellingPrice,
                                          },
                                        )
                                        .toList(),
                                    'customerId': customerId,
                                    'promotionId': promotionId,
                                    'discount': discount,
                                    'taxRate': taxRate,
                                    'paidAmount': paid,
                                    'paymentMethod': paymentMethod,
                                    'saleDate': DateFormat(
                                      'yyyy-MM-dd',
                                    ).format(DateTime.now()),
                                  });
                              if (!mounted) return;
                              if (!sheetContext.mounted) return;
                              Navigator.pop(sheetContext);
                              setState(() => _cart.clear());
                              await productProvider.fetchProducts();
                              if (!mounted) return;
                              await _showSuccess(sale);
                            } catch (error) {
                              if (mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(error.toString()),
                                    backgroundColor: Colors.red,
                                  ),
                                );
                              }
                            } finally {
                              if (sheetContext.mounted) {
                                setSheetState(() => busy = false);
                              }
                            }
                          },
                    icon: busy
                        ? const SizedBox.square(
                            dimension: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Icon(Icons.check_circle_outline),
                    label: Text(busy ? 'Processing…' : 'Complete sale'),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
    discountController.dispose();
    taxController.dispose();
    paidController.dispose();
  }

  Future<void> _showSuccess(Sale sale) => showDialog<void>(
    context: context,
    builder: (dialogContext) => AlertDialog(
      icon: const Icon(Icons.check_circle, color: kPrimaryGreen, size: 54),
      title: const Text('Sale completed'),
      content: Text(
        'Receipt ${sale.receiptNumber ?? sale.id.substring(0, 8)}\n'
        '${sale.items.length} products · $_currency ${NumberFormat('#,##0').format(sale.totalAmount - sale.discount - sale.promotionDiscount + sale.taxAmount)}',
        textAlign: TextAlign.center,
      ),
      actions: [
        FilledButton(
          onPressed: () => Navigator.pop(dialogContext),
          child: const Text('New sale'),
        ),
      ],
    ),
  );

  String get _currency => context.read<AuthProvider>().user?.currency ?? 'TZS';

  @override
  Widget build(BuildContext context) {
    final currency = context.watch<AuthProvider>().user?.currency ?? 'TZS';
    final products = context.watch<ProductProvider>().activeProducts;
    final query = _searchController.text.trim().toLowerCase();
    final filtered = products.where((product) {
      if (query.isEmpty) return true;
      return product.name.toLowerCase().contains(query) ||
          (product.sku?.toLowerCase().contains(query) ?? false) ||
          (product.barcode?.toLowerCase().contains(query) ?? false);
    }).toList();

    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        title: const Text('Point of Sale'),
        actions: [
          IconButton(
            tooltip: 'Scan barcode',
            onPressed: _scan,
            icon: const Icon(Icons.qr_code_scanner),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: TextField(
              controller: _searchController,
              onChanged: (_) => setState(() {}),
              decoration: InputDecoration(
                hintText: 'Search name, SKU or barcode',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: IconButton(
                  tooltip: 'Camera scanner',
                  onPressed: _scan,
                  icon: const Icon(Icons.center_focus_strong),
                ),
              ),
            ),
          ),
          Expanded(
            child: context.watch<ProductProvider>().loading
                ? const Center(child: CircularProgressIndicator())
                : filtered.isEmpty
                ? const Center(child: Text('No products found'))
                : GridView.builder(
                    padding: const EdgeInsets.all(16),
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          mainAxisSpacing: 12,
                          crossAxisSpacing: 12,
                          childAspectRatio: 1.25,
                        ),
                    itemCount: filtered.length,
                    itemBuilder: (_, index) {
                      final product = filtered[index];
                      final quantity = _cart[product.id]?.quantity ?? 0;
                      return InkWell(
                        onTap: () => _add(product),
                        borderRadius: BorderRadius.circular(16),
                        child: Ink(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: quantity > 0
                                  ? kPrimaryGreen
                                  : kDark.withValues(alpha: 0.08),
                              width: quantity > 0 ? 2 : 1,
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  const Icon(
                                    Icons.inventory_2_outlined,
                                    color: kPrimaryGreen,
                                  ),
                                  const Spacer(),
                                  if (quantity > 0)
                                    CircleAvatar(
                                      radius: 13,
                                      backgroundColor: kPrimaryGreen,
                                      child: Text(
                                        '$quantity',
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 12,
                                          fontWeight: FontWeight.w800,
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                              const Spacer(),
                              Text(
                                product.name,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '$currency ${NumberFormat('#,##0').format(product.sellingPrice)} · ${product.stockQuantity} left',
                                style: const TextStyle(
                                  color: kMuted,
                                  fontSize: 11,
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),
          if (_cart.isNotEmpty)
            Container(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: kDark.withValues(alpha: 0.08),
                    blurRadius: 16,
                    offset: const Offset(0, -4),
                  ),
                ],
              ),
              child: SafeArea(
                top: false,
                child: Column(
                  children: [
                    SizedBox(
                      height: 58,
                      child: ListView(
                        scrollDirection: Axis.horizontal,
                        children: _cart.values
                            .map(
                              (line) => Padding(
                                padding: const EdgeInsets.only(right: 8),
                                child: Chip(
                                  label: Text(
                                    '${line.product.name} × ${line.quantity}',
                                  ),
                                  deleteIcon: const Icon(
                                    Icons.remove,
                                    size: 18,
                                  ),
                                  onDeleted: () => _changeQuantity(
                                    line.product,
                                    line.quantity - 1,
                                  ),
                                ),
                              ),
                            )
                            .toList(),
                      ),
                    ),
                    FilledButton(
                      onPressed: _checkout,
                      child: Row(
                        children: [
                          Text('$_itemCount item${_itemCount == 1 ? '' : 's'}'),
                          const Spacer(),
                          Text(
                            'Charge $currency ${NumberFormat('#,##0').format(_subtotal)}',
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _CartLine {
  final Product product;
  final int quantity;

  const _CartLine(this.product, this.quantity);
}

class _CheckoutRow extends StatelessWidget {
  final String label;
  final double value;
  final bool strong;

  const _CheckoutRow({
    required this.label,
    required this.value,
    this.strong = false,
  });

  @override
  Widget build(BuildContext context) {
    final currency = context.read<AuthProvider>().user?.currency ?? 'TZS';
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                fontWeight: strong ? FontWeight.w900 : FontWeight.w500,
                fontSize: strong ? 17 : 14,
              ),
            ),
          ),
          Text(
            '$currency ${NumberFormat('#,##0.00').format(value)}',
            style: TextStyle(
              fontWeight: strong ? FontWeight.w900 : FontWeight.w700,
              fontSize: strong ? 17 : 14,
            ),
          ),
        ],
      ),
    );
  }
}
