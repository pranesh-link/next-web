import 'dart:convert';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:luvverse/core/auth/web_storage.dart' if (dart.library.io) 'package:luvverse/core/auth/web_storage_stub.dart';
import 'package:luvverse/models/user.dart';

abstract final class SecureStorage {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  static const _tokenKey = 'auth_token';
  static const _userKey = 'auth_user';
  static const _refreshTokenKey = 'auth_refresh_token';

  static Future<void> saveToken(String token) async {
    if (kIsWeb) {
      WebStorage.write(_tokenKey, token);
    } else {
      await _storage.write(key: _tokenKey, value: token);
    }
  }

  static Future<String?> getToken() async {
    if (kIsWeb) return WebStorage.read(_tokenKey);
    return _storage.read(key: _tokenKey);
  }

  static Future<void> saveRefreshToken(String token) async {
    if (kIsWeb) {
      WebStorage.write(_refreshTokenKey, token);
    } else {
      await _storage.write(key: _refreshTokenKey, value: token);
    }
  }

  static Future<String?> getRefreshToken() async {
    if (kIsWeb) return WebStorage.read(_refreshTokenKey);
    return _storage.read(key: _refreshTokenKey);
  }

  static Future<void> saveUser(User user) async {
    final json = jsonEncode(user.toJson());
    if (kIsWeb) {
      WebStorage.write(_userKey, json);
    } else {
      await _storage.write(key: _userKey, value: json);
    }
  }

  static Future<User?> getUser() async {
    final data = kIsWeb ? WebStorage.read(_userKey) : await _storage.read(key: _userKey);
    if (data == null) return null;
    return User.fromJson(jsonDecode(data) as Map<String, dynamic>);
  }

  static Future<void> clearAll() async {
    if (kIsWeb) {
      WebStorage.delete(_tokenKey);
      WebStorage.delete(_userKey);
      WebStorage.delete(_refreshTokenKey);
    } else {
      await _storage.delete(key: _tokenKey);
      await _storage.delete(key: _userKey);
      await _storage.delete(key: _refreshTokenKey);
    }
  }
}
