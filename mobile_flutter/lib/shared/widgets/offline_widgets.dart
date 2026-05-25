import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/core/cache/connectivity_service.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_typography.dart';

/// Banner shown at the top when the user is offline.
class OfflineBanner extends ConsumerWidget {
  const OfflineBanner({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final connectivity = ref.watch(connectivityProvider);

    return connectivity.when(
      data: (isOnline) {
        if (isOnline) return const SizedBox.shrink();
        return SafeArea(
          bottom: false,
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 16),
            color: context.colors.warning,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.wifi_off, size: 16, color: Colors.black87),
                const SizedBox(width: 8),
                Text(
                  'You\'re offline — showing cached data',
                  style: AppTypography.xs.copyWith(color: Colors.black87),
                ),
              ],
            ),
          ),
        );
      },
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
    );
  }
}

/// Small text badge showing when data was last cached.
class FreshnessBadge extends StatelessWidget {
  final DateTime? cachedAt;

  const FreshnessBadge({super.key, this.cachedAt});

  @override
  Widget build(BuildContext context) {
    if (cachedAt == null) return const SizedBox.shrink();

    final ago = DateTime.now().difference(cachedAt!);
    final label = _formatDuration(ago);

    return Text(
      'Updated $label ago',
      style: AppTypography.xs.copyWith(color: context.colors.textMuted),
    );
  }

  String _formatDuration(Duration d) {
    if (d.inMinutes < 1) return 'just now';
    if (d.inMinutes < 60) return '${d.inMinutes}m';
    if (d.inHours < 24) return '${d.inHours}h';
    return '${d.inDays}d';
  }
}

/// Pending mutations indicator.
class PendingSyncBadge extends ConsumerWidget {
  const PendingSyncBadge({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final count = ref.watch(pendingSyncCountProvider);
    if (count == 0) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: context.colors.accent.withAlpha(20),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.sync, size: 14, color: context.colors.accent),
          const SizedBox(width: 4),
          Text(
            '$count pending',
            style: AppTypography.xs.copyWith(color: context.colors.accent),
          ),
        ],
      ),
    );
  }
}

/// Provider for pending sync count (used by PendingSyncBadge).
final pendingSyncCountProvider = StateProvider<int>((ref) => 0);
