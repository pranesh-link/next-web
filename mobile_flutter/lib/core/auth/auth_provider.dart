import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:luvverse/core/auth/auth_repository.dart';
import 'package:luvverse/core/auth/secure_storage.dart';
import 'package:luvverse/core/cache/cache_providers.dart';
import 'package:luvverse/core/cache/cache_warmer.dart';
import 'package:luvverse/core/network/api_client.dart';
import 'package:luvverse/core/notifications/push_providers.dart';
import 'package:luvverse/features/chat/cache/chat_cache.dart';
import 'package:luvverse/features/chat/cache/chat_db_providers.dart';
import 'package:luvverse/features/chat/providers/chat_providers.dart';
import 'package:luvverse/features/chat/services/chat_key_bootstrap.dart';
import 'package:luvverse/models/user.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(
    ref.read(apiClientProvider),
    ref.read(cacheServiceProvider),
  );
});

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.read(authRepositoryProvider), ref);
});

class AuthState {
  final User? user;
  final String? token;
  final bool isLoading;
  final bool isSigningOut;
  final String? error;

  const AuthState({
    this.user,
    this.token,
    this.isLoading = false,
    this.isSigningOut = false,
    this.error,
  });

  bool get isAuthenticated => user != null && token != null;

  AuthState copyWith({
    User? user,
    String? token,
    bool? isLoading,
    bool? isSigningOut,
    String? error,
  }) {
    return AuthState(
      user: user ?? this.user,
      token: token ?? this.token,
      isLoading: isLoading ?? this.isLoading,
      isSigningOut: isSigningOut ?? this.isSigningOut,
      error: error,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthRepository _repository;
  final Ref _ref;

  AuthNotifier(this._repository, this._ref)
    : super(const AuthState(isLoading: true)) {
    _checkStoredAuth();
  }

  Future<void> _checkStoredAuth() async {
    try {
      final credentials = await _repository.getStoredCredentials();
      state = AuthState(user: credentials.user, token: credentials.token);
      // Warm cache in the background after restoring session
      if (state.isAuthenticated) {
        // Ensure we have a refresh token — migrate legacy Google-token users
        _ensureRefreshToken();
        _warmCache();
        _initPush();
        _prefetchChat();
        _ensureE2EKeysUploaded();
      }
    } catch (_) {
      state = const AuthState();
    }
  }

  /// If no refresh token is stored, exchange the current token for a proper
  /// JWT + refresh token pair via the mobile auth endpoint.
  /// Uses a fresh Dio instance to avoid interceptor loops.
  void _ensureRefreshToken() {
    SecureStorage.getRefreshToken().then((rt) async {
      if (rt != null) return; // Already has refresh token
      try {
        final token = await SecureStorage.getToken();
        if (token == null) return;
        // Use a fresh Dio instance to bypass auth interceptor — the stored
        // token may be expired and we don't want a 401 retry loop.
        final dio = Dio(BaseOptions(baseUrl: kApiBaseUrl));
        final response = await dio.post<Map<String, dynamic>>(
          '/api/v1/auth/mobile',
          data: {'accessToken': token},
        );
        final body = response.data;
        final newToken = body?['token'] as String?;
        final newRefresh = body?['refreshToken'] as String?;
        if (newToken != null) await SecureStorage.saveToken(newToken);
        if (newRefresh != null)
          await SecureStorage.saveRefreshToken(newRefresh);
      } catch (_) {
        // Non-critical — will retry on next sign-in
      }
    });
  }

  Future<void> signIn() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final user = await _repository.signInWithGoogle();
      final token = await SecureStorage.getToken();
      state = AuthState(user: user, token: token);
      // Eagerly populate cache so offline mode works immediately.
      _warmCache();
      _initPush();
      // Prefetch chat messages in background for instant loading
      _prefetchChat();
      // Bootstrap E2E keys so encryption is ready before first chat open.
      _ensureE2EKeysUploaded();
    } catch (e) {
      final message = e.toString().replaceFirst('Exception: ', '');
      state = state.copyWith(isLoading: false, error: message);
    }
  }

  void _warmCache() {
    // Fire-and-forget — don't block auth flow.
    CacheWarmer.warmAll(_ref);
  }

  void _initPush() {
    // Fire-and-forget — register FCM token after sign-in.
    final pushService = _ref.read(pushNotificationServiceProvider);
    pushService.init().then((_) async {
      await pushService.requestPermission();
      await pushService.registerToken();
    });
  }

  void _prefetchChat() {
    // Fire-and-forget — fetch chat messages after sign-in for instant loading.
    Future.microtask(() {
      try {
        _ref.read(chatNotifierProvider.notifier).prefetch();
      } catch (_) {
        // Provider may not be initialized yet — safe to ignore.
      }
    });
  }

  /// Eagerly bootstrap E2E encryption keys. Runs after sign-in / app start so
  /// the chat screen opens with encryption already ready in the common case.
  /// Fire-and-forget; failures are logged and retried on next call.
  void _ensureE2EKeysUploaded() {
    Future(() async {
      try {
        final ok = await _ref
            .read(chatKeyBootstrapProvider)
            .ensureBootstrapped();
        debugPrint('[Auth] E2E keys bootstrap: $ok');
      } catch (e) {
        debugPrint('[Auth] E2E keys bootstrap failed: $e');
      }
    });
  }

  Future<void> signOut() async {
    state = state.copyWith(isSigningOut: true);
    // Clear chat local DB
    try {
      final chatDb = _ref.read(chatLocalDatabaseProvider);
      await chatDb.deleteAllMessages();
      await ChatCache.clear();
    } catch (_) {}
    // Unregister push token before clearing auth
    try {
      final pushService = _ref.read(pushNotificationServiceProvider);
      await pushService.unregister();
    } catch (_) {}
    await _repository.signOut();
    // Clear biometric preference to prevent stale unlock for different account
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('biometric_enabled');
    } catch (_) {}
    state = const AuthState();
  }
}
