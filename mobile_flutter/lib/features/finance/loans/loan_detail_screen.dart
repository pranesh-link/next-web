import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/features/finance/loans/widgets/prepayment_simulator.dart';
import 'package:luvverse/features/finance/providers/finance_providers.dart';
import 'package:luvverse/models/loan.dart';
import 'package:luvverse/_services/finance/loan_emi_utils.dart';
import 'package:luvverse/shared/widgets/currency_display.dart';
import 'package:luvverse/shared/widgets/loading_skeleton.dart';
import 'package:luvverse/shared/widgets/offline_error_state.dart';

final _fmt = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);
final _dateFormat = DateFormat('dd MMM yyyy');

class LoanDetailScreen extends ConsumerWidget {
  final String loanId;

  const LoanDetailScreen({super.key, required this.loanId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final loansAsync = ref.watch(loansProvider);

    return Scaffold(
      backgroundColor: context.colors.bg,
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
        error: (e, _) => OfflineErrorState(
          error: e,
          onRetry: () => ref.read(loansProvider.notifier).refresh(),
        ),
        data: (loans) {
          final loan = loans.where((l) => l.id == loanId).firstOrNull;
          if (loan == null) return const Center(child: Text('Loan not found'));
          return SingleChildScrollView(
            padding: const EdgeInsets.all(AppSpacing.xl),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeader(context, loan),
                const SizedBox(height: AppSpacing.lg),
                _buildStatsRow(context, loan),
                const SizedBox(height: AppSpacing.lg),
                _buildProgress(context, loan),
                const SizedBox(height: AppSpacing.lg),
                _buildDetailsSection(context, loan),
                const SizedBox(height: AppSpacing.xxl),
                PrepaymentSimulator(loan: loan),
                if (loan.schedule != null && loan.schedule!.isNotEmpty) ...[
                  const SizedBox(height: AppSpacing.xxl),
                  _buildScheduleSection(loan.schedule!),
                ],
                if (loan.prepayments != null && loan.prepayments!.isNotEmpty) ...[
                  const SizedBox(height: AppSpacing.xxl),
                  _buildPrepayments(context, loan.prepayments!),
                ],
                const SizedBox(height: AppSpacing.xxl),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildHeader(BuildContext context, Loan loan) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (loan.loanProvider != null)
          Text(loan.loanProvider!, style: AppTypography.body.copyWith(color: context.colors.textMuted)),
        if (loan.loanAccountNumber != null)
          Text('A/C: ${loan.loanAccountNumber}', style: AppTypography.xs.copyWith(color: context.colors.textMuted)),
        const SizedBox(height: AppSpacing.xs),
        Text('Remaining Balance', style: AppTypography.label.copyWith(color: context.colors.textMuted)),
        CurrencyDisplay(amount: loan.remainingBalance, colorCoded: false, style: AppTypography.pageTitle),
      ],
    );
  }

  Widget _buildStatsRow(BuildContext context, Loan loan) {
    // Use shared util: current-month schedule entry, falls back to emiAmount.
    final currentEmi = currentMonthEmi(loan, DateTime.now());
    return Row(
      children: [
        _statCard(context, 'Principal', _fmt.format(loan.principal)),
        const SizedBox(width: AppSpacing.sm),
        _statCard(context, 'Rate', '${loan.interestRate}%'),
        const SizedBox(width: AppSpacing.sm),
        _statCard(context, 'Tenure', '${loan.tenureMonths}mo'),
        const SizedBox(width: AppSpacing.sm),
        _statCard(context, 'EMI', _fmt.format(currentEmi)),
      ],
    );
  }

  Widget _statCard(BuildContext context, String label, String value) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: context.colors.bgElevated,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: context.colors.border),
        ),
        child: Column(
          children: [
            Text(label, style: AppTypography.xs.copyWith(color: context.colors.textMuted)),
            const SizedBox(height: AppSpacing.xs),
            Text(value, style: AppTypography.bodyMedium, maxLines: 1, overflow: TextOverflow.ellipsis),
          ],
        ),
      ),
    );
  }

  Widget _buildProgress(BuildContext context, Loan loan) {
    final paid = loan.principal - loan.remainingBalance;
    final progress = loan.principal > 0 ? (paid / loan.principal).clamp(0.0, 1.0) : 0.0;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('${(progress * 100).toStringAsFixed(1)}% repaid', style: AppTypography.body.copyWith(color: context.colors.accent)),
            Text(_fmt.format(paid), style: AppTypography.small.copyWith(color: context.colors.textMuted)),
          ],
        ),
        const SizedBox(height: AppSpacing.sm),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: progress,
            backgroundColor: context.colors.border,
            color: progress >= 1.0 ? context.colors.success : context.colors.accent,
            minHeight: 10,
          ),
        ),
      ],
    );
  }

  Widget _buildDetailsSection(BuildContext context, Loan loan) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: context.colors.bgElevated,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: context.colors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Loan Details', style: AppTypography.sectionTitle),
          const SizedBox(height: AppSpacing.md),
          _detailRow(context, 'Start Date', _dateFormat.format(loan.startDate)),
          _detailRow(context, 'Tenure', '${loan.tenureMonths} months'),
          _detailRow(context, 'Interest Rate', '${loan.interestRate}% p.a.'),
          _detailRow(context, 'Monthly EMI', _fmt.format(loan.emiAmount)),
          _detailRow(context, 'Total Payable', _fmt.format(loan.emiAmount * loan.tenureMonths)),
          _detailRow(context, 'Total Interest', _fmt.format((loan.emiAmount * loan.tenureMonths) - loan.principal)),
          if (loan.loanProvider != null) _detailRow(context, 'Provider', loan.loanProvider!),
          if (loan.loanAccountNumber != null) _detailRow(context, 'Account No.', loan.loanAccountNumber!),
        ],
      ),
    );
  }

  Widget _detailRow(BuildContext context, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.xs),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: AppTypography.small.copyWith(color: context.colors.textMuted)),
          const SizedBox(width: AppSpacing.md),
          Flexible(child: Text(value, style: AppTypography.bodyMedium, textAlign: TextAlign.right, maxLines: 1, overflow: TextOverflow.ellipsis)),
        ],
      ),
    );
  }

  Widget _buildScheduleSection(List<LoanScheduleEntry> schedule) {
    return _ExpandableSchedule(schedule: schedule);
  }

  Widget _buildPrepayments(BuildContext context, List<LoanPrepayment> prepayments) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Prepayments', style: AppTypography.sectionTitle),
        const SizedBox(height: AppSpacing.md),
        ...prepayments.map((p) => ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Icon(Icons.payment, color: context.colors.accent),
              title: Text(_fmt.format(p.amount), style: AppTypography.bodyMedium),
              subtitle: Text(
                '${p.date}${p.source != null ? ' · ${p.source}' : ''}',
                style: AppTypography.small.copyWith(color: context.colors.textMuted),
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
  bool _showPaid = false;

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    // Sort ascending by date (nearest EMI first)
    final sorted = [...widget.schedule]
      ..sort((a, b) => DateTime.parse(a.date).compareTo(DateTime.parse(b.date)));

    final unpaid = sorted.where((e) => !DateTime.parse(e.date).isBefore(now)).toList();
    final paid = sorted.where((e) => DateTime.parse(e.date).isBefore(now)).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('EMI Schedule', style: AppTypography.sectionTitle),
        const SizedBox(height: AppSpacing.md),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: DataTable(
            columnSpacing: AppSpacing.lg.toDouble(),
            headingTextStyle: AppTypography.xs.copyWith(color: context.colors.textMuted),
            dataTextStyle: AppTypography.small,
            columns: const [
              DataColumn(label: Text('EMI Date')),
              DataColumn(label: Text('EMI Amount')),
              DataColumn(label: Text('Balance')),
            ],
            rows: unpaid
                .map((e) => DataRow(cells: [
                      DataCell(Text(e.date)),
                      DataCell(Text(_fmt.format(e.emi))),
                      DataCell(Text(_fmt.format(e.balance))),
                    ]))
                .toList(),
          ),
        ),
        if (paid.isNotEmpty) ...[
          const SizedBox(height: AppSpacing.sm),
          TextButton.icon(
            onPressed: () => setState(() => _showPaid = !_showPaid),
            icon: Icon(_showPaid ? Icons.expand_less : Icons.expand_more, size: 18),
            label: Text(_showPaid ? 'Hide paid (${paid.length})' : 'Show paid (${paid.length})'),
          ),
          if (_showPaid)
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: DataTable(
                columnSpacing: AppSpacing.lg.toDouble(),
                headingTextStyle: AppTypography.xs.copyWith(color: context.colors.textMuted),
                dataTextStyle: AppTypography.small.copyWith(color: context.colors.textMuted),
                columns: const [
                  DataColumn(label: Text('EMI Date')),
                  DataColumn(label: Text('EMI Amount')),
                  DataColumn(label: Text('Balance')),
                ],
                rows: paid
                    .map((e) => DataRow(cells: [
                          DataCell(Text(e.date)),
                          DataCell(Text(_fmt.format(e.emi))),
                          DataCell(Text(_fmt.format(e.balance))),
                        ]))
                    .toList(),
              ),
            ),
        ],
      ],
    );
  }
}
