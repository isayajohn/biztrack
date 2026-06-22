import 'dart:convert';
import 'dart:async';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../theme/app_theme.dart' show kApiBaseUrl;

class ApiException implements Exception {
  final String message;
  final int? statusCode;

  ApiException(this.message, {this.statusCode});

  @override
  String toString() => message;
}

class ApiClient {
  static const _tokenKey = 'biztrack_token';
  static const _requestTimeout = Duration(seconds: 15);

  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
  }

  Future<void> clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
  }

  Future<Map<String, String>> _headers({bool auth = true}) async {
    final headers = <String, String>{
      HttpHeaders.contentTypeHeader: 'application/json',
      HttpHeaders.acceptHeader: 'application/json',
    };
    if (auth) {
      final token = await getToken();
      if (token != null) {
        headers[HttpHeaders.authorizationHeader] = 'Bearer $token';
      }
    }
    return headers;
  }

  Uri _uri(String path, [Map<String, String>? params]) {
    final uri = Uri.parse('$kApiBaseUrl$path');
    if (params != null && params.isNotEmpty) {
      return uri.replace(queryParameters: params);
    }
    return uri;
  }

  ApiException _connectionException(String detail) {
    return ApiException(
      'Cannot connect to the server ($kApiBaseUrl). '
      'Make sure the Laravel backend is running on port 8000. '
      'Detail: $detail',
    );
  }

  dynamic _parseResponse(http.Response response) {
    if (response.body.isEmpty) {
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return {};
      }
      throw ApiException('Empty response', statusCode: response.statusCode);
    }

    late dynamic body;
    try {
      body = jsonDecode(response.body);
    } catch (_) {
      throw ApiException(
        'Invalid response format',
        statusCode: response.statusCode,
      );
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      // Unwrap nested data: { data: { data: <payload> } } or { data: <payload> }
      if (body is Map) {
        final outer = body['data'];
        if (outer is Map && outer.containsKey('data')) {
          return outer['data'];
        }
        if (outer != null) return outer;
      }
      return body;
    }

    // Error response
    String message = 'Request failed';
    if (body is Map) {
      message =
          body['message'] ??
          body['error'] ??
          (body['errors'] != null
              ? (body['errors'] as Map).values.first is List
                    ? (body['errors'] as Map).values.first[0]
                    : body['errors'].toString()
              : 'Request failed');
    }
    throw ApiException(message.toString(), statusCode: response.statusCode);
  }

  Future<dynamic> get(String path, {Map<String, String>? params}) async {
    try {
      final response = await http
          .get(_uri(path, params), headers: await _headers())
          .timeout(_requestTimeout);
      return _parseResponse(response);
    } on TimeoutException {
      throw _connectionException('request timed out');
    } on SocketException catch (e) {
      throw _connectionException(e.message);
    } on HttpException catch (e) {
      throw _connectionException(e.message);
    }
  }

  Future<dynamic> post(
    String path,
    Map<String, dynamic> body, {
    bool auth = true,
  }) async {
    try {
      final response = await http
          .post(
            _uri(path),
            headers: await _headers(auth: auth),
            body: jsonEncode(body),
          )
          .timeout(_requestTimeout);
      return _parseResponse(response);
    } on TimeoutException {
      throw _connectionException('request timed out');
    } on SocketException catch (e) {
      throw _connectionException(e.message);
    } on HttpException catch (e) {
      throw _connectionException(e.message);
    }
  }

  Future<dynamic> put(String path, Map<String, dynamic> body) async {
    try {
      final response = await http
          .put(_uri(path), headers: await _headers(), body: jsonEncode(body))
          .timeout(_requestTimeout);
      return _parseResponse(response);
    } on TimeoutException {
      throw _connectionException('request timed out');
    } on SocketException catch (e) {
      throw _connectionException(e.message);
    } on HttpException catch (e) {
      throw _connectionException(e.message);
    }
  }

  Future<dynamic> delete(String path) async {
    try {
      final response = await http
          .delete(_uri(path), headers: await _headers())
          .timeout(_requestTimeout);
      return _parseResponse(response);
    } on TimeoutException {
      throw _connectionException('request timed out');
    } on SocketException catch (e) {
      throw _connectionException(e.message);
    } on HttpException catch (e) {
      throw _connectionException(e.message);
    }
  }
}
