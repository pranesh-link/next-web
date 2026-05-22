abstract final class Validators {
  static String? required(String? value, [String field = 'Field']) {
    if (value == null || value.trim().isEmpty) return '$field is required';
    return null;
  }

  static String? positiveNumber(String? value, [String field = 'Amount']) {
    if (value == null || value.isEmpty) return '$field is required';
    final n = double.tryParse(value);
    if (n == null || n <= 0) return '$field must be positive';
    return null;
  }

  static String? maxLength(String? value, int max, [String field = 'Field']) {
    if (value != null && value.length > max) return '$field must be $max characters or less';
    return null;
  }

  static String? monthFormat(String? value) {
    if (value == null || !RegExp(r'^\d{4}-\d{2}$').hasMatch(value)) return 'Must be YYYY-MM format';
    return null;
  }
}
