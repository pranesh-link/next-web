import 'package:luvverse/models/loan.dart';

/// Returns the EMI for [loan] that corresponds to the current calendar month.
///
/// Looks up the loan's amortisation schedule for an entry whose [date] falls
/// in the same year-month as [now]. This gives the true outflow for that
/// month (post-prepayments or step-up schedules may vary from [Loan.emiAmount]).
///
/// Falls back to [Loan.emiAmount] when no schedule is stored.
/// Returns 0.0 when the loan has no entry for this month (completed / not yet
/// started).
double currentMonthEmi(Loan loan, DateTime now) {
  if (loan.schedule == null || loan.schedule!.isEmpty) return loan.emiAmount;
  for (final e in loan.schedule!) {
    final d = DateTime.tryParse(e.date);
    if (d != null && d.year == now.year && d.month == now.month) {
      return e.emi;
    }
  }
  return 0.0;
}

/// Sums [currentMonthEmi] across all [loans] for [now].
double totalCurrentMonthEmi(List<Loan> loans, DateTime now) {
  return loans.fold(0.0, (sum, l) => sum + currentMonthEmi(l, now));
}
