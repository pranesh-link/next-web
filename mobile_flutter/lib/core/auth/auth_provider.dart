import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/core/auth/auth_repository.dart';
import 'package:luvverse/core/auth/secure_storage.dart';
import 'package:luvverse/core/cache/cache_providers.dart';
import 'package:luvverse/core/network/api_client.dart';
import 'package:luvverse/models/user.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(ref.read(apiClientProvider), ref.read(cacheServiceProvider));
});

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.read(authRepositoryProvider));
});

class AuthState {
  final User? user;
  final String? token;
  final bool isLoading;
  final String? error;

  const AuthState({this.user, this.token, this.isLoading = false, this.error});

  bool get isAuthenticated => user != null && token != null;

  AuthState copyWith({User? user, String? token, bool? isLoading, String? error}) {
    return AuthState(
      user: user ?? this.user,
      token: token ?? this.token,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthRepository _repository;

  AuthNotifier(this._repository) : super(const AuthState(isLoading: true)) {
    _checkStoredAuth();
  }

  Future<void> _checkStoredAuth() async {
    try {
      final credentials = await _repository.getStoredCredentials();
      state = AuthState(user: credentials.user, token: credentials.token);
    } catch (_) {
      state = const AuthState();
    }
  }

  Future<void> signIn() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final user = await _repository.signInWithGoogle();
      final token = await SecureStorage.getToken();
      state = AuthState(user: user, token: token);
    } catch (e) {
      final message = e.toString().replaceFirst('Exception: ', '');
      state = state.copyWith(isLoading: false, error: message);
    }
  }

  Future<void> signOut() async {
    await _repository.signOut();
    state = const AuthState();
  }
}
