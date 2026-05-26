import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
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

/// Bottom sheet form to edit an existing investment.
class EditInvestmentForm extends ConsumerStatefulWidget {
  final Investment investment;
  const EditInvestmentForm({super.key, required this.investment});

  static void show(BuildContext context, Investment investment) {
    AppModal.show(
      context: context,
      title: 'Edit Investment',
      size: ModalSize.lg,
      child: EditInvestmentForm(investment: investment),
    );
  }

  @override
  ConsumerState<EditInvestmentForm> createState() =>
      _EditInvestmentFormState();
}

class _EditInvestmentFormState extends ConsumerState<EditInvestmentForm> {
  late final TextEditingController _nameCtrl;
  late final TextEditingController _tickerCtrl;
  late final TextEditingController _investedCtrl;
  late final TextEditingController _currentValueCtrl;
  late final TextEditingController _quantityCtrl;
  late final TextEditingController _sipAmountCtrl;
  late final TextEditingController _sipDayCtrl;
  late String _assetType;
  late String _mode;
  String? _exchange;
  bool _loading = false;
  String? _nameError;
  String? _investedError;

  @override
  void initState() {
    super.initState();
    final inv = widget.investment;
    _nameCtrl = TextEditingController(text: inv.name);
    _tickerCtrl = TextEditingController(text: inv.ticker ?? '');
    _investedCtrl =
        TextEditingController(text: inv.investedAmount.toStringAsFixed(0));
    _currentValueCtrl = TextEditingController(
        text: inv.currentValue?.toStringAsFixed(0) ?? '');
    _quantityCtrl = TextEditingController(
        text: (inv.quantity ?? inv.quantityGrams)?.toString() ?? '');
    _sipAmountCtrl = TextEditingController(
        text: inv.sipAmount?.toStringAsFixed(0) ?? '');
    _sipDayCtrl =
        TextEditingController(text: inv.sipDayOfMonth?.toString() ?? '');
    _assetType = inv.assetType;
    _mode = inv.mode;
    _exchange = inv.exchange;
  }

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
      final isGoldSilver = _assetType == InvestmentAssetType.gold ||
          _assetType == InvestmentAssetType.silver;

      await ref.read(investmentsProvider.notifier).updateInvestment(
            id: widget.investment.id,
            name: _nameCtrl.text.trim(),
            assetType: _assetType,
            mode: _mode,
            investedAmount: double.parse(_investedCtrl.text),
            ticker: _tickerCtrl.text.trim().isEmpty
                ? null
                : _tickerCtrl.text.trim(),
            exchange: _exchange,
            quantity:
                !isGoldSilver ? double.tryParse(_quantityCtrl.text) : null,
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
          const SnackBar(content: Text('Investment updated')),
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
            label: 'Name', controller: _nameCtrl, error: _nameError),
        const SizedBox(height: AppSpacing.lg),
        _buildDropdown(
            'Asset Type', _assetType, _assetTypes,
            (v) => setState(() => _assetType = v!)),
        const SizedBox(height: AppSpacing.lg),
        _buildDropdown('Mode', _mode, _modes,
            (v) => setState(() => _mode = v!)),
        const SizedBox(height: AppSpacing.lg),
        if (isStock) ...[
          Row(
            children: [
              Expanded(
                child: AppInput(
                    label: 'Ticker', controller: _tickerCtrl),
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
                        fillColor: context.colors.inputBg,
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
            controller: _investedCtrl,
            keyboardType: TextInputType.number,
            error: _investedError),
        const SizedBox(height: AppSpacing.lg),
        AppInput(
            label: 'Current Value',
            controller: _currentValueCtrl,
            keyboardType: TextInputType.number),
        const SizedBox(height: AppSpacing.lg),
        AppInput(
            label: isGoldSilver ? 'Quantity (grams)' : 'Quantity (units)',
            controller: _quantityCtrl,
            keyboardType: TextInputType.number),
        if (isSip) ...[
          const SizedBox(height: AppSpacing.lg),
          Row(
            children: [
              Expanded(
                child: AppInput(
                    label: 'SIP Amount',
                    controller: _sipAmountCtrl,
                    keyboardType: TextInputType.number),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: AppInput(
                    label: 'SIP Day',
                    controller: _sipDayCtrl,
                    keyboardType: TextInputType.number),
              ),
            ],
          ),
        ],
        const SizedBox(height: AppSpacing.xl),
        AppButton(
            label: 'Save Changes',
            onPressed: _submit,
            isLoading: _loading,
            fullWidth: true),
      ],
    );
  }

  Widget _buildDropdown(String label, String value,
      Map<String, String> options, ValueChanged<String?> onChanged) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
        const SizedBox(height: 6),
        DropdownButtonFormField<String>(
          value: value,
          decoration: InputDecoration(
            filled: true,
            fillColor: context.colors.inputBg,
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            border:
                OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
          ),
          items: options.entries
              .map((e) => DropdownMenuItem(value: e.key, child: Text(e.value)))
              .toList(),
          onChanged: onChanged,
        ),
      ],
    );
  }
}
