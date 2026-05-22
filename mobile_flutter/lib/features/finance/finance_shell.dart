import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:luvverse/core/theme/app_colors.dart';
import 'package:luvverse/core/theme/app_typography.dart';

class FinanceShell extends StatelessWidget {
  final StatefulNavigationShell navigationShell;

  const FinanceShell({super.key, required this.navigationShell});

  static const _tabs = [
    _Tab('Dashboard', Icons.dashboard_outlined),
    _Tab('Accounts', Icons.account_balance_outlined),
    _Tab('Transactions', Icons.receipt_long_outlined),
    _Tab('Budgets', Icons.pie_chart_outline),
    _Tab('Loans', Icons.real_estate_agent_outlined),
    _Tab('Goals', Icons.flag_outlined),
  ];

  static const _routes = ['/finance', '/finance/accounts', '/finance/transactions', '/finance/budgets', '/finance/loans', '/finance/goals'];

  @override
  Widget build(BuildContext context) {
    final currentPath = GoRouterState.of(context).uri.path;
    final activeIndex = _routes.indexWhere((r) => currentPath == r || currentPath.startsWith('$r/'));

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: const Text('Finance'),
        backgroundColor: AppColors.bg,
        elevation: 0,
        titleTextStyle: AppTypography.pageTitle,
      ),
      body: Column(
        children: [
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: List.generate(_tabs.length, (i) {
                final isActive = i == (activeIndex == -1 ? 0 : activeIndex);
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: GestureDetector(
                    onTap: () => context.go(_routes[i]),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      decoration: BoxDecoration(
                        color: isActive ? AppColors.accent : Colors.transparent,
                        borderRadius: BorderRadius.circular(20),
                        border: isActive ? null : Border.all(color: AppColors.border),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(_tabs[i].icon, size: 16, color: isActive ? Colors.white : AppColors.textDim),
                          const SizedBox(width: 6),
                          Text(
                            _tabs[i].label,
                            style: AppTypography.small.copyWith(color: isActive ? Colors.white : AppColors.textDim, fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }),
            ),
          ),
          Expanded(child: navigationShell),
        ],
      ),
    );
  }
}

class _Tab {
  final String label;
  final IconData icon;
  const _Tab(this.label, this.icon);
}
