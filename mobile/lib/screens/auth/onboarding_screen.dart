import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import 'auth_widgets.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});
  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _business = TextEditingController();
  final _code = TextEditingController();
  String _mode = 'CREATE';
  String _currency = 'TZS';
  bool _loading = false;
  bool _checking = false;
  Map<String, dynamic>? _preview;
  String? _error;

  @override
  void initState() {
    super.initState();
    _mode = context.read<AuthProvider>().user?.onboardingIntent ?? 'CREATE';
  }

  @override
  void dispose() {
    _business.dispose();
    _code.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_mode == 'CREATE' && _business.text.trim().isEmpty) {
      return setState(() => _error = 'Enter your business name.');
    }
    if (_mode == 'JOIN' && _code.text.trim().isEmpty) {
      return setState(() => _error = 'Enter your invitation code.');
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final auth = context.read<AuthProvider>();
      if (_mode == 'CREATE') {
        await auth.createWorkspace(_business.text.trim(), _currency);
      } else {
        await auth.acceptInvitation(_code.text.trim());
      }
      if (mounted) context.go('/');
    } catch (reason) {
      if (mounted) setState(() => _error = reason.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _check() async {
    if (_code.text.trim().isEmpty) {
      return setState(() => _error = 'Enter your invitation code.');
    }
    setState(() {
      _checking = true;
      _error = null;
      _preview = null;
    });
    try {
      final result = await context.read<AuthProvider>().validateInvitation(
        _code.text.trim(),
      );
      if (mounted) setState(() => _preview = result);
    } catch (reason) {
      if (mounted) setState(() => _error = reason.toString());
    } finally {
      if (mounted) setState(() => _checking = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        title: const Text('Set up your workspace'),
        automaticallyImplyLeading: false,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: kPrimaryGreen.withValues(alpha: .1),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(
                  _mode == 'CREATE'
                      ? Icons.business_center_outlined
                      : Icons.confirmation_number_outlined,
                  color: kPrimaryGreen,
                ),
              ),
              const SizedBox(height: 18),
              Text(
                _mode == 'CREATE'
                    ? 'Set up your workspace'
                    : 'Join your workspace',
                style: const TextStyle(
                  fontSize: 27,
                  fontWeight: FontWeight.w800,
                  color: kDark,
                ),
              ),
              const SizedBox(height: 7),
              Text(
                _mode == 'CREATE'
                    ? 'Tell us about your business to create your workspace.'
                    : 'Enter the invitation code shared by your administrator.',
                style: const TextStyle(color: kMuted, height: 1.5),
              ),
              const SizedBox(height: 26),
              if (_mode == 'CREATE') ...[
                AuthInputField(
                  controller: _business,
                  label: 'Business name',
                  icon: Icons.storefront_outlined,
                ),
                const SizedBox(height: 15),
                AuthDropdownField<String>(
                  value: _currency,
                  label: 'Currency',
                  icon: Icons.payments_outlined,
                  items: const [
                    DropdownMenuItem(
                      value: 'TZS',
                      child: Text('TZS — Tanzanian Shilling'),
                    ),
                  ],
                  onChanged: (value) =>
                      setState(() => _currency = value ?? 'TZS'),
                ),
                const SizedBox(height: 15),
                Container(
                  padding: const EdgeInsets.all(15),
                  decoration: BoxDecoration(
                    color: Colors.green.shade50,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: Colors.green.shade200),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.check_circle_outline, color: kPrimaryGreen),
                      SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Free plan',
                              style: TextStyle(
                                fontWeight: FontWeight.w800,
                                color: kDark,
                              ),
                            ),
                            Text(
                              'Assigned automatically. Upgrade later.',
                              style: TextStyle(color: kMuted, fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ] else ...[
                Row(
                  children: [
                    Expanded(
                      child: AuthInputField(
                        controller: _code,
                        label: 'Invitation code',
                        icon: Icons.confirmation_number_outlined,
                      ),
                    ),
                    const SizedBox(width: 8),
                    SizedBox(
                      height: 56,
                      child: OutlinedButton(
                        onPressed: _checking ? null : _check,
                        child: _checking
                            ? const SizedBox(
                                width: 17,
                                height: 17,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                ),
                              )
                            : const Text('Check'),
                      ),
                    ),
                  ],
                ),
                if (_preview != null) ...[
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.all(15),
                    decoration: BoxDecoration(
                      color: Colors.green.shade50,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Text(
                      'Join ${_preview!['businessName']} as ${_preview!['role']}',
                      style: const TextStyle(
                        color: kPrimaryGreen,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ],
              if (_error != null) ...[
                const SizedBox(height: 15),
                AuthErrorBox(message: _error!),
              ],
              const SizedBox(height: 22),
              AuthPrimaryButton(
                loading: _loading,
                label: _mode == 'CREATE'
                    ? 'Create business workspace'
                    : 'Join workspace',
                onTap: _submit,
              ),
              const SizedBox(height: 14),
              Center(
                child: TextButton(
                  onPressed: () => setState(() {
                    _mode = _mode == 'CREATE' ? 'JOIN' : 'CREATE';
                    _error = null;
                  }),
                  child: Text(
                    _mode == 'CREATE'
                        ? 'Join with an invitation code'
                        : 'Create a business instead',
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
