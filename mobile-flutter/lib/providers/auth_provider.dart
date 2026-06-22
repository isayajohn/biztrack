import 'package:flutter/foundation.dart';
import '../core/api/api_client.dart';
import '../core/api/auth_api.dart';
import '../core/models/user.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

class AuthProvider extends ChangeNotifier {
  final ApiClient _apiClient;
  final AuthApi _authApi;

  AuthStatus _status = AuthStatus.unknown;
  User? _user;
  String? _token;

  AuthProvider(this._apiClient) : _authApi = AuthApi(_apiClient);

  AuthStatus get status => _status;
  User? get user => _user;
  String? get token => _token;
  bool get isAuthenticated => _status == AuthStatus.authenticated;

  Future<void> checkAuth() async {
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

  Future<void> login(String email, String password) async {
    final result = await _authApi.login(email, password);
    _token = result['token'] as String;
    _user = result['user'] as User;
    await _apiClient.saveToken(_token!);
    _status = AuthStatus.authenticated;
    notifyListeners();
  }

  Future<void> register({
    required String name,
    required String email,
    required String password,
    required String businessName,
    required String currency,
    required String country,
  }) async {
    final result = await _authApi.register(
      name: name,
      email: email,
      password: password,
      businessName: businessName,
      currency: currency,
      country: country,
    );
    _token = result['token'] as String;
    _user = result['user'] as User;
    await _apiClient.saveToken(_token!);
    _status = AuthStatus.authenticated;
    notifyListeners();
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
