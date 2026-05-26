import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_slidable/flutter_slidable.dart';
import 'package:go_router/go_router.dart';
import 'package:luvverse/core/notifications/notification_router.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/features/finance/providers/extended_providers.dart';
import 'package:luvverse/models/notification_model.dart';
import 'package:luvverse/shared/widgets/empty_state.dart';
import 'package:luvverse/shared/widgets/loading_skeleton.dart';
import 'package:luvverse/shared/widgets/offline_error_state.dart';
import 'package:intl/intl.dart';

enum NotificationFilter { all, unread }

/// Screen listing all notifications with mark-as-read and archive.
class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  NotificationFilter _filter = NotificationFilter.all;
  String? _toastMessage;

  void _showToast(String message) {
    setState(() => _toastMessage = message);
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) setState(() => _toastMessage = null);
    });
  }

  Future<void> _handleArchive(String id) async {
    HapticFeedback.mediumImpact();
    await ref.read(notificationsProvider.notifier).archiveNotification(id);
    _showToast('Notification archived');
  }

  Future<void> _handleToggleRead(AppNotification notification) async {
    HapticFeedback.lightImpact();
    if (notification.read) {
      await ref.read(notificationsProvider.notifier).markAsUnread(notification.id);
      _showToast('Marked as unread');
    } else {
      await ref.read(notificationsProvider.notifier).markAsRead(notification.id);
      _showToast('Marked as read');
    }
  }

  Future<void> _handleMarkAllRead() async {
    await ref.read(notificationsProvider.notifier).markAllAsRead();
    _showToast('All notifications marked as read');
  }

  Future<void> _handleArchiveAllRead() async {
    await ref.read(notificationsProvider.notifier).archiveAllRead();
    _showToast('All read notifications archived');
  }

  List<AppNotification> _filterNotifications(List<AppNotification> notifications) {
    if (_filter == NotificationFilter.unread) {
      return notifications.where((n) => !n.read).toList();
    }
    return notifications;
  }

  Map<String, List<AppNotification>> _groupByDate(List<AppNotification> notifications) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));
    final weekAgo = today.subtract(const Duration(days: 7));
    final monthAgo = DateTime(now.year, now.month - 1, now.day);

    final groups = <String, List<AppNotification>>{
      'Today': [],
      'Yesterday': [],
      'This Week': [],
      'This Month': [],
      'Older': [],
    };

    for (final notif in notifications) {
      final date = DateTime(notif.createdAt.year, notif.createdAt.month, notif.createdAt.day);
      if (date.isAtSameMomentAs(today)) {
        groups['Today']!.add(notif);
      } else if (date.isAtSameMomentAs(yesterday)) {
        groups['Yesterday']!.add(notif);
      } else if (date.isAfter(weekAgo)) {
        groups['This Week']!.add(notif);
      } else if (date.isAfter(monthAgo)) {
        groups['This Month']!.add(notif);
      } else {
        groups['Older']!.add(notif);
      }
    }

    // Remove empty sections
    groups.removeWhere((_, list) => list.isEmpty);
    return groups;
  }

  @override
  Widget build(BuildContext context) {
    final notifAsync = ref.watch(notificationsProvider);

    return Scaffold(
      backgroundColor: context.colors.bg,
      appBar: AppBar(
        title: const Text('Notifications'),
        backgroundColor: context.colors.bg,
        elevation: 0,
        titleTextStyle: AppTypography.pageTitle,
      ),
      body: Stack(
        children: [
          Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: notifAsync.when(
              loading: () => const LoadingSkeleton(type: SkeletonType.list),
              error: (e, _) => OfflineErrorState(
                error: e,
                onRetry: () => ref.read(notificationsProvider.notifier).refresh(),
              ),
              data: (response) {
                final filtered = _filterNotifications(response.notifications);
                final grouped = _groupByDate(filtered);
                final unreadCount = response.notifications.where((n) => !n.read).length;
                final readCount = response.notifications.where((n) => n.read).length;

                if (response.notifications.isEmpty) {
                  return const EmptyState(
                    icon: Icons.notifications_none,
                    title: 'No Notifications',
                    description: 'You\'re all caught up!',
                  );
                }

                return RefreshIndicator(
                  onRefresh: () => ref.read(notificationsProvider.notifier).refresh(),
                  child: CustomScrollView(
                    slivers: [
                      // Filter toggle and action buttons
                      SliverToBoxAdapter(
                        child: Column(
                          children: [
                            Row(
                              children: [
                                // Filter toggle
                                Container(
                                  decoration: BoxDecoration(
                                    color: context.colors.surface,
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: context.colors.border),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      _FilterButton(
                                        label: 'All',
                                        isActive: _filter == NotificationFilter.all,
                                        onTap: () => setState(() => _filter = NotificationFilter.all),
                                      ),
                                      _FilterButton(
                                        label: 'Unread',
                                        isActive: _filter == NotificationFilter.unread,
                                        onTap: () => setState(() => _filter = NotificationFilter.unread),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: AppSpacing.sm),
                                if (unreadCount > 0)
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 12,
                                      vertical: 6,
                                    ),
                                    decoration: BoxDecoration(
                                      color: context.colors.surface,
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Text(
                                      '$unreadCount unread',
                                      style: AppTypography.xs.copyWith(
                                        fontWeight: FontWeight.w600,
                                        color: context.colors.textMuted,
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                            const SizedBox(height: AppSpacing.md),
                            // Action buttons
                            Row(
                              children: [
                                if (unreadCount > 0)
                                  Expanded(
                                    child: OutlinedButton(
                                      onPressed: _handleMarkAllRead,
                                      style: OutlinedButton.styleFrom(
                                        foregroundColor: context.colors.accent,
                                        side: BorderSide(color: context.colors.accent),
                                      ),
                                      child: const Text('Mark all read'),
                                    ),
                                  ),
                                if (unreadCount > 0 && readCount > 0)
                                  const SizedBox(width: AppSpacing.sm),
                                if (readCount > 0)
                                  Expanded(
                                    child: OutlinedButton(
                                      onPressed: _handleArchiveAllRead,
                                      style: OutlinedButton.styleFrom(
                                        foregroundColor: context.colors.textMuted,
                                        side: BorderSide(color: context.colors.border),
                                      ),
                                      child: const Text('Archive all read'),
                                    ),
                                  ),
                              ],
                            ),
                            const SizedBox(height: AppSpacing.lg),
                          ],
                        ),
                      ),

                      // Empty state for filtered view
                      if (filtered.isEmpty)
                        const SliverFillRemaining(
                          child: Center(
                            child: EmptyState(
                              icon: Icons.check_circle_outline,
                              title: 'No unread notifications',
                              description: 'You\'re all caught up! 🎉',
                            ),
                          ),
                        ),

                      // Grouped notifications
                      ...grouped.entries.map((entry) {
                        return SliverList(
                          delegate: SliverChildListDelegate([
                            _SectionHeader(
                              title: entry.key,
                              count: entry.value.length,
                            ),
                            const SizedBox(height: AppSpacing.sm),
                            ...entry.value.map((notif) {
                              return Padding(
                                padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                                child: _NotificationCard(
                                  notification: notif,
                                  onArchive: () => _handleArchive(notif.id),
                                  onToggleRead: () => _handleToggleRead(notif),
                                  onTap: () {
                                    if (!notif.read) {
                                      ref.read(notificationsProvider.notifier).markAsRead(notif.id);
                                    }
                                    // Navigate to the relevant screen
                                    NotificationRouter.navigate(
                                      GoRouter.of(context),
                                      notif.type,
                                    );
                                  },
                                ),
                              );
                            }),
                            const SizedBox(height: AppSpacing.lg),
                          ]),
                        );
                      }),
                    ],
                  ),
                );
              },
            ),
          ),

          // Toast notification
          if (_toastMessage != null)
            Positioned(
              bottom: 24,
              left: 16,
              right: 16,
              child: _Toast(message: _toastMessage!),
            ),
        ],
      ),
    );
  }
}

class _FilterButton extends StatelessWidget {
  final String label;
  final bool isActive;
  final VoidCallback onTap;

  const _FilterButton({
    required this.label,
    required this.isActive,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isActive ? context.colors.accent : Colors.transparent,
          borderRadius: BorderRadius.circular(6),
        ),
        child: Text(
          label,
          style: AppTypography.small.copyWith(
            fontWeight: FontWeight.w600,
            color: isActive ? Colors.white : context.colors.textMuted,
          ),
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  final int count;

  const _SectionHeader({
    required this.title,
    required this.count,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(color: context.colors.border),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title.toUpperCase(),
            style: AppTypography.xs.copyWith(
              fontWeight: FontWeight.w700,
              color: context.colors.textMuted,
              letterSpacing: 0.5,
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: context.colors.surface,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              count.toString(),
              style: AppTypography.xs.copyWith(
                fontWeight: FontWeight.w600,
                color: context.colors.textMuted,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Toast extends StatelessWidget {
  final String message;

  const _Toast({required this.message});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: BoxDecoration(
        color: context.colors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: context.colors.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(30),
            blurRadius: 32,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        children: [
          const Text('✓', style: TextStyle(fontSize: 20)),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: AppTypography.bodyMedium.copyWith(
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _NotificationCard extends StatelessWidget {
  final AppNotification notification;
  final VoidCallback onArchive;
  final VoidCallback onToggleRead;
  final VoidCallback onTap;

  const _NotificationCard({
    required this.notification,
    required this.onArchive,
    required this.onToggleRead,
    required this.onTap,
  });

  IconData get _icon {
    switch (notification.type) {
      case NotificationType.coupleInvite:
        return Icons.favorite;
      case NotificationType.incomeReminder:
        return Icons.attach_money;
      case NotificationType.budgetAlert:
      case NotificationType.pushBudgetAlert:
        return Icons.warning_amber;
      case NotificationType.sipReminder:
      case NotificationType.pushSipReminder:
      case NotificationType.investmentSipReminder:
        return Icons.trending_up;
      case NotificationType.depositReminder:
      case NotificationType.pushDepositReminder:
      case NotificationType.depositInstallmentReminder:
      case NotificationType.depositMaturityReminder:
        return Icons.savings;
      case NotificationType.budgetExceeded:
        return Icons.warning_amber;
      case NotificationType.goalReached:
        return Icons.emoji_events;
      case NotificationType.loanEmiReminder:
      case NotificationType.pushLoanReminder:
        return Icons.payment;
      case NotificationType.pushGoalReminder:
        return Icons.stars;
      case NotificationType.pushTransactionAlert:
        return Icons.receipt_long;
      case NotificationType.pushAccountSync:
        return Icons.sync;
      default:
        return Icons.notifications;
    }
  }

  Color _iconColor(BuildContext context) {
    switch (notification.type) {
      case NotificationType.budgetExceeded:
      case NotificationType.budgetAlert:
      case NotificationType.pushBudgetAlert:
        return context.colors.danger;
      case NotificationType.goalReached:
        return context.colors.success;
      default:
        return context.colors.accent;
    }
  }

  @override
  Widget build(BuildContext context) {
    final dateFmt = DateFormat('dd MMM, h:mm a');
    final iconColor = _iconColor(context);
    final isUnread = !notification.read;

    return Slidable(
      key: ValueKey(notification.id),
      endActionPane: ActionPane(
        motion: const DrawerMotion(),
        extentRatio: 0.25,
        children: [
          SlidableAction(
            onPressed: (_) => onArchive(),
            backgroundColor: Colors.red.shade400,
            foregroundColor: Colors.white,
            icon: Icons.archive,
            label: 'Archive',
            borderRadius: BorderRadius.circular(12),
          ),
        ],
      ),
      startActionPane: ActionPane(
        motion: const DrawerMotion(),
        extentRatio: 0.25,
        children: [
          SlidableAction(
            onPressed: (_) => onToggleRead(),
            backgroundColor: isUnread ? Colors.blue.shade400 : Colors.orange.shade400,
            foregroundColor: Colors.white,
            icon: isUnread ? Icons.mark_email_read : Icons.mark_email_unread,
            label: isUnread ? 'Mark Read' : 'Unread',
            borderRadius: BorderRadius.circular(12),
          ),
        ],
      ),
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          decoration: BoxDecoration(
            gradient: isUnread
                ? LinearGradient(
                    begin: Alignment.centerLeft,
                    end: Alignment.centerRight,
                    colors: [
                      context.colors.accent.withAlpha(10),
                      context.colors.bgElevated,
                    ],
                  )
                : null,
            color: isUnread ? null : context.colors.bg,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isUnread ? context.colors.accent : context.colors.border,
              width: 1,
            ),
          ),
          child: Stack(
            children: [
              // Left accent border for unread
              if (isUnread)
                Positioned(
                  left: 0,
                  top: 0,
                  bottom: 0,
                  child: Container(
                    width: 6,
                    decoration: BoxDecoration(
                      color: context.colors.accent,
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(12),
                        bottomLeft: Radius.circular(12),
                      ),
                    ),
                  ),
                ),
              
              // Card content
              Padding(
                padding: EdgeInsets.only(
                  left: isUnread ? 18 : 20,
                  right: 20,
                  top: 16,
                  bottom: 16,
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Icon
                    Container(
                      width: 48,
                      height: 48,
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: iconColor.withAlpha(25),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Icon(_icon, color: iconColor, size: 24),
                    ),
                    const SizedBox(width: AppSpacing.md),
                    
                    // Content
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
                                    fontWeight: isUnread ? FontWeight.w700 : FontWeight.w400,
                                    color: isUnread ? context.colors.text : context.colors.textMuted,
                                    fontSize: 15,
                                  ),
                                ),
                              ),
                              if (isUnread) ...[
                                const SizedBox(width: 8),
                                Container(
                                  width: 12,
                                  height: 12,
                                  decoration: BoxDecoration(
                                    color: context.colors.accent,
                                    shape: BoxShape.circle,
                                    boxShadow: [
                                      BoxShadow(
                                        color: context.colors.accent.withAlpha(40),
                                        blurRadius: 8,
                                        spreadRadius: 2,
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(
                            notification.message,
                            style: AppTypography.small.copyWith(
                              color: isUnread ? context.colors.textMuted : context.colors.textDim,
                              fontSize: 13,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            dateFmt.format(notification.createdAt),
                            style: AppTypography.xs.copyWith(
                              color: context.colors.textDim,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
