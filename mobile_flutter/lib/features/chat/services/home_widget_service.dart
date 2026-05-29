import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:home_widget/home_widget.dart';

const _appGroupId = 'group.link.pranesh.luvverse';
const _androidWidgetName = 'ChatWidgetProvider';
const _iOSWidgetName = 'ChatWidget';

/// Manages the home screen widget data for chat.
class HomeWidgetService {
  /// Update widget data with latest message info.
  Future<void> updateWidget({
    required String partnerName,
    required String lastMessage,
    required DateTime messageTime,
  }) async {
    try {
      await HomeWidget.setAppGroupId(_appGroupId);
      await HomeWidget.saveWidgetData('partner_name', partnerName);
      await HomeWidget.saveWidgetData('last_message', lastMessage);
      await HomeWidget.saveWidgetData(
        'message_time',
        _formatTime(messageTime),
      );
      await HomeWidget.updateWidget(
        androidName: _androidWidgetName,
        iOSName: _iOSWidgetName,
      );
    } catch (e) {
      debugPrint('[HomeWidget] Failed to update: $e');
    }
  }

  /// Clear widget data (e.g., on sign out).
  Future<void> clearWidget() async {
    try {
      await HomeWidget.setAppGroupId(_appGroupId);
      await HomeWidget.saveWidgetData('partner_name', '');
      await HomeWidget.saveWidgetData('last_message', '');
      await HomeWidget.saveWidgetData('message_time', '');
      await HomeWidget.updateWidget(
        androidName: _androidWidgetName,
        iOSName: _iOSWidgetName,
      );
    } catch (e) {
      debugPrint('[HomeWidget] Failed to clear: $e');
    }
  }

  String _formatTime(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${dt.day}/${dt.month}';
  }
}

/// Provider for the home widget service.
final homeWidgetServiceProvider = Provider<HomeWidgetService>((ref) {
  return HomeWidgetService();
});
