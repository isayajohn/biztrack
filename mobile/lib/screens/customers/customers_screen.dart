import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/api/business_api.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';

class CustomersScreen extends StatefulWidget {
  const CustomersScreen({super.key});
  @override
  State<CustomersScreen> createState() => _CustomersScreenState();
}

class _CustomersScreenState extends State<CustomersScreen> {
  List<Map<String, dynamic>> items = [];
  bool loading = true;
  String? error;
  BusinessApi get api => BusinessApi(context.read());
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => load());
  }

  Future<void> load() async {
    setState(() {
      loading = true;
      error = null;
    });
    try {
      items = await api.customers();
    } catch (e) {
      error = e.toString();
    }
    if (mounted) setState(() => loading = false);
  }

  Future<void> add() async {
    final name = TextEditingController(),
        phone = TextEditingController(),
        email = TextEditingController(),
        limit = TextEditingController(text: '0');
    final ok = await showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        title: const Text('Add customer'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: name,
                decoration: const InputDecoration(labelText: 'Name'),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: phone,
                decoration: const InputDecoration(labelText: 'Phone'),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: email,
                decoration: const InputDecoration(labelText: 'Email'),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: limit,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Credit limit'),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(c, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(c, true),
            child: const Text('Save'),
          ),
        ],
      ),
    );
    if (ok == true && name.text.trim().isNotEmpty) {
      try {
        await api.createCustomer({
          'name': name.text.trim(),
          'phone': phone.text.trim(),
          'email': email.text.trim(),
          'creditLimit': double.tryParse(limit.text) ?? 0,
        });
        await load();
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(SnackBar(content: Text(e.toString())));
        }
      }
    }
  }

  Future<void> payment(Map<String, dynamic> customer) async {
    final amount = TextEditingController(
      text: '${customer['creditBalance'] ?? 0}',
    );
    final ok = await showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        title: Text('Payment from ${customer['name']}'),
        content: TextField(
          controller: amount,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(labelText: 'Amount'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(c, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(c, true),
            child: const Text('Record'),
          ),
        ],
      ),
    );
    if (ok == true) {
      await api.recordCustomerPayment(customer['id'].toString(), {
        'amount': double.tryParse(amount.text) ?? 0,
        'paymentMethod': 'CASH',
        'paymentDate': DateFormat('yyyy-MM-dd').format(DateTime.now()),
      });
      await load();
    }
  }

  @override
  Widget build(BuildContext context) {
    final currency = context.watch<AuthProvider>().user?.currency ?? 'TZS';
    return Scaffold(
      appBar: AppBar(title: const Text('Customers')),
      floatingActionButton: FloatingActionButton(
        onPressed: add,
        child: const Icon(Icons.person_add_alt_1),
      ),
      body: RefreshIndicator(
        onRefresh: load,
        child: loading
            ? const Center(child: CircularProgressIndicator())
            : error != null
            ? ListView(
                children: [
                  Padding(
                    padding: const EdgeInsets.all(24),
                    child: Text(
                      error!,
                      style: const TextStyle(color: Colors.red),
                    ),
                  ),
                ],
              )
            : items.isEmpty
            ? ListView(
                children: const [
                  Padding(
                    padding: EdgeInsets.all(40),
                    child: Center(child: Text('No customers yet')),
                  ),
                ],
              )
            : ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: items.length,
                separatorBuilder: (_, __) => const SizedBox(height: 8),
                itemBuilder: (_, i) {
                  final c = items[i],
                      balance = (c['creditBalance'] as num?)?.toDouble() ?? 0;
                  return Card(
                    child: ListTile(
                      leading: CircleAvatar(
                        backgroundColor: kLightGreen,
                        child: Text(
                          c['name'].toString().substring(0, 1).toUpperCase(),
                          style: const TextStyle(
                            color: kPrimaryGreen,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      title: Text(
                        c['name'].toString(),
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                      subtitle: Text(
                        '${c['phone'] ?? 'No phone'}\nOwing: $currency ${NumberFormat('#,##0.00').format(balance)}',
                      ),
                      isThreeLine: true,
                      trailing: balance > 0
                          ? IconButton(
                              onPressed: () => payment(c),
                              icon: const Icon(
                                Icons.payments_outlined,
                                color: kPrimaryGreen,
                              ),
                            )
                          : const Icon(Icons.chevron_right),
                    ),
                  );
                },
              ),
      ),
    );
  }
}
