import 'package:intl/intl.dart';

abstract final class Formatters {
  static final _currencyFormat = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 2);
  static final _compactFormat = NumberFormat.compactCurrency(locale: 'en_IN', symbol: '₹', decimalDigits: 1);
  static final _dateFormat = DateFormat('d MMM yyyy');
  static final _monthFormat = DateFormat('MMMM yyyy');

  static String currency(double amount) => _currencyFormat.format(amount);

  static String currencyCompact(double amount) => _compactFormat.format(amount);

  static String date(DateTime date) => _dateFormat.format(date);

  static String monthLabel(String yearMonth) {
    final parts = yearMonth.split('-');
    final d = DateTime(int.parse(parts[0]), int.parse(parts[1]));
    return _monthFormat.format(d);
  }

  static String percent(double value, {int decimals = 1}) => '${value.toStringAsFixed(decimals)}%';
}
