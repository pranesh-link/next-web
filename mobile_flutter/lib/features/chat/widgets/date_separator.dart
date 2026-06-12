import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:luvverse/core/theme/app_spacing.dart';

/// iMessage-style date separator — transparent background, all-caps, grey text.
class DateSeparator extends StatelessWidget {
  final DateTime date;

  const DateSeparator({super.key, required this.date});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
        child: Text(
          _formatDate(date).toUpperCase(),
          style: const TextStyle(
            fontSize: 11,
            color: Color(0xFF8E8E93),
            fontWeight: FontWeight.w400,
            letterSpacing: 0.5,
          ),
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final local = date.toLocal();
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));
    final messageDate = DateTime(local.year, local.month, local.day);
    final daysDiff = today.difference(messageDate).inDays;

    if (messageDate == today) return 'Today';
    if (messageDate == yesterday) return 'Yesterday';
    if (daysDiff < 7) return DateFormat('EEEE').format(local); // e.g. WEDNESDAY
    return DateFormat('MMM d, yyyy').format(local);            // e.g. JUN 5, 2025
  }
}
