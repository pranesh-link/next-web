import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/core/theme/app_colors.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/shared/widgets/app_button.dart';

class InviteScreen extends ConsumerWidget {
  final String token;

  const InviteScreen({super.key, required this.token});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xxxxl),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(color: AppColors.accent.withValues(alpha: 0.1), shape: BoxShape.circle),
                child: const Icon(Icons.people, size: 32, color: AppColors.accent),
              ),
              const SizedBox(height: AppSpacing.xxl),
              Text('Couple Invite', style: AppTypography.pageTitle.copyWith(color: AppColors.text)),
              const SizedBox(height: AppSpacing.sm),
              Text('You\'ve been invited to join a couple', style: AppTypography.body.copyWith(color: AppColors.textMuted), textAlign: TextAlign.center),
              const SizedBox(height: AppSpacing.xxxxl),
              AppButton(label: 'Accept Invite', fullWidth: true, onPressed: () {}),
            ],
          ),
        ),
      ),
    );
  }
}
