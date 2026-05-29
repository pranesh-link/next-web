import 'package:flutter/widgets.dart';

/// Mixin that handles memory pressure events from the operating system.
///
/// This mixin monitors system memory pressure warnings and automatically
/// clears caches to free up memory when needed. It should be mixed into
/// the main app widget or a high-level stateful widget.
///
/// **Usage Example:**
/// ```dart
/// class MyApp extends StatefulWidget {
///   @override
///   State<MyApp> createState() => _MyAppState();
/// }
///
/// class _MyAppState extends State<MyApp> with MemoryPressureHandler {
///   @override
///   void initState() {
///     super.initState();
///     initMemoryPressureHandler();
///   }
///
///   @override
///   void dispose() {
///     disposeMemoryPressureHandler();
///     super.dispose();
///   }
///
///   @override
///   Widget build(BuildContext context) {
///     return MaterialApp(
///       home: MyHomePage(),
///     );
///   }
/// }
/// ```
mixin MemoryPressureHandler on State implements WidgetsBindingObserver {
  /// Initializes the memory pressure handler by registering this class
  /// as a WidgetsBinding observer.
  ///
  /// Call this in your State's `initState()` method.
  void initMemoryPressureHandler() {
    WidgetsBinding.instance.addObserver(this);
    debugPrint('[Memory] Memory pressure handler initialized');
  }

  /// Disposes the memory pressure handler by unregistering this class
  /// from WidgetsBinding observers.
  ///
  /// Call this in your State's `dispose()` method.
  void disposeMemoryPressureHandler() {
    WidgetsBinding.instance.removeObserver(this);
    debugPrint('[Memory] Memory pressure handler disposed');
  }

  /// Called when the system is running low on memory.
  ///
  /// This callback is triggered by the operating system when memory
  /// pressure is detected. It automatically clears caches to free up
  /// memory and prevent the app from being terminated.
  @override
  void didHaveMemoryPressure() {
    debugPrint('[Memory] Memory pressure detected, clearing cache');
    _clearCaches();
  }

  /// Clears all cached resources to free up memory.
  ///
  /// This method:
  /// - Clears the Flutter image cache (both cached and live images)
  /// - Logs the number of images cleared
  /// - Handles errors gracefully without throwing exceptions
  void _clearCaches() {
    try {
      final imageCache = PaintingBinding.instance.imageCache;
      
      // Get counts before clearing for logging
      final cachedImageCount = imageCache.currentSize;
      final liveImageCount = imageCache.liveImageCount;
      
      // Clear both cached and live images
      imageCache.clear();
      imageCache.clearLiveImages();
      
      debugPrint(
        '[Memory] Cache cleared: $cachedImageCount cached images, '
        '$liveImageCount live images removed',
      );
    } catch (e) {
      // Silent fail - don't crash the app due to cache clearing issues
      debugPrint('[Memory] Error clearing cache: $e');
    }
  }
}
