import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/core/auth/secure_storage.dart';
import 'package:luvverse/core/network/api_exceptions.dart';

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient();
});

class ApiClient {
  static const _baseUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'https://pranesh.link',
  );

  late final Dio _dio;

  ApiClient() {
    _dio = Dio(BaseOptions(
      baseUrl: _baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      headers: {'Content-Type': 'application/json'},
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await SecureStorage.getToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) {
        if (error.response?.statusCode == 401) {
          SecureStorage.clearAll();
        }
        handler.next(error);
      },
    ));

    if (kDebugMode) {
      _dio.interceptors.add(LogInterceptor(requestBody: true, responseBody: true));
    }
  }

  Future<T> get<T>(String path, {Map<String, dynamic>? queryParameters, T Function(dynamic)? fromJson}) async {
    try {
      final response = await _dio.get(path, queryParameters: queryParameters);
      return fromJson != null ? fromJson(response.data) : response.data as T;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<T> post<T>(String path, {dynamic data, T Function(dynamic)? fromJson}) async {
    try {
      final response = await _dio.post(path, data: data);
      return fromJson != null ? fromJson(response.data) : response.data as T;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<T> put<T>(String path, {dynamic data, T Function(dynamic)? fromJson}) async {
    try {
      final response = await _dio.put(path, data: data);
      return fromJson != null ? fromJson(response.data) : response.data as T;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<void> delete(String path) async {
    try {
      await _dio.delete(path);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  ApiException _handleError(DioException e) {
    if (e.type == DioExceptionType.connectionTimeout || e.type == DioExceptionType.receiveTimeout) {
      return NetworkException('Connection timed out');
    }
    if (e.type == DioExceptionType.connectionError) {
      return NetworkException('No internet connection');
    }
    final statusCode = e.response?.statusCode ?? 0;
    final data = e.response?.data;
    final message = data is Map ? (data['message'] ?? data['error'] ?? 'Request failed') as String : 'Request failed';
    if (statusCode == 401) return UnauthorizedException(message);
    if (statusCode == 422 && data is Map && data['errors'] != null) {
      return ValidationException(message, Map<String, String>.from(data['errors'] as Map));
    }
    return ApiException(message, statusCode);
  }
}
