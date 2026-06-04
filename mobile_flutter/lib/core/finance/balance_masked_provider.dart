import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

const _kBalanceMaskedKey = 'balanceMasked';

/// Persisted toggle — when true, all finance balance values render as ₹ ••••
final balanceMaskedProvider =
    StateNotifierProvider<BalanceMaskedNotifier, bool>((ref) {
  return BalanceMaskedNotifier();
});

class BalanceMaskedNotifier extends StateNotifier<bool> {
  BalanceMaskedNotifier() : super(false) {
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    state = prefs.getBool(_kBalanceMaskedKey) ?? false;
  }

  Future<void> toggle() async {
    state = !state;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_kBalanceMaskedKey, state);
  }
}
