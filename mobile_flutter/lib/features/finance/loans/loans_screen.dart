import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:luvverse/core/theme/app_colors.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/features/finance/providers/finance_providers.dart';
import 'package:luvverse/models/loan.dart';
import 'package:luvverse/shared/widgets/app_button.dart';
import 'package:luvverse/shared/widgets/app_card.dart';
import 'package:luvverse/shared/widgets/currency_display.dart';
import 'package:luvverse/shared/widgets/empty_state.dart';
import 'package:luvverse/shared/widgets/loading_skeleton.dart';
import 'package:luvverse/features/finance/forms/add_loan_form.dart';

final _currencyFormat = NumberFormat.currency(locale: 'en_IN', symbol: '₹');

class LoansScreen extends ConsumerWidget {
  const LoansScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncLoans = ref.watch(loansProvider);

    return Padding(
      padding: const EdgeInsets.all(AppSpacing.xl),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [AppButton(label: 'Add Loan', icon: Icons.add, size: ButtonSize.sm, onPressed: () => AddLoanForm.show(context))],
          ),
          const SizedBox(height: AppSpacing.lg),
          Expanded(
            child: asyncLoans.when(
              loading: () => const LoadingSkeleton(type: SkeletonType.card, count: 3),
              error: (e, _) => Center(child: Text('Error: $e')),
              data: (loans) => loans.isEmpty
                  ? EmptyState(
                      icon: Icons.real_estate_agent,
                      title: 'No loans',
                      description: 'Track your loans and EMI payments',
                      actionLabel: 'Add Loan',
                      onAction: () => AddLoanForm.show(context),
                    )
                  : ListView.separated(
                      itemCount: loans.length,
                      separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.md),
                      itemBuilder: (_, i) => _buildLoanCard(loans[i]),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoanCard(Loan loan) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(child: Text(loan.name, style: AppTypography.cardTitle)),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: AppSpacing.xs),
                decoration: BoxDecoration(
                  color: AppColors.accent.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text('${loan.interestRate}%', style: AppTypography.small.copyWith(color: AppColors.accent)),
              ),
            ],
          ),
          if (loan.loanProvider != null) ...[
            const SizedBox(height: AppSpacing.xs),
            Text(loan.loanProvider!, style: AppTypography.small),
          ],
          const SizedBox(height: AppSpacing.sm),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Remaining', style: AppTypography.small),
                  CurrencyDisplay(amount: loan.remainingBalance, colorCoded: true),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text('EMI', style: AppTypography.small),
                  Text(_currencyFormat.format(loan.emiAmount), style: AppTypography.body),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}
