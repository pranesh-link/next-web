import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:luvverse/core/auth/auth_provider.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_spacing.dart';

class LoginScreen extends ConsumerWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);

    // Belt-and-suspenders: if GoRouter redirect fires late or races the OS
    // permission dialog, navigate imperatively the moment isAuthenticated flips.
    ref.listen<AuthState>(authProvider, (previous, next) {
      if (next.isAuthenticated && !(previous?.isAuthenticated ?? false)) {
        context.go('/home');
      }
    });

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [context.colors.gradientStart, context.colors.gradientEnd],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xxxxl),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text(
                    'LuvVerse',
                    style: TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    'Couple Finance & Lifestyle',
                    style: TextStyle(
                      fontSize: 16,
                      color: Colors.white.withValues(alpha: 0.7),
                    ),
                  ),
                  const SizedBox(height: 48),
                  if (auth.isLoading)
                    const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.5,
                        color: Colors.white70,
                      ),
                    )
                  else
                    _GoogleSignInButton(
                      onPressed: () => ref.read(authProvider.notifier).signIn(),
                    ),
                  if (auth.error != null) ...[
                    const SizedBox(height: AppSpacing.lg),
                    Text(
                      auth.error!,
                      style: const TextStyle(color: Color(0xFFFFCDD2), fontSize: 13),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _GoogleSignInButton extends StatelessWidget {
  final VoidCallback onPressed;

  const _GoogleSignInButton({required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.white,
          foregroundColor: Colors.black87,
          elevation: 2,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            _GoogleLogo(),
            SizedBox(width: AppSpacing.md),
            Text('Sign in with Google', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }
}

class _GoogleLogo extends StatelessWidget {
  const _GoogleLogo();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 20,
      height: 20,
      child: CustomPaint(painter: _GoogleLogoPainter()),
    );
  }
}

class _GoogleLogoPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final double s = size.width;
    final rect = Rect.fromLTWH(0, 0, s, s);
    final paint = Paint()..strokeWidth = s * 0.18..style = PaintingStyle.stroke..strokeCap = StrokeCap.butt;

    paint.color = const Color(0xFFEA4335);
    canvas.drawArc(rect, -0.9, -1.2, false, paint);
    paint.color = const Color(0xFFFBBC05);
    canvas.drawArc(rect, -2.1, -1.1, false, paint);
    paint.color = const Color(0xFF34A853);
    canvas.drawArc(rect, 2.8, -1.1, false, paint);
    paint.color = const Color(0xFF4285F4);
    canvas.drawArc(rect, -0.9, 1.5, false, paint);

    final barPaint = Paint()..color = const Color(0xFF4285F4)..strokeWidth = s * 0.18..strokeCap = StrokeCap.round;
    canvas.drawLine(Offset(s * 0.5, s * 0.5), Offset(s * 0.95, s * 0.5), barPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
