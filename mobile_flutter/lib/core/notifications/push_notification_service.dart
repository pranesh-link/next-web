import 'dart:io';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:luvverse/core/network/api_client.dart';
import 'package:luvverse/core/network/api_endpoints.dart';
import 'package:luvverse/core/notifications/notification_channel.dart';

/// Top-level background message handler (must be top-level function).
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  if (kDebugMode) debugPrint('[Push] Background message: ${message.messageId}');
}

/// Manages FCM token lifecycle, permission requests, and message handling.
class PushNotificationService {
  final ApiClient _apiClient;
  final FlutterLocalNotificationsPlugin _localNotifications;

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

  /// Request notification permission (iOS always, Android 13+).
  Future<bool> requestPermission() async {
    final settings = await FirebaseMessaging.instance.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );
    return settings.authorizationStatus == AuthorizationStatus.authorized;
  }

  /// Get FCM token and register with the backend.
  Future<void> registerToken() async {
    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token == null) return;

      _currentToken = token;
      final platform = Platform.isIOS ? 'ios' : 'android';

      await _apiClient.post(
        ApiEndpoints.devices,
        data: {'token': token, 'platform': platform},
      );

      if (kDebugMode) debugPrint('[Push] Token registered: ${token.substring(0, 20)}...');
    } catch (e) {
      if (kDebugMode) debugPrint('[Push] Token registration failed: $e');
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
  Future<bool> sendTestNotification() async {
    try {
      await _apiClient.post(ApiEndpoints.notificationsTest);
      return true;
    } catch (_) {
      return false;
    }
  }

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
  }

  void _setupForegroundHandler() {
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      if (kDebugMode) debugPrint('[Push] Foreground message: ${message.notification?.title}');
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
}
