import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:luvverse/core/theme/app_colors.dart';
import 'package:luvverse/core/theme/app_typography.dart';

class FinanceShell extends StatelessWidget {
  final Widget child;
  final String currentLocation;

  const FinanceShell({super.key, required this.child, required this.currentLocation});

  static const _tabs = [
    _Tab('Dashboard', Icons.dashboard_outlined),
    _Tab('Accounts', Icons.account_balance_outlined),
    _Tab('Transactions', Icons.receipt_long_outlined),
    _Tab('Budgets', Icons.pie_chart_outline),
    _Tab('Planner', Icons.calendar_month_outlined),
    _Tab('Loans', Icons.real_estate_agent_outlined),
    _Tab('Goals', Icons.flag_outlined),
  ];

  static const _routes = ['/finance', '/finance/accounts', '/finance/transactions', '/finance/budgets', '/finance/budget-planner', '/finance/loans', '/finance/goals'];

  @override
  Widget build(BuildContext context) {
    final activeIndex = _routes.indexWhere((r) => r != '/finance' && currentLocation.startsWith(r));
    // If no sub-route matched, we're on the dashboard (index 0)
    final resolvedIndex = activeIndex == -1 ? 0 : activeIndex;

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: const Text('Finance'),
        backgroundColor: AppColors.bg,
        elevation: 0,
        titleTextStyle: AppTypography.pageTitle,
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert, color: AppColors.textMuted),
            onSelected: (route) => context.go(route),
            itemBuilder: (_) => const [
              PopupMenuItem(value: '/finance/scan-receipt', child: Text('Scan Receipt')),
              PopupMenuItem(value: '/finance/scan-schedule', child: Text('Scan Schedule')),
              PopupMenuItem(value: '/couple/manage', child: Text('Couple')),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: List.generate(_tabs.length, (i) {
                final isActive = i == resolvedIndex;
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
          Expanded(child: child),
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
