import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/features/chat/providers/wallpaper_provider.dart';

/// Bottom sheet to pick a chat wallpaper color.
class WallpaperPicker extends ConsumerWidget {
  const WallpaperPicker({super.key});

  static const _colors = [
    null, // default
    Color(0xFFECE5DD),
    Color(0xFFE8F5E9),
    Color(0xFFE3F2FD),
    Color(0xFFFCE4EC),
    Color(0xFFFFF3E0),
    Color(0xFFF3E5F5),
    Color(0xFFE0F7FA),
    Color(0xFFFFF9C4),
    Color(0xFFEFEBE9),
    Color(0xFF263238),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final current = ref.watch(wallpaperProvider);

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
            Text(
              'Chat Wallpaper',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: context.colors.text,
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            Wrap(
              spacing: AppSpacing.md,
              runSpacing: AppSpacing.md,
              children: _colors.map((color) {
                final isSelected = color == current;
                final isDefault = color == null;
                return GestureDetector(
                  onTap: () {
                    ref.read(wallpaperProvider.notifier).setColor(color);
                    Navigator.pop(context);
                  },
                  child: Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: color ?? const Color(0xFFECE5DD),
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: isSelected
                            ? context.colors.accent
                            : Colors.grey.shade300,
                        width: isSelected ? 3 : 1,
                      ),
                    ),
                    child: isDefault
                        ? Icon(
                            Icons.format_color_reset,
                            color: context.colors.textMuted,
                            size: 20,
                          )
                        : isSelected
                            ? Icon(
                                Icons.check,
                                color: color.computeLuminance() > 0.5
                                    ? Colors.black
                                    : Colors.white,
                                size: 20,
                              )
                            : null,
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: AppSpacing.lg),
          ],
        ),
      ),
    );
  }
}
