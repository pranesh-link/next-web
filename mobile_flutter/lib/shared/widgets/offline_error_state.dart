import 'package:flutter/material.dart';
import 'package:luvverse/core/network/api_exceptions.dart';
import 'package:luvverse/core/theme/app_colors.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';

/// Displays a friendly offline/error state instead of raw exception text.
///
/// Use in `.when(error:)` blocks across finance screens.
class OfflineErrorState extends StatelessWidget {
  final Object error;
  final VoidCallback? onRetry;

  const OfflineErrorState({super.key, required this.error, this.onRetry});

  @override
  Widget build(BuildContext context) {
    final isOffline = error is NetworkException;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xxl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              isOffline ? Icons.wifi_off_rounded : Icons.error_outline_rounded,
              size: 48,
              color: isOffline ? AppColors.textMuted : AppColors.danger,
            ),
            const SizedBox(height: AppSpacing.lg),
            Text(
              isOffline
                  ? 'You\'re offline'
                  : 'Something went wrong',
              style: AppTypography.cardTitle,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              isOffline
                  ? 'Data will appear when you reconnect.'
                  : _userFriendlyMessage(error),
              style: AppTypography.small.copyWith(color: AppColors.textMuted),
              textAlign: TextAlign.center,
            ),
            if (onRetry != null) ...[
              const SizedBox(height: AppSpacing.xl),
              TextButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh, size: 18),
                label: const Text('Retry'),
              ),
            ],
          ],
        ),
      ),
    );
  }

  String _userFriendlyMessage(Object error) {
    if (error is ApiException) return error.message;
    final msg = error.toString();
    // Strip type prefix noise from display
    if (msg.startsWith('NetworkException')) {
      return 'No internet connection.';
    }
    if (msg.length > 80) return '${msg.substring(0, 80)}…';
    return msg;
  }
}
