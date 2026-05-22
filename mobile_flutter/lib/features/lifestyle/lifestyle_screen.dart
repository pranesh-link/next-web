import 'package:flutter/material.dart';
import 'package:luvverse/core/theme/app_colors.dart';
import 'package:luvverse/shared/widgets/empty_state.dart';

class LifestyleScreen extends StatelessWidget {
  const LifestyleScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: const SafeArea(
        child: EmptyState(icon: Icons.favorite, title: 'Lifestyle', description: 'Health & wellness features coming soon'),
      ),
    );
  }
}
