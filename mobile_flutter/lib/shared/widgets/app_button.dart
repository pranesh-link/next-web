import 'package:flutter/material.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_animations.dart';

enum ButtonVariant { primary, secondary, danger }
enum ButtonSize { sm, md, lg }

class AppButton extends StatefulWidget {
  final String label;
  final VoidCallback? onPressed;
  final ButtonVariant variant;
  final ButtonSize size;
  final bool isLoading;
  final bool fullWidth;
  final IconData? icon;

  const AppButton({
    super.key,
    required this.label,
    this.onPressed,
    this.variant = ButtonVariant.primary,
    this.size = ButtonSize.md,
    this.isLoading = false,
    this.fullWidth = false,
    this.icon,
  });

  @override
  State<AppButton> createState() => _AppButtonState();
}

class _AppButtonState extends State<AppButton> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(duration: AppAnimations.standard, vsync: this);
    _scale = Tween(begin: 1.0, end: 0.98).animate(CurvedAnimation(parent: _controller, curve: AppAnimations.easing));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Color get _bg => switch (widget.variant) {
    ButtonVariant.primary => context.colors.accent,
    ButtonVariant.secondary => Colors.transparent,
    ButtonVariant.danger => context.colors.danger,
  };

  Color get _fg => switch (widget.variant) {
    ButtonVariant.primary => Colors.white,
    ButtonVariant.secondary => context.colors.text,
    ButtonVariant.danger => Colors.white,
  };

  EdgeInsets get _padding => switch (widget.size) {
    ButtonSize.sm => const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
    ButtonSize.md => const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
    ButtonSize.lg => const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
  };

  double get _fontSize => switch (widget.size) {
    ButtonSize.sm => 13,
    ButtonSize.md => 14,
    ButtonSize.lg => 15,
  };

  @override
  Widget build(BuildContext context) {
    return ScaleTransition(
      scale: _scale,
      child: GestureDetector(
        onTapDown: (_) => _controller.forward(),
        onTapUp: (_) => _controller.reverse(),
        onTapCancel: () => _controller.reverse(),
        child: SizedBox(
          width: widget.fullWidth ? double.infinity : null,
          child: Material(
            color: _bg,
            borderRadius: BorderRadius.circular(10),
            child: InkWell(
              onTap: widget.isLoading ? null : widget.onPressed,
              borderRadius: BorderRadius.circular(10),
              child: Container(
                padding: _padding,
                decoration: widget.variant == ButtonVariant.secondary
                    ? BoxDecoration(
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: context.colors.borderStrong),
                      )
                    : null,
                child: Row(
                  mainAxisSize: widget.fullWidth ? MainAxisSize.max : MainAxisSize.min,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (widget.isLoading)
                      Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: _fg)),
                      )
                    else if (widget.icon != null)
                      Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: Icon(widget.icon, size: 18, color: _fg),
                      ),
                    Text(widget.label, style: TextStyle(fontSize: _fontSize, fontWeight: FontWeight.w600, color: _fg)),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
