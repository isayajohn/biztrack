import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/api/business_api.dart';
import '../../core/theme/app_theme.dart';

class PromotionsScreen extends StatefulWidget {
  const PromotionsScreen({super.key});
  @override
  State<PromotionsScreen> createState() => _State();
}

class _State extends State<PromotionsScreen> {
  List<Map<String, dynamic>> items = [];
  bool loading = true;
  BusinessApi get api => BusinessApi(context.read());
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => load());
  }

  Future<void> load() async {
    try {
      items = await api.promotions();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    }
    if (mounted) setState(() => loading = false);
  }

  Future<void> add() async {
    final name = TextEditingController(),
        code = TextEditingController(),
        value = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        title: const Text('New percentage promotion'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: name,
              decoration: const InputDecoration(labelText: 'Name'),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: code,
              decoration: const InputDecoration(labelText: 'Code'),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: value,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Percentage'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(c, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(c, true),
            child: const Text('Create'),
          ),
        ],
      ),
    );
    if (ok == true) {
      final now = DateTime.now();
      await api.createPromotion({
        'name': name.text,
        'code': code.text.toUpperCase(),
        'type': 'PERCENTAGE',
        'value': double.tryParse(value.text) ?? 0,
        'minimumPurchase': 0,
        'startsAt': now.toIso8601String(),
        'endsAt': now.add(const Duration(days: 30)).toIso8601String(),
      });
      setState(() => loading = true);
      await load();
    }
  }

  @override
  Widget build(BuildContext c) => Scaffold(
    appBar: AppBar(title: const Text('Promotions')),
    floatingActionButton: FloatingActionButton(
      onPressed: add,
      child: const Icon(Icons.add),
    ),
    body: loading
        ? const Center(child: CircularProgressIndicator())
        : ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: items.length,
            itemBuilder: (_, i) {
              final p = items[i];
              return Card(
                child: ListTile(
                  leading: const Icon(
                    Icons.local_offer_outlined,
                    color: kPrimaryGreen,
                  ),
                  title: Text(
                    p['name'].toString(),
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  subtitle: Text(
                    '${p['code']} · ${p['type'] == 'PERCENTAGE' ? '${p['value']}%' : '${p['value']}'} off · used ${p['timesUsed'] ?? 0}',
                  ),
                  trailing: Icon(
                    Icons.circle,
                    size: 12,
                    color: p['isAvailable'] == true ? kPrimaryGreen : kMuted,
                  ),
                ),
              );
            },
          ),
  );
}
