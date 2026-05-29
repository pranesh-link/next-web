import 'package:flutter/material.dart';
import 'package:luvverse/core/theme/app_spacing.dart';

/// Centered badge showing end-to-end encryption status.
class EncryptionBadge extends StatelessWidget {
  const EncryptionBadge({super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: AppSpacing.lg),
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.sm,
        ),
        decoration: BoxDecoration(
          color: const Color(0xFFFFF8E1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.lock_outline,
              size: 14,
              color: Colors.amber.shade700,
            ),
            const SizedBox(width: AppSpacing.xs),
            Text(
              'Messages are end-to-end encrypted',
              style: TextStyle(
                fontSize: 12,
                color: Colors.amber.shade800,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
