import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/core/auth/google_sign_in_instance.dart';
import 'package:luvverse/core/auth/secure_storage.dart';
import 'package:luvverse/core/auth/session_expired_provider.dart';
import 'package:luvverse/core/network/api_endpoints.dart';
import 'package:luvverse/core/network/api_exceptions.dart';
import 'package:luvverse/core/notifications/push_providers.dart';

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient(ref);
});

/// Base URL for all API requests.
const kApiBaseUrl = 'https://www.pranesh.link';

class ApiClient {
  static const _baseUrl = kApiBaseUrl;

  late final Dio _dio;
  final Ref _ref;
  bool _isRefreshing = false;
  int _refreshFailCount = 0;
  DateTime? _lastRefreshAttempt;
  final List<({ErrorInterceptorHandler handler, RequestOptions options})>
      _pendingRequests = [];

  ApiClient(this._ref) {
    _dio = Dio(BaseOptions(
      baseUrl: _baseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
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
      onError: (error, handler) async {
        if (error.response?.statusCode != 401) {
          return handler.next(error);
        }

        // Exponential backoff: skip refresh if in cooldown period
        final cooldownMs = _refreshFailCount > 0
            ? (1000 * (1 << (_refreshFailCount - 1).clamp(0, 5)))
            : 0;
        if (_lastRefreshAttempt != null &&
            DateTime.now().difference(_lastRefreshAttempt!).inMilliseconds < cooldownMs) {
          handler.next(error);
          return;
        }
        _lastRefreshAttempt = DateTime.now();

        // If already refreshing, queue this request for retry later
        if (_isRefreshing) {
          _pendingRequests
              .add((handler: handler, options: error.requestOptions));
          return;
        }

        _isRefreshing = true;
        try {
          // Try server-side JWT refresh first (uses stored refresh token)
          var newToken = await _refreshJwtToken();
          // Fall back to Google silent sign-in if no refresh token stored
          newToken ??= await _refreshGoogleToken();
          if (newToken != null) {
            _refreshFailCount = 0;
            await SecureStorage.saveToken(newToken);
            // Re-register FCM token with the new auth token (only if permission granted)
            _ref.read(pushNotificationServiceProvider).hasPermission().then((granted) {
              if (granted) _ref.read(pushNotificationServiceProvider).registerToken();
            });
            // Retry the original request
            final opts = error.requestOptions;
            opts.headers['Authorization'] = 'Bearer $newToken';
            final response = await _dio.fetch(opts);
            handler.resolve(response);
            // Retry all queued requests
            await _retryPendingRequests(newToken);
            return;
          }
        } catch (_) {
          // Refresh failed
        } finally {
          _isRefreshing = false;
        }
        // Refresh failed — clear auth and notify UI to show login prompt
        _refreshFailCount++;
        await SecureStorage.clearAll();
        _ref.read(sessionExpiredProvider.notifier).state = true;
        _rejectPendingRequests(error);
        handler.next(error);
      },
    ));

    if (kDebugMode) {
      _dio.interceptors.add(LogInterceptor(
        requestBody: true,
        responseBody: true,
      ));
    }
  }

  Future<void> _retryPendingRequests(String newToken) async {
    final pending = List.of(_pendingRequests);
    _pendingRequests.clear();
    for (final req in pending) {
      req.options.headers['Authorization'] = 'Bearer $newToken';
      try {
        final response = await _dio.fetch(req.options);
        req.handler.resolve(response);
      } on DioException catch (e) {
        req.handler.reject(e);
      }
    }
  }

  void _rejectPendingRequests(DioException error) {
    final pending = List.of(_pendingRequests);
    _pendingRequests.clear();
    for (final req in pending) {
      req.handler.reject(DioException(
        requestOptions: req.options,
        error: error.error,
        response: error.response,
        type: error.type,
      ));
    }
  }

  /// Refreshes the access token using the server-side JWT refresh endpoint.
  /// Returns the new access token, or null if no refresh token is stored or
  /// the server returns an error.
  Future<String?> _refreshJwtToken() async {
    try {
      final refreshToken = await SecureStorage.getRefreshToken();
      if (refreshToken == null) return null;

      // Use a fresh Dio instance to avoid interceptor loops
      final dio = Dio(BaseOptions(baseUrl: _baseUrl));
      final response = await dio.post<Map<String, dynamic>>(
        ApiEndpoints.refreshToken,
        data: {'refreshToken': refreshToken},
      );
      final body = response.data;
      final newAccessToken = body?['token'] as String?;
      final newRefreshToken = body?['refreshToken'] as String?;
      if (newRefreshToken != null) {
        await SecureStorage.saveRefreshToken(newRefreshToken);
      }
      return newAccessToken;
    } catch (_) {
      return null;
    }
  }

  /// Attempts silent Google re-auth and exchanges for an app JWT.
  /// Used as fallback when no refresh token is available (e.g. first install).
  Future<String?> _refreshGoogleToken() async {
    try {
      var account = await googleSignInInstance
          .signInSilently()
          .timeout(const Duration(seconds: 5));
      if (account == null && kIsWeb) {
        account = await googleSignInInstance
            .signIn()
            .timeout(const Duration(seconds: 10));
      }
      if (account == null) return null;
      final auth = await account.authentication
          .timeout(const Duration(seconds: 5));
      final googleAccessToken = auth.accessToken;
      if (googleAccessToken == null) return null;

      // Exchange Google token for app JWT via the auth endpoint
      final dio = Dio(BaseOptions(baseUrl: _baseUrl));
      final response = await dio.post<Map<String, dynamic>>(
        ApiEndpoints.auth,
        data: {'accessToken': googleAccessToken},
      );
      final body = response.data;
      final newToken = body?['token'] as String?;
      final newRefresh = body?['refreshToken'] as String?;
      if (newRefresh != null) {
        await SecureStorage.saveRefreshToken(newRefresh);
      }
      return newToken;
    } catch (_) {
      return null;
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

  Future<void> delete(String path, {dynamic data}) async {
    try {
      await _dio.delete(path, data: data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<T> patch<T>(String path, {dynamic data, T Function(dynamic)? fromJson}) async {
    try {
      final response = await _dio.patch(path, data: data);
      return fromJson != null ? fromJson(response.data) : response.data as T;
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
