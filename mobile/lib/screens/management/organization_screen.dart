import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/api/business_api.dart';
import '../../providers/auth_provider.dart';
import '../../core/theme/app_theme.dart';

class OrganizationScreen extends StatefulWidget {
  const OrganizationScreen({super.key});
  @override
  State<OrganizationScreen> createState() => _State();
}

class _State extends State<OrganizationScreen> {
  List<Map<String, dynamic>> branches = [];
  List<Map<String, dynamic>> staff = [];
  bool loading = true;
  BusinessApi get api => BusinessApi(context.read());
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => load());
  }

  Future<void> load() async {
    final user = context.read<AuthProvider>().user;
    try {
      branches = await api.branches();
      if (user?.can('staff.manage') == true) {
        final data = await api.staff();
        staff = List<Map<String, dynamic>>.from(
          (data['staff'] as List? ?? []).map(
            (e) => Map<String, dynamic>.from(e as Map),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    }
    if (mounted) setState(() => loading = false);
  }

  Future<void> addBranch() async {
    final n = TextEditingController(), code = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        title: const Text('Add branch'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: n,
              decoration: const InputDecoration(labelText: 'Name'),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: code,
              decoration: const InputDecoration(labelText: 'Code'),
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
            child: const Text('Save'),
          ),
        ],
      ),
    );
    if (ok == true) {
      await api.createBranch({'name': n.text, 'code': code.text.toUpperCase()});
      setState(() => loading = true);
      await load();
    }
  }

  @override
  Widget build(BuildContext c) => Scaffold(
    appBar: AppBar(title: const Text('Branches & Staff')),
    floatingActionButton:
        context.watch<AuthProvider>().user?.can('branches.manage') == true
        ? FloatingActionButton(
            onPressed: addBranch,
            child: const Icon(Icons.add_business),
          )
        : null,
    body: loading
        ? const Center(child: CircularProgressIndicator())
        : ListView(
            padding: const EdgeInsets.all(16),
            children: [
              const Text(
                'Branches',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 8),
              ...branches.map(
                (b) => Card(
                  child: ListTile(
                    onTap: () async {
                      await api.selectBranch(b['id'].toString());
                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('${b['name']} selected'),
                            backgroundColor: kPrimaryGreen,
                          ),
                        );
                      }
                    },
                    leading: const Icon(
                      Icons.store_outlined,
                      color: kPrimaryGreen,
                    ),
                    title: Text(b['name'].toString()),
                    subtitle: Text(
                      '${b['code']} · ${b['staffCount'] ?? 0} staff',
                    ),
                    trailing: b['isDefault'] == true
                        ? const Chip(label: Text('Default'))
                        : const Icon(Icons.swap_horiz),
                  ),
                ),
              ),
              if (staff.isNotEmpty) ...[
                const SizedBox(height: 20),
                const Text(
                  'Staff',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 8),
                ...staff.map((m) {
                  final u = Map<String, dynamic>.from(m['user'] as Map);
                  return Card(
                    child: ListTile(
                      leading: const Icon(
                        Icons.badge_outlined,
                        color: kPrimaryGreen,
                      ),
                      title: Text(u['name'].toString()),
                      subtitle: Text(
                        '${m['role']} · ${m['branch'] is Map ? (m['branch'] as Map)['name'] : 'All branches'}',
                      ),
                    ),
                  );
                }),
              ],
            ],
          ),
  );
}
