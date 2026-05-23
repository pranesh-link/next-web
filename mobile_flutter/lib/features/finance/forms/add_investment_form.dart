import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/shared/widgets/app_button.dart';
import 'package:luvverse/shared/widgets/app_input.dart';
import 'package:luvverse/shared/widgets/app_modal.dart';
import 'package:luvverse/features/finance/providers/extended_providers.dart';
import 'package:luvverse/models/investment.dart';

const _assetTypes = {
  'GOLD': 'Gold',
  'SILVER': 'Silver',
  'STOCK': 'Stock',
  'MUTUAL_FUND': 'Mutual Fund',
};

const _modes = {
  'LUMPSUM': 'Lumpsum',
  'SIP': 'SIP',
};

/// Form to add a new investment holding.
class AddInvestmentForm extends ConsumerStatefulWidget {
  const AddInvestmentForm({super.key});

  static void show(BuildContext context) {
    AppModal.show(
      context: context,
      title: 'Add Investment',
      size: ModalSize.lg,
      child: const AddInvestmentForm(),
    );
  }

  @override
  ConsumerState<AddInvestmentForm> createState() => _AddInvestmentFormState();
}

class _AddInvestmentFormState extends ConsumerState<AddInvestmentForm> {
  final _nameCtrl = TextEditingController();
  final _tickerCtrl = TextEditingController();
  final _investedCtrl = TextEditingController();
  final _currentValueCtrl = TextEditingController();
  final _quantityCtrl = TextEditingController();
  final _sipAmountCtrl = TextEditingController();
  final _sipDayCtrl = TextEditingController();
  String _assetType = InvestmentAssetType.mutualFund;
  String _mode = InvestmentMode.sip;
  String? _exchange;
  bool _loading = false;
  String? _nameError;
  String? _investedError;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _tickerCtrl.dispose();
    _investedCtrl.dispose();
    _currentValueCtrl.dispose();
    _quantityCtrl.dispose();
    _sipAmountCtrl.dispose();
    _sipDayCtrl.dispose();
    super.dispose();
  }

  bool _validate() {
    setState(() {
      _nameError = _nameCtrl.text.trim().isEmpty ? 'Name required' : null;
      _investedError = double.tryParse(_investedCtrl.text) == null
          ? 'Enter valid amount'
          : null;
    });
    return _nameError == null && _investedError == null;
  }

  Future<void> _submit() async {
    if (!_validate()) return;
    setState(() => _loading = true);
    try {
      final isGoldSilver =
          _assetType == InvestmentAssetType.gold || _assetType == InvestmentAssetType.silver;

      await ref.read(investmentsProvider.notifier).create(
            name: _nameCtrl.text.trim(),
            assetType: _assetType,
            mode: _mode,
            investedAmount: double.parse(_investedCtrl.text),
            startDate: DateTime.now(),
            ticker: _tickerCtrl.text.trim().isEmpty
                ? null
                : _tickerCtrl.text.trim(),
            exchange: _exchange,
            quantity: !isGoldSilver ? double.tryParse(_quantityCtrl.text) : null,
            quantityGrams:
                isGoldSilver ? double.tryParse(_quantityCtrl.text) : null,
            currentValue: double.tryParse(_currentValueCtrl.text),
            sipAmount: _mode == InvestmentMode.sip
                ? double.tryParse(_sipAmountCtrl.text)
                : null,
            sipDayOfMonth: _mode == InvestmentMode.sip
                ? int.tryParse(_sipDayCtrl.text)
                : null,
          );
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Investment added')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isSip = _mode == InvestmentMode.sip;
    final isStock = _assetType == InvestmentAssetType.stock;
    final isGoldSilver = _assetType == InvestmentAssetType.gold ||
        _assetType == InvestmentAssetType.silver;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AppInput(
            label: 'Name', hint: 'e.g. Axis Bluechip', controller: _nameCtrl, error: _nameError),
        const SizedBox(height: AppSpacing.lg),
        const Text('Asset Type',
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
        const SizedBox(height: 6),
        DropdownButtonFormField<String>(
          value: _assetType,
          decoration: InputDecoration(
            filled: true,
            fillColor: Colors.white,
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
          ),
          items: _assetTypes.entries
              .map((e) => DropdownMenuItem(value: e.key, child: Text(e.value)))
              .toList(),
          onChanged: (v) => setState(() => _assetType = v!),
        ),
        const SizedBox(height: AppSpacing.lg),
        const Text('Mode',
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
        const SizedBox(height: 6),
        DropdownButtonFormField<String>(
          value: _mode,
          decoration: InputDecoration(
            filled: true,
            fillColor: Colors.white,
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
          ),
          items: _modes.entries
              .map((e) => DropdownMenuItem(value: e.key, child: Text(e.value)))
              .toList(),
          onChanged: (v) => setState(() => _mode = v!),
        ),
        const SizedBox(height: AppSpacing.lg),
        if (isStock) ...[
          Row(
            children: [
              Expanded(
                child: AppInput(
                    label: 'Ticker', hint: 'RELIANCE', controller: _tickerCtrl),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Exchange',
                        style: TextStyle(
                            fontSize: 13, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 6),
                    DropdownButtonFormField<String?>(
                      value: _exchange,
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: Colors.white,
                        contentPadding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 10),
                        border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10)),
                      ),
                      items: const [
                        DropdownMenuItem(value: null, child: Text('None')),
                        DropdownMenuItem(value: 'NSE', child: Text('NSE')),
                        DropdownMenuItem(value: 'BSE', child: Text('BSE')),
                      ],
                      onChanged: (v) => setState(() => _exchange = v),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
        ],
        AppInput(
            label: 'Invested Amount',
            hint: '0',
            controller: _investedCtrl,
            keyboardType: TextInputType.number,
            error: _investedError),
        const SizedBox(height: AppSpacing.lg),
        AppInput(
            label: 'Current Value (optional)',
            hint: '0',
            controller: _currentValueCtrl,
            keyboardType: TextInputType.number),
        const SizedBox(height: AppSpacing.lg),
        AppInput(
            label: isGoldSilver ? 'Quantity (grams)' : 'Quantity (units)',
            hint: '0',
            controller: _quantityCtrl,
            keyboardType: TextInputType.number),
        if (isSip) ...[
          const SizedBox(height: AppSpacing.lg),
          Row(
            children: [
              Expanded(
                child: AppInput(
                    label: 'SIP Amount',
                    hint: '5000',
                    controller: _sipAmountCtrl,
                    keyboardType: TextInputType.number),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: AppInput(
                    label: 'SIP Day',
                    hint: '15',
                    controller: _sipDayCtrl,
                    keyboardType: TextInputType.number),
              ),
            ],
          ),
        ],
        const SizedBox(height: AppSpacing.xl),
        AppButton(
            label: 'Add Investment',
            onPressed: _submit,
            isLoading: _loading,
            fullWidth: true),
      ],
    );
  }
}
