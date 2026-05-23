// ignore: avoid_web_libraries_in_flutter
import 'package:web/web.dart' as web;

/// Simple localStorage wrapper for web platform.
abstract final class WebStorage {
  static void write(String key, String value) {
    web.window.localStorage.setItem(key, value);
  }

  static String? read(String key) {
    return web.window.localStorage.getItem(key);
  }

  static void delete(String key) {
    web.window.localStorage.removeItem(key);
  }
}
