import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/features/finance/providers/finance_providers.dart';
import 'package:luvverse/models/loan.dart';
import 'package:luvverse/shared/widgets/app_card.dart';
import 'package:luvverse/shared/widgets/loading_skeleton.dart';
import 'package:luvverse/shared/widgets/section_header.dart';

final _currencyFormat = NumberFormat.currency(locale: 'en_IN', symbol: '₹');

/// Shows total outstanding, monthly EMI load, count of loans.
class LoansSummaryWidget extends ConsumerWidget {
  const LoansSummaryWidget({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final loansAsync = ref.watch(loansProvider);

    return loansAsync.when(
      loading: () => const LoadingSkeleton(type: SkeletonType.card),
      error: (_, __) => const SizedBox.shrink(),
      data: (loans) {
        if (loans.isEmpty) return const SizedBox.shrink();
        return _LoansContent(loans: loans);
      },
    );
  }
}

class _LoansContent extends StatelessWidget {
  final List<Loan> loans;
  const _LoansContent({required this.loans});

  @override
  Widget build(BuildContext context) {
    final totalOutstanding = loans.fold(0.0, (sum, l) => sum + l.remainingBalance);
    final now = DateTime.now();
    final totalEmi = loans.fold(0.0, (sum, l) {
      final currentEmi = l.schedule
          ?.where((e) => !DateTime.parse(e.date).isBefore(now))
          .fold<LoanScheduleEntry?>(null, (prev, e) =>
              prev == null || DateTime.parse(e.date).isBefore(DateTime.parse(prev.date)) ? e : prev)
          ?.emi ?? l.emiAmount;
      return sum + currentEmi;
    });

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionHeader(title: 'Loans'),
        GestureDetector(
          onTap: () => context.go('/finance/loans'),
          child: AppCard(
          child: Column(
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: context.colors.danger.withAlpha(20),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(Icons.account_balance_outlined, color: context.colors.danger, size: 20),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Total Outstanding', style: AppTypography.small.copyWith(color: context.colors.textMuted)),
                        Text(
                          _currencyFormat.format(totalOutstanding),
                          style: AppTypography.cardTitle.copyWith(color: context.colors.danger),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const Divider(height: 24),
              Row(
                children: [
                  Expanded(
                    child: _StatItem(
                      label: 'Monthly EMI',
                      value: _currencyFormat.format(totalEmi),
                    ),
                  ),
                  Expanded(
                    child: _StatItem(
                      label: 'Active Loans',
                      value: '${loans.length}',
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
      ],
    );
  }
}

class _StatItem extends StatelessWidget {
  final String label;
  final String value;
  const _StatItem({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppTypography.xs.copyWith(color: context.colors.textMuted)),
        const SizedBox(height: 4),
        Text(value, style: AppTypography.body.copyWith(fontWeight: FontWeight.w600)),
      ],
    );
  }
}
