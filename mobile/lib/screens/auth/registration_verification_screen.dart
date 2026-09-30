import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/api/auth_api.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import 'auth_widgets.dart';

class RegistrationVerificationScreen extends StatefulWidget {
  final RegistrationResult registration;
  const RegistrationVerificationScreen({super.key, required this.registration});

  @override
  State<RegistrationVerificationScreen> createState() =>
      _RegistrationVerificationScreenState();
}

class _RegistrationVerificationScreenState
    extends State<RegistrationVerificationScreen> {
  final _otp = TextEditingController();
  bool _loading = false;
  bool _resending = false;
  String? _error;
  String? _notice;

  bool get isPhone => widget.registration.verificationMethod == 'PHONE';

  Future<void> _backToLogin() async {
    await context.read<AuthProvider>().clearPendingRegistration();
    if (mounted) context.go('/login');
  }

  @override
  void initState() {
    super.initState();
    _notice = widget.registration.sent
        ? (isPhone
              ? 'Enter the 6-digit code sent to your phone.'
              : widget.registration.requiresApproval
                  ? 'Check your email and open the verification link. A super admin must then approve your account.'
                  : 'Check your email and open the verification link.')
        : 'Your account was created, but the verification message could not be sent. Use resend to try again.';
  }

  @override
  void dispose() {
    _otp.dispose();
    super.dispose();
  }

  Future<void> _verify() async {
    if (_otp.text.length != 6) {
      return setState(() => _error = 'Enter the complete 6-digit code.');
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final authenticated = await context.read<AuthProvider>().verifyPhone(
        widget.registration.verificationId,
        _otp.text,
      );
      if (!mounted) return;
      if (authenticated) {
        context.go('/onboarding');
      } else {
        setState(() {
          _notice = 'Phone verified. Your account is waiting for super-admin approval. You can sign in after it is approved.';
          _otp.clear();
        });
      }
    } catch (reason) {
      if (mounted) setState(() => _error = reason.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _resend() async {
    setState(() {
      _resending = true;
      _error = null;
    });
    try {
      if (isPhone) {
        final sent = await context.read<AuthProvider>().resendPhoneVerification(
          widget.registration.verificationId,
        );
        setState(
          () => _notice = sent
              ? 'A new verification code was sent.'
              : 'The code could not be sent. Try again shortly.',
        );
      } else {
        await context.read<AuthProvider>().resendEmailVerification(
          widget.registration.verificationId,
        );
        setState(() => _notice = 'A new verification email was sent.');
      }
    } catch (reason) {
      if (mounted) setState(() => _error = reason.toString());
    } finally {
      if (mounted) setState(() => _resending = false);
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
          onPressed: _backToLogin,
        ),
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 430),
              child: Column(
                children: [
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      color: kPrimaryGreen.withValues(alpha: .1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Icon(
                      isPhone
                          ? Icons.sms_outlined
                          : Icons.mark_email_read_outlined,
                      color: kPrimaryGreen,
                      size: 30,
                    ),
                  ),
                  const SizedBox(height: 22),
                  const Text(
                    'Verify your account',
                    style: TextStyle(
                      fontSize: 27,
                      fontWeight: FontWeight.w800,
                      color: kDark,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    _notice ?? '',
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: kMuted, height: 1.5),
                  ),
                  if (widget.registration.target.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text(
                      widget.registration.target,
                      style: const TextStyle(
                        color: kPrimaryGreen,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                  const SizedBox(height: 25),
                  if (isPhone) ...[
                    TextField(
                      controller: _otp,
                      keyboardType: TextInputType.number,
                      maxLength: 6,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 25,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 8,
                      ),
                      decoration: const InputDecoration(
                        labelText: '6-digit verification code',
                        counterText: '',
                      ),
                    ),
                    const SizedBox(height: 18),
                    AuthPrimaryButton(
                      loading: _loading,
                      label: 'Verify account',
                      onTap: _verify,
                    ),
                  ] else ...[
                    Container(
                      padding: const EdgeInsets.all(15),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: kCardBorder),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.info_outline, color: kPrimaryGreen),
                          SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              'After opening the verification link, return here and sign in. If approval is enabled, wait for a super admin to approve the account first.',
                              style: TextStyle(
                                color: kMuted,
                                fontSize: 12.5,
                                height: 1.4,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                  if (_error != null) ...[
                    const SizedBox(height: 16),
                    AuthErrorBox(message: _error!),
                  ],
                  const SizedBox(height: 18),
                  TextButton.icon(
                    onPressed: _resending ? null : _resend,
                    icon: _resending
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.refresh_rounded),
                    label: Text(
                      isPhone ? 'Resend code' : 'Resend verification email',
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: _backToLogin,
                    child: const Text('Back to sign in'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
