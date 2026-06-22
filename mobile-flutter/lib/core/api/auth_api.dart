import '../models/user.dart';
import 'api_client.dart';

class AuthApi {
  final ApiClient _client;
  AuthApi(this._client);

  Future<Map<String, dynamic>> login(String email, String password) async {
    final data = await _client.post(
      '/auth/login',
      {'email': email, 'password': password},
      auth: false,
    );
    return _extractAuthResponse(data);
  }

  Future<Map<String, dynamic>> register({
    required String name,
    required String email,
    required String password,
    required String businessName,
    required String currency,
    required String country,
  }) async {
    final data = await _client.post(
      '/auth/register',
      {
        'name': name,
        'email': email,
        'password': password,
        'password_confirmation': password,
        'business_name': businessName,
        'currency': currency,
        'country': country,
      },
      auth: false,
    );
    return _extractAuthResponse(data);
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
