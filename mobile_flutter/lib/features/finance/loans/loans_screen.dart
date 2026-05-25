import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:luvverse/core/theme/app_colors.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/features/finance/loans/widgets/edit_loan_form.dart';
import 'package:luvverse/features/finance/loans/widgets/loan_card.dart';
import 'package:luvverse/features/finance/loans/widgets/loan_summary_cards.dart';
import 'package:luvverse/features/finance/providers/finance_providers.dart';
import 'package:luvverse/models/loan.dart';
import 'package:luvverse/shared/widgets/app_button.dart';
import 'package:luvverse/shared/widgets/empty_state.dart';
import 'package:luvverse/shared/widgets/loading_skeleton.dart';
import 'package:luvverse/shared/widgets/offline_error_state.dart';
import 'package:luvverse/features/finance/forms/add_loan_form.dart';

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
              error: (e, _) => OfflineErrorState(
                error: e,
                onRetry: () => ref.read(loansProvider.notifier).refresh(),
              ),
              data: (loans) => loans.isEmpty
                  ? EmptyState(
                      icon: Icons.real_estate_agent,
                      title: 'No loans',
                      description: 'Track your loans and EMI payments',
                      actionLabel: 'Add Loan',
                      onAction: () => AddLoanForm.show(context),
                    )
                  : RefreshIndicator(
                      color: AppColors.accent,
                      onRefresh: () => ref.read(loansProvider.notifier).refresh(),
                      child: ListView(
                        children: [
                          LoanSummaryCards(loans: loans),
                          const SizedBox(height: AppSpacing.lg),
                          ...loans.map((loan) => Padding(
                                padding: const EdgeInsets.only(bottom: AppSpacing.md),
                                child: LoanCard(
                                  loan: loan,
                                  onView: () => context.go('/finance/loans/${loan.id}'),
                                  onEdit: () => EditLoanForm.show(context, loan),
                                  onDelete: () => _confirmDelete(context, ref, loan),
                                ),
                              )),
                        ],
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref, Loan loan) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Loan'),
        content: Text('Delete "${loan.name}"? This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text('Delete', style: TextStyle(color: AppColors.danger)),
          ),
        ],
      ),
    );
    if (confirm == true) {
      await ref.read(loansProvider.notifier).delete(loan.id);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Loan deleted')));
      }
    }
  }
}
