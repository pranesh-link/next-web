import 'dart:io';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:luvverse/core/network/api_client.dart';
import 'package:luvverse/core/network/api_endpoints.dart';
import 'package:luvverse/core/network/api_exceptions.dart';
import 'package:luvverse/core/notifications/notification_channel.dart';

/// Top-level background message handler (must be top-level function).
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  if (kDebugMode) debugPrint('[Push] Background message: ${message.messageId}');
}

/// Result of registering a device token with the backend.
class TokenRegistrationResult {
  final bool success;
  final String? token;
  final String? message;
  final String? error;

  const TokenRegistrationResult({required this.success, this.token, this.message, this.error});
}

/// Result of sending a test push notification.
class TestPushResult {
  final bool success;
  final int sent;
  final int failed;
  final int deviceCount;
  final String reason;
  final String message;
  final bool rateLimited;

  const TestPushResult({
    required this.success,
    required this.sent,
    required this.failed,
    required this.deviceCount,
    required this.reason,
    required this.message,
    this.rateLimited = false,
  });
}

/// Represents a registered device token.
class DeviceInfo {
  final String id;
  final String platform;
  final bool active;
  final String createdAt;
  final String updatedAt;
  final String tokenPrefix;

  const DeviceInfo({
    required this.id,
    required this.platform,
    required this.active,
    required this.createdAt,
    required this.updatedAt,
    required this.tokenPrefix,
  });

  factory DeviceInfo.fromJson(Map<String, dynamic> json) {
    return DeviceInfo(
      id: json['id'] as String,
      platform: json['platform'] as String,
      active: json['active'] as bool,
      createdAt: json['createdAt'] as String,
      updatedAt: json['updatedAt'] as String,
      tokenPrefix: json['tokenPrefix'] as String,
    );
  }
}

/// Result of fetching registered devices.
class DeviceListResult {
  final bool success;
  final String userId;
  final List<DeviceInfo> devices;
  final int activeCount;
  final int totalCount;
  final String? error;

  const DeviceListResult({
    required this.success,
    required this.userId,
    required this.devices,
    required this.activeCount,
    required this.totalCount,
    this.error,
  });
}

/// Manages FCM token lifecycle, permission requests, and message handling.
class PushNotificationService {
  final ApiClient _apiClient;
  final FlutterLocalNotificationsPlugin _localNotifications;

  /// Set to true when the chat screen is active to suppress foreground
  /// CHAT_MESSAGE notifications.
  static bool isChatActive = false;

  String? _currentToken;

  PushNotificationService(this._apiClient)
      : _localNotifications = FlutterLocalNotificationsPlugin();

  /// Initialize local notifications and FCM handlers.
  Future<void> init() async {
    await _initLocalNotifications();
    _setupForegroundHandler();
    _setupTokenRefreshListener();
    await _setupInitialMessage();
  }

  /// Request notification permission.
  /// Handles iOS APNs prompt and Android 13+ POST_NOTIFICATIONS.
  /// Returns true if the user granted permission.
  Future<bool> requestPermission() async {
    final settings = await FirebaseMessaging.instance.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );
    final fcmGranted = settings.authorizationStatus == AuthorizationStatus.authorized ||
        settings.authorizationStatus == AuthorizationStatus.provisional;

    // Belt-and-braces: explicitly request via flutter_local_notifications on Android.
    // Required for displaying notifications even when FCM permission is granted.
    if (Platform.isAndroid) {
      final androidImpl = _localNotifications
          .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
      await androidImpl?.requestNotificationsPermission();
    }

    return fcmGranted;
  }

  /// Check current permission status without prompting the user.
  Future<bool> hasPermission() async {
    final settings = await FirebaseMessaging.instance.getNotificationSettings();
    return settings.authorizationStatus == AuthorizationStatus.authorized ||
        settings.authorizationStatus == AuthorizationStatus.provisional;
  }

  /// Get FCM token and register with the backend.
  /// Returns detailed result for UI feedback.
  Future<TokenRegistrationResult> registerToken() async {
    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token == null) {
        return const TokenRegistrationResult(
          success: false,
          error: 'FCM token is null. Permission may be denied or Firebase not configured.',
        );
      }

      _currentToken = token;
      final platform = Platform.isIOS ? 'ios' : 'android';

      final response = await _apiClient.post<Map<String, dynamic>>(
        ApiEndpoints.devices,
        data: {'token': token, 'platform': platform},
      );

      final data = response['data'] as Map<String, dynamic>?;
      final message = (data?['message'] as String?) ?? 'Device registered ✓';

      if (kDebugMode) {
        debugPrint('[Push] Token registered: ${token.substring(0, 20)}...');
      }
      return TokenRegistrationResult(success: true, token: token, message: message);
    } catch (e) {
      if (kDebugMode) debugPrint('[Push] Token registration failed: $e');
      return TokenRegistrationResult(success: false, error: e.toString());
    }
  }

  /// Unregister the current token on sign-out.
  Future<void> unregister() async {
    if (_currentToken == null) return;
    try {
      await _apiClient.delete(
        ApiEndpoints.devices,
        data: {'token': _currentToken},
      );
      _currentToken = null;
      if (kDebugMode) debugPrint('[Push] Token unregistered');
    } catch (e) {
      if (kDebugMode) debugPrint('[Push] Token unregister failed: $e');
    }
  }

  /// Send a test notification to this device via backend.
  /// Returns detailed result including device count for UI feedback.
  Future<TestPushResult> sendTestNotification() async {
    try {
      final response = await _apiClient.post<Map<String, dynamic>>(
        ApiEndpoints.notificationsTest,
      );

      final data = response['data'] as Map<String, dynamic>?;
      final sent = (data?['sent'] as num?)?.toInt() ?? 0;
      final failed = (data?['failed'] as num?)?.toInt() ?? 0;
      final deviceCount = (data?['deviceCount'] as num?)?.toInt() ?? 0;
      final reason = (data?['reason'] as String?) ?? 'UNKNOWN';
      final message = (data?['message'] as String?) ?? 'Test notification sent';

      return TestPushResult(
        success: sent > 0,
        sent: sent,
        failed: failed,
        deviceCount: deviceCount,
        reason: reason,
        message: message,
      );
    } catch (e) {
      if (e is ApiException && e.statusCode == 429) {
        return TestPushResult(
          success: false,
          sent: 0,
          failed: 0,
          deviceCount: 0,
          reason: 'RATE_LIMITED',
          message: e.message, // "Rate limited. Try again in Ns."
          rateLimited: true,
        );
      }
      return TestPushResult(
        success: false,
        sent: 0,
        failed: 0,
        deviceCount: 0,
        reason: 'EXCEPTION',
        message: 'Failed: ${e.toString()}',
      );
    }
  }

  /// Fetch the list of registered devices for the authenticated user.
  /// Returns detailed device info for debugging.
  Future<DeviceListResult> listDevices() async {
    try {
      final response = await _apiClient.get<Map<String, dynamic>>(
        ApiEndpoints.devices,
      );

      final data = response['data'] as Map<String, dynamic>?;
      if (data == null) {
        return const DeviceListResult(
          success: false,
          userId: '',
          devices: [],
          activeCount: 0,
          totalCount: 0,
          error: 'No data in response',
        );
      }

      final userId = data['userId'] as String;
      final deviceList = (data['devices'] as List<dynamic>?)
              ?.map((e) => DeviceInfo.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [];
      final activeCount = (data['activeCount'] as num?)?.toInt() ?? 0;
      final totalCount = (data['totalCount'] as num?)?.toInt() ?? 0;

      return DeviceListResult(
        success: true,
        userId: userId,
        devices: deviceList,
        activeCount: activeCount,
        totalCount: totalCount,
      );
    } catch (e) {
      return DeviceListResult(
        success: false,
        userId: '',
        devices: [],
        activeCount: 0,
        totalCount: 0,
        error: e.toString(),
      );
    }
  }

  /// Returns the currently cached FCM token (or null if never registered).
  String? get currentToken => _currentToken;

  Future<void> _initLocalNotifications() async {
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: false,
      requestBadgePermission: false,
      requestSoundPermission: false,
    );

    await _localNotifications.initialize(
      const InitializationSettings(android: androidSettings, iOS: iosSettings),
      onDidReceiveNotificationResponse: _onNotificationTap,
    );

    // Create Android notification channel
    await NotificationChannel.create(_localNotifications);

    // iOS: show notifications even when app is in foreground
    await FirebaseMessaging.instance.setForegroundNotificationPresentationOptions(
      alert: true,
      badge: true,
      sound: true,
    );
  }

  void _setupForegroundHandler() {
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      if (kDebugMode) {
        debugPrint('[Push] Foreground message: ${message.notification?.title}');
      }
      // Suppress local notification when user is already in chat
      final type = message.data['type'] as String?;
      if (type == 'CHAT_MESSAGE' && isChatActive) return;
      _showLocalNotification(message);
    });
  }

  void _setupTokenRefreshListener() {
    FirebaseMessaging.instance.onTokenRefresh.listen((newToken) async {
      if (kDebugMode) debugPrint('[Push] Token refreshed');
      _currentToken = newToken;
      await registerToken();
    });
  }

  Future<void> _setupInitialMessage() async {
    // Handle notification tap that launched the app from terminated state
    final initialMessage = await FirebaseMessaging.instance.getInitialMessage();
    if (initialMessage != null) {
      _pendingInitialMessage = initialMessage;
    }

    // Handle notification tap when app is in background
    FirebaseMessaging.onMessageOpenedApp.listen(_onMessageOpenedApp);
  }

  RemoteMessage? _pendingInitialMessage;

  /// Returns and clears the message that launched the app (if any).
  RemoteMessage? consumeInitialMessage() {
    final msg = _pendingInitialMessage;
    _pendingInitialMessage = null;
    return msg;
  }

  void _showLocalNotification(RemoteMessage message) {
    final notification = message.notification;
    if (notification == null) return;

    final type = message.data['type'] as String?;

    // For chat messages on Android, add quick reply action
    List<AndroidNotificationAction>? actions;
    if (type == 'CHAT_MESSAGE' && Platform.isAndroid) {
      actions = [
        const AndroidNotificationAction(
          'reply_action',
          'Reply',
          inputs: [
            AndroidNotificationActionInput(label: 'Type a reply...'),
          ],
          showsUserInterface: false,
        ),
      ];
    }

    _localNotifications.show(
      message.hashCode,
      notification.title,
      notification.body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          NotificationChannel.id,
          NotificationChannel.name,
          channelDescription: NotificationChannel.description,
          importance: Importance.high,
          priority: Priority.high,
          actions: actions,
        ),
        iOS: const DarwinNotificationDetails(
          presentAlert: true,
          presentBadge: true,
          presentSound: true,
        ),
      ),
      payload: message.data['type'],
    );
  }

  void _onNotificationTap(NotificationResponse response) {
    // Handle quick reply from notification
    if (response.actionId == 'reply_action' && response.input != null) {
      final replyText = response.input!.trim();
      if (replyText.isNotEmpty) {
        _onQuickReplyCallback?.call(replyText);
      }
      return;
    }
    // Handled by the router via the navigation callback
    _tapPayload = response.payload;
    _onTapCallback?.call(response.payload ?? '');
  }

  void _onMessageOpenedApp(RemoteMessage message) {
    final type = message.data['type'] as String?;
    _onTapCallback?.call(type ?? '');
  }

  String? _tapPayload;
  void Function(String type)? _onTapCallback;

  /// Register a callback for when user taps a notification.
  void setOnTapCallback(void Function(String type) callback) {
    _onTapCallback = callback;
    // Fire immediately if there's a pending tap
    if (_tapPayload != null) {
      callback(_tapPayload!);
      _tapPayload = null;
    }
  }

  void Function(String text)? _onQuickReplyCallback;

  /// Register a callback for quick reply from notifications.
  void setOnQuickReplyCallback(void Function(String text) callback) {
    _onQuickReplyCallback = callback;
  }
}
