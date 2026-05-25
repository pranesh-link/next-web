import 'package:flutter/material.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_spacing.dart';

enum ModalSize { sm, md, lg, full }

class AppModal {
  static Future<T?> show<T>({
    required BuildContext context,
    required String title,
    required Widget child,
    ModalSize size = ModalSize.md,
    List<Widget>? actions,
  }) {
    final height = switch (size) {
      ModalSize.sm => 0.4,
      ModalSize.md => 0.6,
      ModalSize.lg => 0.8,
      ModalSize.full => 0.95,
    };

    return showModalBottomSheet<T>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * height,
        decoration: BoxDecoration(
          color: context.colors.bgElevated,
          borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
        ),
        child: Column(
          children: [
            const SizedBox(height: AppSpacing.md),
            Container(width: 40, height: 4, decoration: BoxDecoration(color: context.colors.borderStrong, borderRadius: BorderRadius.circular(2))),
            Padding(
              padding: const EdgeInsets.fromLTRB(AppSpacing.xxl, AppSpacing.lg, AppSpacing.sm, AppSpacing.sm),
              child: Row(
                children: [
                  Expanded(child: Text(title, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: context.colors.text))),
                  IconButton(onPressed: () => Navigator.pop(context), icon: Icon(Icons.close, color: context.colors.textMuted)),
                ],
              ),
            ),
            const Divider(height: 1),
            Expanded(child: SingleChildScrollView(padding: const EdgeInsets.all(AppSpacing.xxl), child: child)),
            if (actions != null)
              Container(
                padding: const EdgeInsets.all(AppSpacing.lg),
                decoration: BoxDecoration(border: Border(top: BorderSide(color: context.colors.border))),
                child: Row(children: actions.map((a) => Expanded(child: a)).toList()),
              ),
          ],
        ),
      ),
    );
  }
}
