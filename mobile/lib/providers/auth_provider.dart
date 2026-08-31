import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/api/api_client.dart';
import '../core/api/auth_api.dart';
import '../core/models/user.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

class AuthProvider extends ChangeNotifier {
  static const _pendingRegistrationKey = 'biztrack_pending_registration';
  final ApiClient _apiClient;
  final AuthApi _authApi;

  AuthStatus _status = AuthStatus.unknown;
  User? _user;
  String? _token;
  RegistrationResult? _pendingRegistration;

  AuthProvider(this._apiClient) : _authApi = AuthApi(_apiClient);

  AuthStatus get status => _status;
  User? get user => _user;
  String? get token => _token;
  bool get isAuthenticated => _status == AuthStatus.authenticated;
  RegistrationResult? get pendingRegistration => _pendingRegistration;

  Future<void> checkAuth() async {
    final prefs = await SharedPreferences.getInstance();
    final storedRegistration = prefs.getString(_pendingRegistrationKey);
    if (storedRegistration != null) {
      try {
        _pendingRegistration = RegistrationResult.fromStoredJson(
          Map<String, dynamic>.from(jsonDecode(storedRegistration) as Map),
        );
      } catch (_) {
        await prefs.remove(_pendingRegistrationKey);
      }
    }
    final token = await _apiClient.getToken();
    if (token == null || token.isEmpty) {
      _status = AuthStatus.unauthenticated;
      notifyListeners();
      return;
    }
    _token = token;
    try {
      _user = await _authApi.getMe();
      _status = AuthStatus.authenticated;
    } catch (_) {
      await _apiClient.clearToken();
      _token = null;
      _status = AuthStatus.unauthenticated;
    }
    notifyListeners();
  }

  Future<void> login(String identifier, String password) async {
    final baseUrl = await _apiClient.getBaseUrl();
    if (!await _apiClient.healthCheck()) {
      throw ApiException(
        'BizTrack server at $baseUrl is unreachable. '
        'Confirm the phone is on the same network as the API and try again.',
      );
    }
    final result = await _authApi.login(identifier, password);
    _token = result['token'] as String;
    _user = result['user'] as User;
    await _apiClient.saveToken(_token!);
    await clearPendingRegistration(notify: false);
    _status = AuthStatus.authenticated;
    notifyListeners();
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
    final result = await _authApi.register(
      name: name,
      email: email,
      phone: phone,
      password: password,
      verificationMethod: verificationMethod,
      onboardingIntent: onboardingIntent,
      termsAccepted: termsAccepted,
      termsVersion: termsVersion,
      privacyVersion: privacyVersion,
    );
    _pendingRegistration = result;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_pendingRegistrationKey, jsonEncode(result.toJson()));
    notifyListeners();
    return result;
  }

  Future<void> verifyPhone(String verificationId, String otp) async {
    final result = await _authApi.verifyPhone(verificationId, otp);
    _token = result['token'] as String;
    _user = result['user'] as User;
    await _apiClient.saveToken(_token!);
    await clearPendingRegistration(notify: false);
    _status = AuthStatus.authenticated;
    notifyListeners();
  }

  Future<bool> resendPhoneVerification(String verificationId) =>
      _authApi.resendPhoneVerification(verificationId);
  Future<void> resendEmailVerification(String verificationId) =>
      _authApi.resendEmailVerification(verificationId);
  Future<Map<String, dynamic>> validateInvitation(String code) =>
      _authApi.validateInvitation(code);
  Future<Map<String, LegalDocument>> getLegalDocuments() =>
      _authApi.getLegalDocuments();

  Future<void> createWorkspace(String name, String currency) async {
    await _authApi.createWorkspace(name, currency);
    _user = await _authApi.getMe();
    notifyListeners();
  }

  Future<void> acceptInvitation(String code) async {
    await _authApi.acceptInvitation(code);
    _user = await _authApi.getMe();
    notifyListeners();
  }

  Future<void> clearPendingRegistration({bool notify = true}) async {
    _pendingRegistration = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_pendingRegistrationKey);
    if (notify) notifyListeners();
  }

  Future<void> logout() async {
    await _authApi.logout();
    _token = null;
    _user = null;
    _status = AuthStatus.unauthenticated;
    notifyListeners();
  }

  Future<void> forgotPassword(String email) async {
    await _authApi.forgotPassword(email);
  }
}
