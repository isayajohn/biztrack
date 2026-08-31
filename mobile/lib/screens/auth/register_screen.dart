import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/api/auth_api.dart';
import '../../providers/auth_provider.dart';
import 'auth_widgets.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _password = TextEditingController();
  String _intent = 'CREATE';
  String _method = 'EMAIL';
  bool _accepted = false;
  bool _obscure = true;
  bool _loading = false;
  String? _error;
  Map<String, LegalDocument>? _legalDocuments;
  bool _legalLoading = true;

  @override
  void initState() {
    super.initState();
    _loadLegalDocuments();
  }

  Future<void> _loadLegalDocuments() async {
    try {
      final documents = await context.read<AuthProvider>().getLegalDocuments();
      if (mounted) setState(() => _legalDocuments = documents);
    } catch (reason) {
      if (mounted) {
        setState(() => _error = 'Unable to load legal documents: $reason');
      }
    } finally {
      if (mounted) setState(() => _legalLoading = false);
    }
  }

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _phone.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_legalDocuments == null) {
      return setState(
        () => _error = 'Terms and Privacy Policy are unavailable. Try again.',
      );
    }
    if (!_accepted) {
      return setState(
        () => _error = 'Accept the Terms and Privacy Policy to continue.',
      );
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final result = await context.read<AuthProvider>().register(
        name: _name.text.trim(),
        email: _method == 'EMAIL' ? _email.text.trim() : null,
        phone: _method == 'PHONE' ? _phone.text.trim() : null,
        password: _password.text,
        verificationMethod: _method,
        onboardingIntent: _intent,
        termsAccepted: _accepted,
        termsVersion: _legalDocuments!['terms']!.version,
        privacyVersion: _legalDocuments!['privacy']!.version,
      );
      if (mounted) context.go('/verify-account', extra: result);
    } catch (reason) {
      if (mounted) setState(() => _error = reason.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          onPressed: () => context.go('/login'),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 8, 24, 30),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: kPrimaryGreen.withValues(alpha: .1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Text(
                    'START FOR FREE',
                    style: TextStyle(
                      color: kPrimaryGreen,
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.2,
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                const Text(
                  'Create your account',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w800,
                    color: kDark,
                    letterSpacing: -.5,
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Create your account to get started.',
                  style: TextStyle(color: kMuted, fontSize: 14),
                ),
                const SizedBox(height: 26),
                const Text(
                  'What would you like to do?',
                  style: TextStyle(fontWeight: FontWeight.w700, color: kDark),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: _ChoiceCard(
                        active: _intent == 'CREATE',
                        icon: Icons.business_center_outlined,
                        title: 'Create a business',
                        subtitle: 'Set up after sign-in',
                        onTap: () => setState(() => _intent = 'CREATE'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _ChoiceCard(
                        active: _intent == 'JOIN',
                        icon: Icons.confirmation_number_outlined,
                        title: 'Join with a code',
                        subtitle: 'Join after verification',
                        onTap: () => setState(() => _intent = 'JOIN'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 22),
                AuthInputField(
                  controller: _name,
                  label: 'Full name',
                  icon: Icons.person_outline,
                  validator: (value) => value == null || value.trim().length < 2
                      ? 'Enter your full name'
                      : null,
                ),
                const SizedBox(height: 18),
                const Text(
                  'Register using',
                  style: TextStyle(fontWeight: FontWeight.w700, color: kDark),
                ),
                const SizedBox(height: 9),
                SegmentedButton<String>(
                  segments: const [
                    ButtonSegment(
                      value: 'EMAIL',
                      icon: Icon(Icons.email_outlined),
                      label: Text('Email address'),
                    ),
                    ButtonSegment(
                      value: 'PHONE',
                      icon: Icon(Icons.sms_outlined),
                      label: Text('Phone number'),
                    ),
                  ],
                  selected: {_method},
                  onSelectionChanged: (value) =>
                      setState(() => _method = value.first),
                  showSelectedIcon: false,
                ),
                const SizedBox(height: 16),
                if (_method == 'EMAIL') ...[
                  AuthInputField(
                    controller: _email,
                    label: 'Email address',
                    icon: Icons.email_outlined,
                    keyboardType: TextInputType.emailAddress,
                    validator: (value) => value == null || !value.contains('@')
                        ? 'Enter a valid email address'
                        : null,
                  ),
                  const Padding(
                    padding: EdgeInsets.only(top: 6, left: 4),
                    child: Text(
                      'We will send you an account verification link.',
                      style: TextStyle(color: kMuted, fontSize: 11),
                    ),
                  ),
                ] else ...[
                  AuthInputField(
                    controller: _phone,
                    label: 'Phone number',
                    icon: Icons.phone_outlined,
                    keyboardType: TextInputType.phone,
                    validator: (value) =>
                        value == null ||
                            value.replaceAll(RegExp(r'\D'), '').length < 10
                        ? 'Enter a valid phone number'
                        : null,
                  ),
                  const Padding(
                    padding: EdgeInsets.only(top: 6, left: 4),
                    child: Text(
                      'We will send you a 6-digit verification code.',
                      style: TextStyle(color: kMuted, fontSize: 11),
                    ),
                  ),
                ],
                const SizedBox(height: 16),
                AuthInputField(
                  controller: _password,
                  label: 'Create a password',
                  icon: Icons.lock_outline,
                  obscure: _obscure,
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscure
                          ? Icons.visibility_off_outlined
                          : Icons.visibility_outlined,
                    ),
                    onPressed: () => setState(() => _obscure = !_obscure),
                  ),
                  validator: (value) => value == null || value.length < 8
                      ? 'Use at least 8 characters'
                      : null,
                ),
                const Padding(
                  padding: EdgeInsets.only(top: 6, left: 4),
                  child: Text(
                    'Use at least 8 characters.',
                    style: TextStyle(color: kMuted, fontSize: 11),
                  ),
                ),
                const SizedBox(height: 18),
                CheckboxListTile(
                  value: _accepted,
                  onChanged: _legalDocuments == null
                      ? null
                      : (value) => setState(() => _accepted = value ?? false),
                  contentPadding: EdgeInsets.zero,
                  controlAffinity: ListTileControlAffinity.leading,
                  title: const Text(
                    'I agree to the Terms and Conditions and Privacy Policy.',
                    style: TextStyle(fontSize: 12.5, color: kMuted),
                  ),
                  dense: true,
                ),
                Wrap(
                  spacing: 6,
                  runSpacing: 4,
                  children: [
                    TextButton.icon(
                      onPressed: _legalDocuments?['terms'] == null
                          ? null
                          : () => _showLegalDialog(_legalDocuments!['terms']!),
                      icon: const Icon(Icons.description_outlined, size: 17),
                      label: const Text('Terms and Conditions'),
                    ),
                    TextButton.icon(
                      onPressed: _legalDocuments?['privacy'] == null
                          ? null
                          : () =>
                                _showLegalDialog(_legalDocuments!['privacy']!),
                      icon: const Icon(Icons.shield_outlined, size: 17),
                      label: const Text('Privacy Policy'),
                    ),
                  ],
                ),
                if (_legalLoading)
                  const Padding(
                    padding: EdgeInsets.only(top: 4),
                    child: LinearProgressIndicator(minHeight: 2),
                  ),
                if (_error != null) ...[
                  const SizedBox(height: 10),
                  AuthErrorBox(message: _error!),
                ],
                const SizedBox(height: 18),
                AuthPrimaryButton(
                  loading: _loading,
                  label: 'Create account',
                  onTap: _submit,
                ),
                const SizedBox(height: 20),
                Center(
                  child: TextButton(
                    onPressed: () => context.go('/login'),
                    child: const Text('Already have an account? Sign in'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _showLegalDialog(LegalDocument document) {
    return showDialog<void>(
      context: context,
      builder: (dialogContext) => Dialog(
        insetPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 32),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 650, maxHeight: 720),
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 18, 10, 14),
                child: Row(
                  children: [
                    Icon(
                      document.type == 'TERMS'
                          ? Icons.description_outlined
                          : Icons.shield_outlined,
                      color: kPrimaryGreen,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            document.title,
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w800,
                              color: kDark,
                            ),
                          ),
                          Text(
                            'Version ${document.version} · Effective ${document.effectiveDate}',
                            style: const TextStyle(fontSize: 11, color: kMuted),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.pop(dialogContext),
                      icon: const Icon(Icons.close_rounded),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: kPrimaryGreen.withValues(alpha: .07),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          document.summary,
                          style: const TextStyle(color: kMuted, height: 1.45),
                        ),
                      ),
                      const SizedBox(height: 20),
                      ...document.sections.map(
                        (section) => Padding(
                          padding: const EdgeInsets.only(bottom: 20),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                section.heading,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w800,
                                  color: kDark,
                                ),
                              ),
                              const SizedBox(height: 7),
                              Text(
                                section.body,
                                style: const TextStyle(
                                  color: kMuted,
                                  height: 1.55,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(16),
                child: SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: () => Navigator.pop(dialogContext),
                    child: const Text('I have read this document'),
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

class _ChoiceCard extends StatelessWidget {
  final bool active;
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  const _ChoiceCard({
    required this.active,
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });
  @override
  Widget build(BuildContext context) => InkWell(
    onTap: onTap,
    borderRadius: BorderRadius.circular(14),
    child: Container(
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        color: active ? kPrimaryGreen.withValues(alpha: .08) : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: active ? kPrimaryGreen : kCardBorder,
          width: active ? 1.5 : 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: active ? kPrimaryGreen : kMuted),
          const SizedBox(height: 9),
          Text(
            title,
            style: const TextStyle(
              fontWeight: FontWeight.w700,
              color: kDark,
              fontSize: 13,
            ),
          ),
          const SizedBox(height: 3),
          Text(subtitle, style: const TextStyle(color: kMuted, fontSize: 10.5)),
        ],
      ),
    ),
  );
}
