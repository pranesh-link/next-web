class ApiException implements Exception {
  final String message;
  final int statusCode;

  const ApiException(this.message, this.statusCode);

  @override
  String toString() => 'ApiException($statusCode): $message';
}

class UnauthorizedException extends ApiException {
  const UnauthorizedException(String message) : super(message, 401);
}

class NetworkException extends ApiException {
  const NetworkException(String message) : super(message, 0);
}

class ValidationException extends ApiException {
  final Map<String, String> errors;

  const ValidationException(String message, this.errors) : super(message, 422);
}
