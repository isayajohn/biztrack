import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/business_api.dart';
import '../../core/theme/app_theme.dart';

class InventoryManagementScreen extends StatefulWidget {
  const InventoryManagementScreen({super.key});

  @override
  State<InventoryManagementScreen> createState() => _InventoryManagementScreenState();
}

class _InventoryManagementScreenState extends State<InventoryManagementScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs;
  List<Map<String, dynamic>> _brands = [];
  List<Map<String, dynamic>> _adjustments = [];
  bool _loading = true;

  BusinessApi get _api => BusinessApi(context.read());

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final values = await Future.wait([_api.brands(), _api.adjustments()]);
      _brands = values[0];
      _adjustments = values[1];
    } catch (error) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.toString())));
    }
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _decide(String id, bool approve) async {
    if (approve) {
      await _api.approveAdjustment(id);
    } else {
      await _api.rejectAdjustment(id);
    }
    setState(() => _loading = true);
    await _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Brands & Adjustments'),
        bottom: TabBar(controller: _tabs, tabs: const [Tab(text: 'Brands'), Tab(text: 'Stock counts')]),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabs,
              children: [
                ListView(
                  padding: const EdgeInsets.all(16),
                  children: _brands.map((brand) => Card(child: ListTile(
                    leading: const Icon(Icons.branding_watermark_outlined, color: kPrimaryGreen),
                    title: Text(brand['name'].toString()),
                    subtitle: Text('${brand['productCount'] ?? 0} products'),
                  ))).toList(),
                ),
                ListView(
                  padding: const EdgeInsets.all(16),
                  children: _adjustments.map((adjustment) {
                    final difference = (adjustment['difference'] as num?)?.toInt() ?? 0;
                    final product = adjustment['product'] is Map ? adjustment['product'] as Map : null;
                    return Card(child: ListTile(
                      leading: Icon(difference >= 0 ? Icons.add_chart : Icons.trending_down, color: difference >= 0 ? kPrimaryGreen : Colors.red),
                      title: Text(product?['name']?.toString() ?? 'Product'),
                      subtitle: Text('System ${adjustment['systemStock']} · Physical ${adjustment['physicalCount']} · Difference $difference'),
                      trailing: adjustment['status'] == 'PENDING'
                          ? PopupMenuButton<bool>(
                              onSelected: (approve) => _decide(adjustment['id'].toString(), approve),
                              itemBuilder: (_) => const [PopupMenuItem(value: true, child: Text('Approve')), PopupMenuItem(value: false, child: Text('Reject'))],
                            )
                          : Text(adjustment['status'].toString(), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                    ));
                  }).toList(),
                ),
              ],
            ),
    );
  }
}
