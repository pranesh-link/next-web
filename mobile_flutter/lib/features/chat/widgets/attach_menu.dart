import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/features/chat/providers/chat_providers.dart';

/// Bottom sheet with attachment options: Camera, Gallery, Voice Message.
class AttachMenu extends ConsumerWidget {
  final VoidCallback onVoiceRecord;

  const AttachMenu({super.key, required this.onVoiceRecord});

  Future<void> _pickImage(
    BuildContext context,
    WidgetRef ref,
    ImageSource source,
  ) async {
    Navigator.pop(context);
    final picker = ImagePicker();
    final picked = await picker.pickImage(
      source: source,
      maxWidth: 1920,
      maxHeight: 1920,
      imageQuality: 80,
    );
    if (picked == null) return;
    final file = File(picked.path);
    await ref.read(chatNotifierProvider.notifier).sendImage(file);
    // Surface any upload/send error to the user
    final err = ref.read(chatNotifierProvider.notifier).lastSendError;
    if (err != null && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            err.toString().replaceFirst('Exception: ', '').replaceFirst('ApiException: ', ''),
          ),
          backgroundColor: Colors.red.shade700,
          duration: const Duration(seconds: 4),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _AttachOption(
                  icon: Icons.camera_alt,
                  label: 'Camera',
                  color: context.colors.accent,
                  onTap: () => _pickImage(context, ref, ImageSource.camera),
                ),
                _AttachOption(
                  icon: Icons.photo_library,
                  label: 'Gallery',
                  color: context.colors.success,
                  onTap: () => _pickImage(context, ref, ImageSource.gallery),
                ),
                _AttachOption(
                  icon: Icons.mic,
                  label: 'Voice',
                  color: context.colors.danger,
                  onTap: () {
                    Navigator.pop(context);
                    onVoiceRecord();
                  },
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.lg),
          ],
        ),
      ),
    );
  }
}

class _AttachOption extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _AttachOption({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 28),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: context.colors.textMuted,
            ),
          ),
        ],
      ),
    );
  }
}
