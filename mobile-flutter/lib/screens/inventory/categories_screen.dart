import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/api/api_client.dart';
import '../../core/api/category_api.dart';
import '../../core/models/category.dart';
import '../../core/theme/app_theme.dart';

class CategoriesScreen extends StatefulWidget {
  const CategoriesScreen({super.key});

  @override
  State<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends State<CategoriesScreen> {
  List<Category> _categories = [];
  bool _loading = true;
  String? _error;
  late CategoryApi _api;

  @override
  void initState() {
    super.initState();
    _api = CategoryApi(context.read<ApiClient>());
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final list = await _api.getCategories();
      if (mounted) setState(() => _categories = list);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _showAddDialog({Category? editing}) async {
    final nameCtrl = TextEditingController(text: editing?.name ?? '');
    final descCtrl = TextEditingController(text: editing?.description ?? '');
    final formKey = GlobalKey<FormState>();

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(editing == null ? 'Add Category' : 'Edit Category'),
        content: Form(
          key: formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(
                controller: nameCtrl,
                decoration: const InputDecoration(labelText: 'Name'),
                textCapitalization: TextCapitalization.words,
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: descCtrl,
                decoration: const InputDecoration(labelText: 'Description (optional)'),
                maxLines: 2,
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              if (formKey.currentState!.validate()) Navigator.pop(ctx, true);
            },
            child: Text(editing == null ? 'Add' : 'Save'),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    try {
      if (editing == null) {
        await _api.createCategory(nameCtrl.text.trim(), description: descCtrl.text.trim());
      } else {
        await _api.updateCategory(editing.id, nameCtrl.text.trim(), description: descCtrl.text.trim());
      }
      _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: Colors.red),
        );
      }
    }
  }

  Future<void> _delete(Category cat) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Category'),
        content: Text('Delete "${cat.name}"? This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await _api.deleteCategory(cat.id);
      _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Categories'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_rounded),
            onPressed: () => _showAddDialog(),
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: kPrimaryGreen))
          : _error != null
              ? _buildError()
              : _categories.isEmpty
                  ? _buildEmpty()
                  : RefreshIndicator(
                      onRefresh: _load,
                      color: kPrimaryGreen,
                      child: ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: _categories.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 8),
                        itemBuilder: (_, i) => _CategoryCard(
                          category: _categories[i],
                          onEdit: () => _showAddDialog(editing: _categories[i]),
                          onDelete: () => _delete(_categories[i]),
                        ),
                      ),
                    ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddDialog(),
        backgroundColor: kPrimaryGreen,
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text('Add Category', style: TextStyle(color: Colors.white)),
      ),
    );
  }

  Widget _buildError() => Center(
    child: Padding(
      padding: const EdgeInsets.all(24),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        const Icon(Icons.cloud_off_outlined, size: 48, color: kMuted),
        const SizedBox(height: 12),
        Text(_error!, textAlign: TextAlign.center, style: const TextStyle(color: kMuted)),
        const SizedBox(height: 16),
        ElevatedButton(onPressed: _load, child: const Text('Retry')),
      ]),
    ),
  );

  Widget _buildEmpty() => Center(
    child: Padding(
      padding: const EdgeInsets.all(32),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Icon(Icons.tag_rounded, size: 64, color: kMuted.withValues(alpha: 0.4)),
        const SizedBox(height: 16),
        const Text('No categories yet', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: kDark)),
        const SizedBox(height: 8),
        const Text('Add categories to organise your products.', style: TextStyle(color: kMuted), textAlign: TextAlign.center),
      ]),
    ),
  );
}

class _CategoryCard extends StatelessWidget {
  final Category category;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _CategoryCard({required this.category, required this.onEdit, required this.onDelete});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: Colors.blue.shade50,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Center(
            child: Text(
              category.name.isNotEmpty ? category.name[0].toUpperCase() : 'C',
              style: TextStyle(color: Colors.blue.shade700, fontWeight: FontWeight.w800, fontSize: 18),
            ),
          ),
        ),
        title: Text(category.name, style: const TextStyle(fontWeight: FontWeight.w600, color: kDark)),
        subtitle: category.description != null && category.description!.isNotEmpty
            ? Text(category.description!, style: const TextStyle(color: kMuted, fontSize: 12))
            : Text('${category.productCount} product${category.productCount == 1 ? '' : 's'}',
                style: const TextStyle(color: kMuted, fontSize: 12)),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(icon: const Icon(Icons.edit_outlined, size: 18, color: kMuted), onPressed: onEdit),
            IconButton(icon: Icon(Icons.delete_outline, size: 18, color: Colors.red.shade400), onPressed: onDelete),
          ],
        ),
      ),
    );
  }
}
