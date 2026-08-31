import '../models/user.dart';
import 'api_client.dart';

class AuthApi {
  final ApiClient _client;
  AuthApi(this._client);

  Future<Map<String, dynamic>> login(String identifier, String password) async {
    final data = await _client.post('/auth/login', {
      'identifier': identifier,
      'password': password,
    }, auth: false);
    return _extractAuthResponse(data);
  }

  Future<RegistrationResult> register({
    required String name,
    required String password,
    required String verificationMethod,
    required String onboardingIntent,
    required bool termsAccepted,
    required String termsVersion,
    required String privacyVersion,
    String? email,
    String? phone,
  }) async {
    final data = await _client.post('/auth/register', {
      'name': name,
      'email': email,
      'phone': phone,
      'password': password,
      'verificationMethod': verificationMethod,
      'onboardingIntent': onboardingIntent,
      'termsAccepted': termsAccepted,
      'termsVersion': termsVersion,
      'privacyVersion': privacyVersion,
    }, auth: false);
    return RegistrationResult.fromJson(Map<String, dynamic>.from(data as Map));
  }

  Future<Map<String, LegalDocument>> getLegalDocuments() async {
    final data = Map<String, dynamic>.from(
      await _client.get('/public/legal-documents') as Map,
    );
    return {
      'terms': LegalDocument.fromJson(
        Map<String, dynamic>.from(data['terms'] as Map),
      ),
      'privacy': LegalDocument.fromJson(
        Map<String, dynamic>.from(data['privacy'] as Map),
      ),
    };
  }

  Future<Map<String, dynamic>> verifyPhone(
    String verificationId,
    String otp,
  ) async {
    final data = await _client.post('/auth/verify-phone', {
      'verificationId': verificationId,
      'otp': otp,
    }, auth: false);
    return _extractAuthResponse(data);
  }

  Future<bool> resendPhoneVerification(String verificationId) async {
    final data = Map<String, dynamic>.from(
      await _client.post('/auth/resend-phone-verification', {
            'verificationId': verificationId,
          }, auth: false)
          as Map,
    );
    return data['sent'] == true;
  }

  Future<void> resendEmailVerification(String verificationId) async {
    await _client.post('/auth/send-verification-email', {
      'verificationId': verificationId,
    }, auth: false);
  }

  Future<Map<String, dynamic>> validateInvitation(String code) async {
    return Map<String, dynamic>.from(
      await _client.post('/auth/invitations/validate', {
            'code': code,
          }, auth: false)
          as Map,
    );
  }

  Future<void> createWorkspace(String name, String currency) async {
    await _client.post('/business/onboarding', {
      'name': name,
      'currency': currency,
      'country': 'Tanzania',
    });
  }

  Future<void> acceptInvitation(String code) async {
    await _client.post('/invitations/accept', {'code': code});
  }

  Future<User> getMe() async {
    final data = await _client.get('/auth/me');
    if (data is Map<String, dynamic>) {
      // Handle shape: { user: {...} } or just the user object directly
      final userJson = data['user'] ?? data;
      return User.fromJson(userJson as Map<String, dynamic>);
    }
    throw ApiException('Invalid user response');
  }

  Future<void> forgotPassword(String email) async {
    await _client.post('/auth/forgot-password', {'email': email}, auth: false);
  }

  Future<void> logout() async {
    try {
      await _client.post('/auth/logout', {});
    } catch (_) {
      // Ignore logout errors — always clear local token
    }
    await _client.clearToken();
  }

  Map<String, dynamic> _extractAuthResponse(dynamic data) {
    if (data is Map<String, dynamic>) {
      final token = data['token'] as String?;
      final userJson = data['user'] as Map<String, dynamic>?;
      if (token != null && userJson != null) {
        return {'token': token, 'user': User.fromJson(userJson)};
      }
    }
    throw ApiException('Invalid authentication response');
  }
}

class LegalSection {
  final String heading;
  final String body;

  const LegalSection({required this.heading, required this.body});

  factory LegalSection.fromJson(Map<String, dynamic> json) => LegalSection(
    heading: json['heading']?.toString() ?? '',
    body: json['body']?.toString() ?? '',
  );
}

class LegalDocument {
  final String type;
  final String title;
  final String version;
  final String effectiveDate;
  final String summary;
  final List<LegalSection> sections;

  const LegalDocument({
    required this.type,
    required this.title,
    required this.version,
    required this.effectiveDate,
    required this.summary,
    required this.sections,
  });

  factory LegalDocument.fromJson(Map<String, dynamic> json) => LegalDocument(
    type: json['type']?.toString() ?? '',
    title: json['title']?.toString() ?? '',
    version: json['version']?.toString() ?? '',
    effectiveDate: json['effectiveDate']?.toString() ?? '',
    summary: json['summary']?.toString() ?? '',
    sections: json['sections'] is List
        ? (json['sections'] as List)
              .map(
                (section) => LegalSection.fromJson(
                  Map<String, dynamic>.from(section as Map),
                ),
              )
              .toList()
        : const [],
  );
}

class RegistrationResult {
  final String verificationId;
  final String verificationMethod;
  final String onboardingIntent;
  final String target;
  final bool sent;

  const RegistrationResult({
    required this.verificationId,
    required this.verificationMethod,
    required this.onboardingIntent,
    required this.target,
    required this.sent,
  });

  factory RegistrationResult.fromJson(Map<String, dynamic> json) {
    final method = json['verificationMethod']?.toString() ?? 'EMAIL';
    return RegistrationResult(
      verificationId: json['verificationId']?.toString() ?? '',
      verificationMethod: method,
      onboardingIntent: json['onboardingIntent']?.toString() ?? 'CREATE',
      target:
          (method == 'PHONE'
                  ? json['phoneNumberMasked']
                  : json['emailAddressMasked'])
              ?.toString() ??
          '',
      sent: method == 'PHONE'
          ? json['verificationOtpSent'] == true
          : json['verificationEmailSent'] == true,
    );
  }

  Map<String, dynamic> toJson() => {
    'verificationId': verificationId,
    'verificationMethod': verificationMethod,
    'onboardingIntent': onboardingIntent,
    'target': target,
    'sent': sent,
  };

  factory RegistrationResult.fromStoredJson(Map<String, dynamic> json) {
    return RegistrationResult(
      verificationId: json['verificationId']?.toString() ?? '',
      verificationMethod: json['verificationMethod']?.toString() ?? 'EMAIL',
      onboardingIntent: json['onboardingIntent']?.toString() ?? 'CREATE',
      target: json['target']?.toString() ?? '',
      sent: json['sent'] == true,
    );
  }
}
