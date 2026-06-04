import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/features/finance/dashboard/account_breakdown_widget.dart';
import 'package:luvverse/features/finance/dashboard/budgets_status_widget.dart';
import 'package:luvverse/features/finance/dashboard/goals_summary_widget.dart';
import 'package:luvverse/features/finance/dashboard/health_score_widget.dart';
import 'package:luvverse/features/finance/dashboard/insights_widget.dart';
import 'package:luvverse/features/finance/dashboard/loans_summary_widget.dart';
import 'package:luvverse/features/finance/dashboard/net_worth_card.dart';
import 'package:go_router/go_router.dart';
import 'package:luvverse/features/finance/providers/finance_providers.dart';
import 'package:luvverse/features/finance/providers/extended_providers.dart';
import 'package:luvverse/models/transaction.dart';
import 'package:luvverse/shared/widgets/currency_display.dart';
import 'package:luvverse/shared/widgets/loading_skeleton.dart';
import 'package:luvverse/shared/widgets/offline_error_state.dart';
import 'package:luvverse/shared/widgets/section_header.dart';
import 'package:luvverse/shared/widgets/summary_card.dart';

final _currencyFormat = NumberFormat.currency(locale: 'en_IN', symbol: '₹');

const _categoryColors = <String, Color>{
  'Food': Color(0xFFF59E0B),
  'Transport': Color(0xFF3B82F6),
  'Shopping': Color(0xFFEC4899),
  'Bills': Color(0xFF8B5CF6),
  'Entertainment': Color(0xFF06B6D4),
  'Health': Color(0xFF10B981),
  'Education': Color(0xFF6366F1),
  'Other': Color(0xFF94A3B8),
};

class FinanceDashboardScreen extends ConsumerWidget {
  const FinanceDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final balance = ref.watch(totalBalanceProvider);
    final income = ref.watch(monthlyIncomeProvider);
    final expense = ref.watch(monthlyExpenseProvider);
    final savingsRate = ref.watch(savingsRateProvider);
    final txns = ref.watch(transactionsProvider);
    return RefreshIndicator(
      onRefresh: () async {
        try {
          await ref.read(accountsProvider.notifier).refresh();
          await ref.read(transactionsProvider.notifier).refresh();
          ref.invalidate(healthScoreProvider);
          ref.invalidate(dashboardInsightsProvider);
          ref.invalidate(loansProvider);
          ref.invalidate(goalsProvider);
          ref.invalidate(budgetsProvider);
        } catch (_) {
          // Offline — keep showing cached data, don't throw
        }
      },
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 1. Summary: Balance + Net Worth + Cash Flow + Savings Rate
            const SectionHeader(title: 'Overview'),
            const SizedBox(height: AppSpacing.sm),
            _buildSummaryRow(income, expense, balance, savingsRate),
            const SizedBox(height: AppSpacing.md),
            const NetWorthCard(),
            const SizedBox(height: AppSpacing.xxl),
            // 3. Account Breakdown
            const AccountBreakdownWidget(),
            const SizedBox(height: AppSpacing.xxl),
            // 4. Health Score
            const HealthScoreWidget(),
            const SizedBox(height: AppSpacing.xxl),
            // 5. Alerts / Insights
            const InsightsWidget(),
            const SizedBox(height: AppSpacing.xxl),
            // 6. Monthly Trends
            const MonthlyTrendsWidget(),
            const SizedBox(height: AppSpacing.xxl),
            // 7. Expense Breakdown pie
            const SectionHeader(title: 'Expense Breakdown'),
            const SizedBox(height: AppSpacing.sm),
            txns.when(
              loading: () => const LoadingSkeleton(type: SkeletonType.chart),
              error: (e, _) => OfflineErrorState(error: e, onRetry: () => ref.read(transactionsProvider.notifier).refresh()),
              data: (items) => _buildPieChart(context, items),
            ),
            const SizedBox(height: AppSpacing.xxl),
            // 8. Budgets Status
            const BudgetsStatusWidget(),
            const SizedBox(height: AppSpacing.xxl),
            // 9. Loans Summary
            const LoansSummaryWidget(),
            const SizedBox(height: AppSpacing.xxl),
            // 10. Goals Summary
            const GoalsSummaryWidget(),
            const SizedBox(height: AppSpacing.xxl),
            // 11. Recent Transactions
            const SectionHeader(title: 'Recent Transactions'),
            const SizedBox(height: AppSpacing.sm),
            txns.when(
              loading: () => const LoadingSkeleton(type: SkeletonType.list, count: 5),
              error: (e, _) => OfflineErrorState(error: e, onRetry: () => ref.read(transactionsProvider.notifier).refresh()),
              data: (items) => items.isEmpty
                  ? Padding(
                      padding: const EdgeInsets.all(AppSpacing.lg),
                      child: Center(child: Text('No transactions yet', style: TextStyle(color: context.colors.textMuted))),
                    )
                  : Column(children: items.take(5).map((tx) => _buildTxTile(context, tx)).toList()),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryRow(AsyncValue<double> income, AsyncValue<double> expense, AsyncValue<double> balance, AsyncValue<double> savingsRate) {
    return Column(
      children: [
        balance.when(
          loading: () => const LoadingSkeleton(type: SkeletonType.card, count: 1),
          error: (_, __) => const SizedBox.shrink(),
          data: (val) => GestureDetector(
            onTap: () => context.go('/finance/accounts'),
            child: _AnimatedSummaryCard(title: 'Total Balance', value: val, icon: Icons.account_balance_wallet),
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        Row(
          children: [
            Expanded(
              child: income.when(
                loading: () => const LoadingSkeleton(type: SkeletonType.card, count: 1),
                error: (_, __) => const SizedBox.shrink(),
                data: (val) => _AnimatedSummaryCard(title: 'Income', value: val, icon: Icons.trending_up),
              ),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: expense.when(
                loading: () => const LoadingSkeleton(type: SkeletonType.card, count: 1),
                error: (_, __) => const SizedBox.shrink(),
                data: (val) => _AnimatedSummaryCard(title: 'Expenses', value: val, icon: Icons.trending_down),
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.md),
        Row(
          children: [
            Expanded(
              child: income.when(
                loading: () => const LoadingSkeleton(type: SkeletonType.card, count: 1),
                error: (_, __) => const SizedBox.shrink(),
                data: (incVal) {
                  final expVal = expense.valueOrNull ?? 0.0;
                  return _AnimatedSummaryCard(
                    title: 'Cash Flow',
                    value: incVal - expVal,
                    icon: Icons.swap_vert,
                  );
                },
              ),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: savingsRate.when(
                loading: () => const LoadingSkeleton(type: SkeletonType.card, count: 1),
                error: (_, __) => const SizedBox.shrink(),
                data: (val) => _AnimatedPercentCard(
                  title: 'Savings Rate',
                  value: val,
                  icon: Icons.savings_outlined,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildPieChart(BuildContext context, List<Transaction> transactions) {
    final expenses = transactions.where((t) => t.type == TransactionType.expense).toList();
    if (expenses.isEmpty) {
      return Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Center(child: Text('No expenses this month', style: TextStyle(color: context.colors.textMuted))),
      );
    }
    final grouped = <String, double>{};
    for (final tx in expenses) {
      grouped[tx.category] = (grouped[tx.category] ?? 0) + tx.amount;
    }
    final entries = grouped.entries.toList()..sort((a, b) => b.value.compareTo(a.value));
    final sections = entries.map((e) {
      final color = _categoryColors[e.key] ?? _categoryColors['Other']!;
      return PieChartSectionData(
        value: e.value,
        color: color,
        radius: 50,
        title: '',
      );
    }).toList();

    return Column(
      children: [
        SizedBox(
          height: 200,
          child: PieChart(PieChartData(
            sections: sections,
            centerSpaceRadius: 40,
            sectionsSpace: 2,
          )),
        ),
        const SizedBox(height: AppSpacing.lg),
        Wrap(
          spacing: AppSpacing.lg.toDouble(),
          runSpacing: AppSpacing.sm.toDouble(),
          children: entries.map((e) {
            final color = _categoryColors[e.key] ?? _categoryColors['Other']!;
            return Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(width: 12, height: 12, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
                const SizedBox(width: AppSpacing.xs),
                Text(e.key, style: AppTypography.small),
                const SizedBox(width: AppSpacing.xs),
                Text(_currencyFormat.format(e.value), style: AppTypography.xs.copyWith(color: context.colors.textMuted)),
              ],
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildTxTile(BuildContext context, Transaction tx) {
    final isIncome = tx.type == TransactionType.income;
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Icon(
        isIncome ? Icons.arrow_downward : Icons.arrow_upward,
        color: isIncome ? context.colors.success : context.colors.danger,
      ),
      title: Text(tx.description ?? tx.category, style: AppTypography.body),
      subtitle: Text(DateFormat('dd MMM yyyy').format(tx.date), style: AppTypography.small),
      trailing: CurrencyDisplay(amount: isIncome ? tx.amount : -tx.amount, colorCoded: true, showSign: true, style: AppTypography.body),
    );
  }
}

class _AnimatedSummaryCard extends StatelessWidget {
  final String title;
  final double value;
  final IconData icon;

  const _AnimatedSummaryCard({
    required this.title,
    required this.value,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: value),
      duration: const Duration(milliseconds: 800),
      curve: Curves.easeOutCubic,
      builder: (context, animatedValue, _) => SummaryCard(
        title: title,
        value: _currencyFormat.format(animatedValue),
        icon: icon,
      ),
    );
  }
}

class _AnimatedPercentCard extends StatelessWidget {
  final String title;
  final double value;
  final IconData icon;

  const _AnimatedPercentCard({
    required this.title,
    required this.value,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: value),
      duration: const Duration(milliseconds: 800),
      curve: Curves.easeOutCubic,
      builder: (context, animatedValue, _) => SummaryCard(
        title: title,
        value: '${animatedValue.toStringAsFixed(1)}%',
        icon: icon,
      ),
    );
  }
}
