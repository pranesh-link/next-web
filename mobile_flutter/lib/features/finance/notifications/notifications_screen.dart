import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/core/theme/app_colors.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/features/finance/providers/extended_providers.dart';
import 'package:luvverse/models/notification_model.dart';
import 'package:luvverse/shared/widgets/app_card.dart';
import 'package:luvverse/shared/widgets/empty_state.dart';
import 'package:luvverse/shared/widgets/loading_skeleton.dart';
import 'package:luvverse/shared/widgets/offline_error_state.dart';
import 'package:intl/intl.dart';

/// Screen listing all notifications with mark-as-read.
class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifAsync = ref.watch(notificationsProvider);

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: const Text('Notifications'),
        backgroundColor: AppColors.bg,
        elevation: 0,
        titleTextStyle: AppTypography.pageTitle,
        actions: [
          TextButton(
            onPressed: () =>
                ref.read(notificationsProvider.notifier).markAllAsRead(),
            child: Text(
              'Mark all read',
              style: AppTypography.small.copyWith(color: AppColors.accent),
            ),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: notifAsync.when(
          loading: () => const LoadingSkeleton(type: SkeletonType.list),
          error: (e, _) => OfflineErrorState(error: e, onRetry: () => ref.read(notificationsProvider.notifier).refresh()),
          data: (response) => response.notifications.isEmpty
              ? const EmptyState(
                  icon: Icons.notifications_none,
                  title: 'No Notifications',
                  description: 'You\'re all caught up!',
                )
              : RefreshIndicator(
                  onRefresh: () =>
                      ref.read(notificationsProvider.notifier).refresh(),
                  child: ListView.separated(
                    itemCount: response.notifications.length,
                    separatorBuilder: (_, __) =>
                        const SizedBox(height: AppSpacing.sm),
                    itemBuilder: (_, i) => _NotificationCard(
                      notification: response.notifications[i],
                      onMarkRead: () => ref
                          .read(notificationsProvider.notifier)
                          .markAsRead(response.notifications[i].id),
                    ),
                  ),
                ),
        ),
      ),
    );
  }
}

class _NotificationCard extends StatelessWidget {
  final AppNotification notification;
  final VoidCallback onMarkRead;

  const _NotificationCard({
    required this.notification,
    required this.onMarkRead,
  });

  IconData get _icon {
    switch (notification.type) {
      case NotificationType.coupleInvite:
        return Icons.favorite;
      case NotificationType.investmentSipReminder:
        return Icons.trending_up;
      case NotificationType.depositInstallmentReminder:
        return Icons.savings;
      case NotificationType.budgetExceeded:
        return Icons.warning_amber;
      case NotificationType.goalReached:
        return Icons.emoji_events;
      case NotificationType.loanEmiReminder:
        return Icons.payment;
      default:
        return Icons.notifications;
    }
  }

  Color get _iconColor {
    switch (notification.type) {
      case NotificationType.budgetExceeded:
        return AppColors.danger;
      case NotificationType.goalReached:
        return AppColors.success;
      default:
        return AppColors.accent;
    }
  }

  @override
  Widget build(BuildContext context) {
    final dateFmt = DateFormat('dd MMM, h:mm a');

    return AppCard(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: _iconColor.withAlpha(25),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(_icon, color: _iconColor, size: 20),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        notification.title,
                        style: AppTypography.bodyMedium.copyWith(
                          fontWeight: notification.read
                              ? FontWeight.w400
                              : FontWeight.w700,
                        ),
                      ),
                    ),
                    if (!notification.read)
                      Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          color: AppColors.accent,
                          shape: BoxShape.circle,
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  notification.message,
                  style: AppTypography.small.copyWith(
                      color: AppColors.textMuted),
                ),
                const SizedBox(height: 6),
                Text(
                  dateFmt.format(notification.createdAt),
                  style: AppTypography.xs.copyWith(color: AppColors.textDim),
                ),
              ],
            ),
          ),
          if (!notification.read)
            IconButton(
              onPressed: onMarkRead,
              icon: const Icon(Icons.check_circle_outline, size: 20),
              color: AppColors.textMuted,
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
            ),
        ],
      ),
    );
  }
}
