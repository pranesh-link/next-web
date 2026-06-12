import 'package:flutter/material.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_spacing.dart';

/// Bottom sheet with attachment options: Camera, Gallery, Voice Message.
class AttachMenu extends StatelessWidget {
  final VoidCallback onVoiceRecord;
  final VoidCallback onCamera;
  final VoidCallback onGallery;

  const AttachMenu({
    super.key,
    required this.onVoiceRecord,
    required this.onCamera,
    required this.onGallery,
  });

  @override
  Widget build(BuildContext context) {
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
                  onTap: () {
                    Navigator.pop(context);
                    onCamera();
                  },
                ),
                _AttachOption(
                  icon: Icons.photo_library,
                  label: 'Gallery',
                  color: context.colors.success,
                  onTap: () {
                    Navigator.pop(context);
                    onGallery();
                  },
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
