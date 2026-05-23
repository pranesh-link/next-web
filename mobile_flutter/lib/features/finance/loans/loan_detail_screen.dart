import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:luvverse/core/theme/app_colors.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/features/finance/loans/widgets/prepayment_simulator.dart';
import 'package:luvverse/features/finance/providers/finance_providers.dart';
import 'package:luvverse/models/loan.dart';
import 'package:luvverse/shared/widgets/currency_display.dart';
import 'package:luvverse/shared/widgets/loading_skeleton.dart';

final _fmt = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);
final _dateFormat = DateFormat('dd MMM yyyy');

class LoanDetailScreen extends ConsumerWidget {
  final String loanId;

  const LoanDetailScreen({super.key, required this.loanId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final loansAsync = ref.watch(loansProvider);

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: loansAsync.whenOrNull(
              data: (loans) => Text(loans.where((l) => l.id == loanId).firstOrNull?.name ?? 'Loan'),
            ) ??
            const Text('Loan Details'),
      ),
      body: loansAsync.when(
        loading: () => const Padding(
          padding: EdgeInsets.all(AppSpacing.xl),
          child: LoadingSkeleton(type: SkeletonType.card, count: 3),
        ),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (loans) {
          final loan = loans.where((l) => l.id == loanId).firstOrNull;
          if (loan == null) return const Center(child: Text('Loan not found'));
          return SingleChildScrollView(
            padding: const EdgeInsets.all(AppSpacing.xl),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeader(loan),
                const SizedBox(height: AppSpacing.lg),
                _buildStatsRow(loan),
                const SizedBox(height: AppSpacing.lg),
                _buildProgress(loan),
                const SizedBox(height: AppSpacing.lg),
                _buildDetailsSection(loan),
                const SizedBox(height: AppSpacing.xxl),
                PrepaymentSimulator(loan: loan),
                if (loan.schedule != null && loan.schedule!.isNotEmpty) ...[
                  const SizedBox(height: AppSpacing.xxl),
                  _buildScheduleSection(loan.schedule!),
                ],
                if (loan.prepayments != null && loan.prepayments!.isNotEmpty) ...[
                  const SizedBox(height: AppSpacing.xxl),
                  _buildPrepayments(loan.prepayments!),
                ],
                const SizedBox(height: AppSpacing.xxl),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildHeader(Loan loan) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (loan.loanProvider != null)
          Text(loan.loanProvider!, style: AppTypography.body.copyWith(color: AppColors.textMuted)),
        if (loan.loanAccountNumber != null)
          Text('A/C: ${loan.loanAccountNumber}', style: AppTypography.xs.copyWith(color: AppColors.textMuted)),
        const SizedBox(height: AppSpacing.xs),
        Text('Remaining Balance', style: AppTypography.label.copyWith(color: AppColors.textMuted)),
        CurrencyDisplay(amount: loan.remainingBalance, colorCoded: false, style: AppTypography.pageTitle),
      ],
    );
  }

  Widget _buildStatsRow(Loan loan) {
    return Row(
      children: [
        _statCard('Principal', _fmt.format(loan.principal)),
        const SizedBox(width: AppSpacing.sm),
        _statCard('Rate', '${loan.interestRate}%'),
        const SizedBox(width: AppSpacing.sm),
        _statCard('Tenure', '${loan.tenureMonths}mo'),
        const SizedBox(width: AppSpacing.sm),
        _statCard('EMI', _fmt.format(loan.emiAmount)),
      ],
    );
  }

  Widget _statCard(String label, String value) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: AppColors.bgElevated,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          children: [
            Text(label, style: AppTypography.xs.copyWith(color: AppColors.textMuted)),
            const SizedBox(height: AppSpacing.xs),
            Text(value, style: AppTypography.bodyMedium, maxLines: 1, overflow: TextOverflow.ellipsis),
          ],
        ),
      ),
    );
  }

  Widget _buildProgress(Loan loan) {
    final paid = loan.principal - loan.remainingBalance;
    final progress = loan.principal > 0 ? (paid / loan.principal).clamp(0.0, 1.0) : 0.0;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('${(progress * 100).toStringAsFixed(1)}% repaid', style: AppTypography.body.copyWith(color: AppColors.accent)),
            Text(_fmt.format(paid), style: AppTypography.small.copyWith(color: AppColors.textMuted)),
          ],
        ),
        const SizedBox(height: AppSpacing.sm),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: progress,
            backgroundColor: AppColors.border,
            color: progress >= 1.0 ? AppColors.success : AppColors.accent,
            minHeight: 10,
          ),
        ),
      ],
    );
  }

  Widget _buildDetailsSection(Loan loan) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: AppColors.bgElevated,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Loan Details', style: AppTypography.sectionTitle),
          const SizedBox(height: AppSpacing.md),
          _detailRow('Start Date', _dateFormat.format(loan.startDate)),
          _detailRow('Tenure', '${loan.tenureMonths} months'),
          _detailRow('Interest Rate', '${loan.interestRate}% p.a.'),
          _detailRow('Monthly EMI', _fmt.format(loan.emiAmount)),
          _detailRow('Total Payable', _fmt.format(loan.emiAmount * loan.tenureMonths)),
          _detailRow('Total Interest', _fmt.format((loan.emiAmount * loan.tenureMonths) - loan.principal)),
          if (loan.loanProvider != null) _detailRow('Provider', loan.loanProvider!),
          if (loan.loanAccountNumber != null) _detailRow('Account No.', loan.loanAccountNumber!),
        ],
      ),
    );
  }

  Widget _detailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.xs),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: AppTypography.small.copyWith(color: AppColors.textMuted)),
          const SizedBox(width: AppSpacing.md),
          Flexible(child: Text(value, style: AppTypography.bodyMedium, textAlign: TextAlign.right, maxLines: 1, overflow: TextOverflow.ellipsis)),
        ],
      ),
    );
  }

  Widget _buildScheduleSection(List<LoanScheduleEntry> schedule) {
    return _ExpandableSchedule(schedule: schedule);
  }

  Widget _buildPrepayments(List<LoanPrepayment> prepayments) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Prepayments', style: AppTypography.sectionTitle),
        const SizedBox(height: AppSpacing.md),
        ...prepayments.map((p) => ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.payment, color: AppColors.accent),
              title: Text(_fmt.format(p.amount), style: AppTypography.bodyMedium),
              subtitle: Text(
                '${p.date}${p.source != null ? ' · ${p.source}' : ''}',
                style: AppTypography.small.copyWith(color: AppColors.textMuted),
              ),
              trailing: p.balanceAfter != null
                  ? Text('Bal: ${_fmt.format(p.balanceAfter!)}', style: AppTypography.small)
                  : null,
            )),
      ],
    );
  }
}

class _ExpandableSchedule extends StatefulWidget {
  final List<LoanScheduleEntry> schedule;
  const _ExpandableSchedule({required this.schedule});

  @override
  State<_ExpandableSchedule> createState() => _ExpandableScheduleState();
}

class _ExpandableScheduleState extends State<_ExpandableSchedule> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final display = _expanded ? widget.schedule : widget.schedule.take(6).toList();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Amortization Schedule', style: AppTypography.sectionTitle),
            if (widget.schedule.length > 6)
              TextButton(
                onPressed: () => setState(() => _expanded = !_expanded),
                child: Text(_expanded ? 'Show less' : 'Show all (${widget.schedule.length})'),
              ),
          ],
        ),
        const SizedBox(height: AppSpacing.md),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: DataTable(
            columnSpacing: AppSpacing.lg.toDouble(),
            headingTextStyle: AppTypography.xs.copyWith(color: AppColors.textMuted),
            dataTextStyle: AppTypography.small,
            columns: const [
              DataColumn(label: Text('Month')),
              DataColumn(label: Text('EMI')),
              DataColumn(label: Text('Principal')),
              DataColumn(label: Text('Interest')),
              DataColumn(label: Text('Balance')),
            ],
            rows: display
                .map((e) => DataRow(cells: [
                      DataCell(Text('${e.month}')),
                      DataCell(Text(_fmt.format(e.emi))),
                      DataCell(Text(_fmt.format(e.principal))),
                      DataCell(Text(_fmt.format(e.interest))),
                      DataCell(Text(_fmt.format(e.balance))),
                    ]))
                .toList(),
          ),
        ),
      ],
    );
  }
}
