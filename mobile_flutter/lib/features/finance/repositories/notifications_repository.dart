import 'package:luvverse/core/network/api_client.dart';
import 'package:luvverse/core/network/api_endpoints.dart';
import 'package:luvverse/models/notification_model.dart';

/// Repository for notification operations.
class NotificationsRepository {
  final ApiClient _api;
  NotificationsRepository(this._api);

  Future<NotificationsResponse> getNotifications() async {
    final response =
        await _api.get<Map<String, dynamic>>(ApiEndpoints.notifications);
    return NotificationsResponse.fromJson(
        response['data'] as Map<String, dynamic>);
  }

  Future<int> getUnreadCount() async {
    final response = await _api
        .get<Map<String, dynamic>>('${ApiEndpoints.notifications}/unread-count');
    return response['data'] as int? ?? 0;
  }

  Future<void> markAsRead(String id) async {
    await _api.put<Map<String, dynamic>>(
      '${ApiEndpoints.notifications}/$id/read',
      data: {},
    );
  }

  Future<void> markAllAsRead() async {
    await _api.put<Map<String, dynamic>>(
      '${ApiEndpoints.notifications}/read-all',
      data: {},
    );
  }

  Future<void> archiveNotification(String id) async {
    await _api.put<Map<String, dynamic>>(
      '${ApiEndpoints.notifications}/$id/archive',
      data: {},
    );
  }

  Future<void> unarchiveNotification(String id) async {
    await _api.put<Map<String, dynamic>>(
      '${ApiEndpoints.notifications}/$id/unarchive',
      data: {},
    );
  }

  Future<void> archiveAllRead() async {
    await _api.put<Map<String, dynamic>>(
      '${ApiEndpoints.notifications}/archive-all-read',
      data: {},
    );
  }
}
