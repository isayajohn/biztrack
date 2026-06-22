import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _bizNameCtrl = TextEditingController();
  String _currency = 'USD';
  String _country = 'Tanzania';
  bool _loading = false;
  bool _obscure = true;
  String? _error;

  static const _currencies = [
    'USD', 'TZS', 'KES', 'UGX', 'ZAR', 'NGN', 'GHS', 'EUR', 'GBP',
  ];

  static const _countries = [
    'Tanzania', 'Kenya', 'Uganda', 'South Africa', 'Nigeria', 'Ghana',
    'Rwanda', 'Ethiopia', 'Zambia', 'Zimbabwe', 'Other',
  ];

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _passCtrl.dispose();
    _bizNameCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await context.read<AuthProvider>().register(
            name: _nameCtrl.text.trim(),
            email: _emailCtrl.text.trim(),
            password: _passCtrl.text,
            businessName: _bizNameCtrl.text.trim(),
            currency: _currency,
            country: _country,
          );
      if (mounted) context.go('/');
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        title: const Text('Create Account'),
        backgroundColor: Colors.transparent,
        foregroundColor: kDark,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded),
          onPressed: () => context.go('/login'),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Start tracking\nyour business',
                  style: TextStyle(
                    fontSize: 26,
                    fontWeight: FontWeight.w800,
                    color: kDark,
                    height: 1.2,
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Create your free BizTrack account',
                  style: TextStyle(color: kMuted, fontSize: 14),
                ),
                const SizedBox(height: 28),
                _sectionLabel('Personal Info'),
                TextFormField(
                  controller: _nameCtrl,
                  textInputAction: TextInputAction.next,
                  decoration: const InputDecoration(
                    labelText: 'Full Name',
                    prefixIcon: Icon(Icons.person_outline),
                  ),
                  validator: (v) =>
                      v == null || v.isEmpty ? 'Enter your name' : null,
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _emailCtrl,
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  decoration: const InputDecoration(
                    labelText: 'Email',
                    prefixIcon: Icon(Icons.email_outlined),
                  ),
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'Enter your email';
                    if (!v.contains('@')) return 'Enter a valid email';
                    return null;
                  },
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _passCtrl,
                  obscureText: _obscure,
                  textInputAction: TextInputAction.next,
                  decoration: InputDecoration(
                    labelText: 'Password',
                    prefixIcon: const Icon(Icons.lock_outline),
                    suffixIcon: IconButton(
                      icon: Icon(_obscure
                          ? Icons.visibility_off_outlined
                          : Icons.visibility_outlined),
                      onPressed: () => setState(() => _obscure = !_obscure),
                    ),
                  ),
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'Enter a password';
                    if (v.length < 8) return 'Minimum 8 characters';
                    return null;
                  },
                ),
                const SizedBox(height: 24),
                _sectionLabel('Business Info'),
                TextFormField(
                  controller: _bizNameCtrl,
                  textInputAction: TextInputAction.next,
                  decoration: const InputDecoration(
                    labelText: 'Business Name',
                    prefixIcon: Icon(Icons.storefront_outlined),
                  ),
                  validator: (v) =>
                      v == null || v.isEmpty ? 'Enter business name' : null,
                ),
                const SizedBox(height: 14),
                DropdownButtonFormField<String>(
                  initialValue: _currency,
                  decoration: const InputDecoration(
                    labelText: 'Currency',
                    prefixIcon: Icon(Icons.attach_money_outlined),
                  ),
                  items: _currencies
                      .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                      .toList(),
                  onChanged: (v) => setState(() => _currency = v!),
                ),
                const SizedBox(height: 14),
                DropdownButtonFormField<String>(
                  initialValue: _country,
                  decoration: const InputDecoration(
                    labelText: 'Country',
                    prefixIcon: Icon(Icons.public_outlined),
                  ),
                  items: _countries
                      .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                      .toList(),
                  onChanged: (v) => setState(() => _country = v!),
                ),
                if (_error != null) ...[
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.red.shade50,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.red.shade200),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.error_outline,
                            color: Colors.red.shade600, size: 16),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _error!,
                            style: TextStyle(
                                color: Colors.red.shade700, fontSize: 13),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: _loading ? null : _submit,
                  child: _loading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.white),
                        )
                      : const Text('Create Account'),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text('Already have an account? ',
                        style: TextStyle(color: kMuted)),
                    GestureDetector(
                      onTap: () => context.go('/login'),
                      child: const Text(
                        'Sign in',
                        style: TextStyle(
                          color: kPrimaryGreen,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _sectionLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w700,
          color: kMuted,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}
