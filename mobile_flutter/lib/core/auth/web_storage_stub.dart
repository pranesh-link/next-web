/// Stub for non-web platforms. Never called at runtime due to kIsWeb check.
abstract final class WebStorage {
  static void write(String key, String value) => throw UnsupportedError('Web only');
  static String? read(String key) => throw UnsupportedError('Web only');
  static void delete(String key) => throw UnsupportedError('Web only');
}
