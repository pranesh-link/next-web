import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/shared/widgets/app_button.dart';

class InviteScreen extends ConsumerWidget {
  final String token;

  const InviteScreen({super.key, required this.token});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: context.colors.bg,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xxxxl),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(color: context.colors.accent.withValues(alpha: 0.1), shape: BoxShape.circle),
                child: Icon(Icons.people, size: 32, color: context.colors.accent),
              ),
              const SizedBox(height: AppSpacing.xxl),
              Text('Couple Invite', style: AppTypography.pageTitle.copyWith(color: context.colors.text)),
              const SizedBox(height: AppSpacing.sm),
              Text('You\'ve been invited to join a couple', style: AppTypography.body.copyWith(color: context.colors.textMuted), textAlign: TextAlign.center),
              const SizedBox(height: AppSpacing.xxxxl),
              AppButton(label: 'Accept Invite', fullWidth: true, onPressed: () {}),
            ],
          ),
        ),
      ),
    );
  }
}
