import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/core/network/api_client.dart';
import 'package:luvverse/core/notifications/push_notification_service.dart';

/// Provides the singleton PushNotificationService instance.
final pushNotificationServiceProvider = Provider<PushNotificationService>((ref) {
  final apiClient = ref.read(apiClientProvider);
  return PushNotificationService(apiClient);
});
