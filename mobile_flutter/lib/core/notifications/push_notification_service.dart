import 'dart:async';
import 'dart:io';

import 'package:device_info_plus/device_info_plus.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:luvverse/core/network/api_client.dart';
import 'package:luvverse/core/network/api_endpoints.dart';
import 'package:luvverse/core/network/api_exceptions.dart';
import 'package:luvverse/core/notifications/notification_channel.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Top-level background message handler (must be top-level function).
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  if (kDebugMode) debugPrint('[Push] Background message: ${message.messageId}');
  final type = message.data['type'] as String?;
  final prefs = await SharedPreferences.getInstance();
  if (type == 'COUPLE_FORMED') {
    await prefs.setBool('pendingE2EBootstrap', true);
  } else if (type == 'FCM_TOKEN_REFRESH') {
    // Server detected our token was rejected by FCM. We cannot call
    // refreshAndRegisterToken() here (no Riverpod in isolate), so flag it.
    // connectivity_wrapper checks this flag on next resume and forces a
    // refreshAndRegisterToken() regardless of the 7-day throttle.
    await prefs.setBool('pendingFcmTokenRefresh', true);
    if (kDebugMode) debugPrint('[Push] Background FCM_TOKEN_REFRESH flagged for next resume');
  }
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

  void Function()? _onChatMessageReceived;
  void Function(List<String>)? _onMessageDelivered;
  void Function()? _onCoupleFormed;

  /// Register a callback for when a chat message push arrives (used to refresh chat data).
  void setOnChatMessageCallback(void Function() callback) {
    _onChatMessageReceived = callback;
  }

  /// Register a callback for delivery receipts (double-tick).
  void setOnMessageDeliveredCallback(void Function(List<String>) callback) {
    _onMessageDelivered = callback;
  }

  /// Register a callback for when COUPLE_FORMED push arrives (partner accepted invite).
  void setOnCoupleFormedCallback(void Function() callback) {
    _onCoupleFormed = callback;
  }

  PushNotificationService(this._apiClient)
      : _localNotifications = FlutterLocalNotificationsPlugin();

  /// Initialize local notifications and FCM handlers.
  Future<void> init() async {
    await _ensureFirebaseInitialized();
    await _initLocalNotifications();
    _setupForegroundHandler();
    _setupTokenRefreshListener();
    await _setupInitialMessage();
  }

  /// Request notification permission.
  /// Handles iOS APNs prompt and Android 13+ POST_NOTIFICATIONS.
  /// Returns true if the user granted permission.
  Future<bool> requestPermission() async {
    await _ensureFirebaseInitialized();
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
    await _ensureFirebaseInitialized();
    final settings = await FirebaseMessaging.instance.getNotificationSettings();
    return settings.authorizationStatus == AuthorizationStatus.authorized ||
        settings.authorizationStatus == AuthorizationStatus.provisional;
  }

  /// Returns true if the user has never been asked for push permission
  /// (i.e. status is notDetermined — first install or after a settings reset).
  Future<bool> isPermissionNotDetermined() async {
    await _ensureFirebaseInitialized();
    final settings = await FirebaseMessaging.instance.getNotificationSettings();
    return settings.authorizationStatus == AuthorizationStatus.notDetermined;
  }

  /// Ensure Firebase is initialized before using FCM.
  /// Safe to call multiple times — a no-op when already initialized.
  Future<void> _ensureFirebaseInitialized() async {
    if (Firebase.apps.isEmpty) {
      try {
        await Firebase.initializeApp();
      } catch (e) {
        if (kDebugMode) debugPrint('[Push] Firebase.initializeApp failed (non-fatal): $e');
      }
    }
  }

  /// Force-refresh the FCM token then register with the backend.
  ///
  /// Use this before sending a test notification or after reinstall to ensure
  /// the token is fresh. Calls [FirebaseMessaging.deleteToken] to invalidate
  /// the cached token, then immediately requests a new one.
  Future<TokenRegistrationResult> refreshAndRegisterToken() async {
    await _ensureFirebaseInitialized();
    try {
      await FirebaseMessaging.instance.deleteToken();
    } catch (e) {
      // deleteToken() can throw on some devices/simulators — not fatal.
      if (kDebugMode) debugPrint('[Push] deleteToken failed (non-fatal): $e');
    }
    return registerToken();
  }

  /// Get FCM token and register with the backend.
  /// Returns detailed result for UI feedback.
  Future<TokenRegistrationResult> registerToken() async {
    await _ensureFirebaseInitialized();
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

      // Build aggregated device info string: "Model | OS Version | App Version | Locale | Timezone"
      String deviceInfo;
      try {
        final deviceInfoPlugin = DeviceInfoPlugin();
        final packageInfo = await PackageInfo.fromPlatform();
        final locale = Platform.localeName;
        final timezone = DateTime.now().timeZoneName;
        String model, osVersion;
        if (Platform.isAndroid) {
          final android = await deviceInfoPlugin.androidInfo;
          model = android.model;
          osVersion = 'Android ${android.version.release}';
        } else {
          final ios = await deviceInfoPlugin.iosInfo;
          model = ios.model;
          osVersion = 'iOS ${ios.systemVersion}';
        }
        deviceInfo = '$model | $osVersion | ${packageInfo.version} | $locale | $timezone';
      } catch (_) {
        deviceInfo = '$platform | unknown';
      }

      final response = await _apiClient.post<Map<String, dynamic>>(
        ApiEndpoints.devices,
        data: {'token': token, 'platform': platform, 'deviceInfo': deviceInfo},
      );

      final data = response['data'] as Map<String, dynamic>?;
      final message = (data?['message'] as String?) ?? 'Device registered ✓';

      if (kDebugMode) {
        debugPrint('[Push] Token registered: ${token.substring(0, 20)}...');
        debugPrint('[Push] Device info: $deviceInfo');
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
      final type = message.data['type'] as String?;

      // Silent delivery receipt — update local DB, no notification
      if (type == 'MESSAGE_DELIVERED') {
        final ids = (message.data['messageIds'] as String?)?.split(',') ?? [];
        if (ids.isNotEmpty) _onMessageDelivered?.call(ids);
        return;
      }

      // Partner accepted invite — trigger couple state refresh
      if (type == 'FCM_TOKEN_REFRESH') {
        // Server deactivated our token after FCM rejection.
        // Force a fresh token so the next push succeeds without sign-out/in.
        debugPrint('[Push] Server requested token refresh');
        refreshAndRegisterToken().ignore();
        return;
      }
      if (type == 'COUPLE_FORMED') {
        _onCoupleFormed?.call();
        return;
      }

      // Suppress local notification when user is already in chat
      if (type == 'CHAT_MESSAGE' && isChatActive) return;
      // Notify chat to refresh when push arrives (if not already viewing chat)
      if (type == 'CHAT_MESSAGE') {
        _onChatMessageReceived?.call();
      }
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
