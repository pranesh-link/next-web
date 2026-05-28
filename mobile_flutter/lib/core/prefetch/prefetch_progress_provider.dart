import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Represents the current state of prefetch progress.
class PrefetchProgress {
  final int totalItems;
  final int completedItems;
  final String currentItem;

  const PrefetchProgress({
    required this.totalItems,
    required this.completedItems,
    required this.currentItem,
  });

  /// Returns the progress as a value between 0.0 and 1.0.
  double get progress => totalItems > 0 ? completedItems / totalItems : 0.0;

  /// Returns true if all items have been completed.
  bool get isComplete => completedItems >= totalItems && totalItems > 0;

  /// Creates a copy of this progress with the given fields replaced.
  PrefetchProgress copyWith({
    int? totalItems,
    int? completedItems,
    String? currentItem,
  }) {
    return PrefetchProgress(
      totalItems: totalItems ?? this.totalItems,
      completedItems: completedItems ?? this.completedItems,
      currentItem: currentItem ?? this.currentItem,
    );
  }

  /// Initial empty state.
  factory PrefetchProgress.initial() {
    return const PrefetchProgress(
      totalItems: 0,
      completedItems: 0,
      currentItem: '',
    );
  }
}

/// State notifier for managing prefetch progress.
class PrefetchProgressNotifier extends StateNotifier<PrefetchProgress> {
  PrefetchProgressNotifier() : super(PrefetchProgress.initial());

  /// Resets the progress with a new total and completedItems set to 0.
  void reset(int total) {
    state = PrefetchProgress(
      totalItems: total,
      completedItems: 0,
      currentItem: '',
    );
  }

  /// Updates the progress with completed count and current item.
  void updateProgress(int completed, String current) {
    state = state.copyWith(
      completedItems: completed,
      currentItem: current,
    );
  }

  /// Marks the prefetch as fully complete.
  void complete() {
    state = state.copyWith(
      completedItems: state.totalItems,
      currentItem: 'Complete',
    );
  }

  /// Increments the completed items by 1 and updates the current item.
  void incrementItem(String current) {
    state = state.copyWith(
      completedItems: state.completedItems + 1,
      currentItem: current,
    );
  }
}

/// Provider for managing prefetch progress state.
final prefetchProgressProvider =
    StateNotifierProvider<PrefetchProgressNotifier, PrefetchProgress>((ref) {
  return PrefetchProgressNotifier();
});
