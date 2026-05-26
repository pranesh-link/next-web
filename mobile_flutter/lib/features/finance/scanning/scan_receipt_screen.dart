import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/core/network/api_client.dart';
import 'package:luvverse/core/network/api_endpoints.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/features/finance/providers/finance_providers.dart';
import 'package:luvverse/shared/widgets/app_button.dart';
import 'package:luvverse/shared/widgets/app_card.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:convert';

/// Screen for scanning receipts via camera/gallery and creating transactions.
class ScanReceiptScreen extends ConsumerStatefulWidget {
  const ScanReceiptScreen({super.key});

  @override
  ConsumerState<ScanReceiptScreen> createState() => _ScanReceiptScreenState();
}

class _ScanReceiptScreenState extends ConsumerState<ScanReceiptScreen> {
  bool _scanning = false;
  Map<String, dynamic>? _result;
  String? _error;

  Future<void> _pickAndScan(ImageSource source) async {
    final picker = ImagePicker();
    final image = await picker.pickImage(source: source, imageQuality: 80);
    if (image == null) return;

    setState(() {
      _scanning = true;
      _error = null;
      _result = null;
    });

    try {
      final bytes = await image.readAsBytes();
      final base64Image = base64Encode(bytes);
      final mimeType = image.path.toLowerCase().endsWith('.png')
          ? 'image/png'
          : image.path.toLowerCase().endsWith('.heif') ||
                  image.path.toLowerCase().endsWith('.heic')
              ? 'image/heif'
              : 'image/jpeg';

      final api = ref.read(apiClientProvider);
      final response = await api.post<Map<String, dynamic>>(
        ApiEndpoints.scanReceipt,
        data: {
          'image': base64Image,
          'mimeType': mimeType,
        },
      );

      setState(() => _result = response['data'] as Map<String, dynamic>?);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _scanning = false);
    }
  }

  Future<void> _createTransaction() async {
    if (_result == null) return;
    try {
      final amount = (_result!['amount'] as num?)?.toDouble() ?? 0;
      final category = _result!['category'] as String? ?? 'Other';
      final description = _result!['description'] as String? ?? 'Scanned receipt';
      final accountId = _result!['accountId'] as String?;

      if (accountId == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Select an account first')),
        );
        return;
      }

      await ref.read(transactionsProvider.notifier).create(
            accountId: accountId,
            amount: amount,
            type: 'EXPENSE',
            category: category,
            date: DateTime.now(),
            description: description,
          );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Transaction created from receipt')),
        );
        setState(() => _result = null);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.colors.bg,
      appBar: AppBar(
        title: const Text('Scan Receipt'),
        backgroundColor: context.colors.bg,
        elevation: 0,
        titleTextStyle: AppTypography.pageTitle,
      ),
      body: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            AppCard(
              child: Column(
                children: [
                  Icon(Icons.receipt_long, size: 48, color: context.colors.accent),
                  const SizedBox(height: AppSpacing.md),
                  Text(
                    'Scan a receipt to automatically create a transaction',
                    style: AppTypography.body.copyWith(color: context.colors.textMuted),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: AppSpacing.xl),
                  Row(
                    children: [
                      Expanded(
                        child: AppButton(
                          label: 'Camera',
                          onPressed: () => _pickAndScan(ImageSource.camera),
                          icon: Icons.camera_alt,
                          fullWidth: true,
                        ),
                      ),
                      const SizedBox(width: AppSpacing.md),
                      Expanded(
                        child: AppButton(
                          label: 'Gallery',
                          onPressed: () => _pickAndScan(ImageSource.gallery),
                          icon: Icons.photo_library,
                          variant: ButtonVariant.secondary,
                          fullWidth: true,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
            if (_scanning)
              const Center(
                child: Column(
                  children: [
                    CircularProgressIndicator(),
                    SizedBox(height: AppSpacing.md),
                    Text('Scanning receipt with AI...'),
                  ],
                ),
              ),
            if (_error != null)
              AppCard(
                child: Row(
                  children: [
                    Icon(Icons.error_outline, color: context.colors.danger),
                    const SizedBox(width: AppSpacing.sm),
                    Expanded(
                      child: Text(_error!, style: AppTypography.small.copyWith(color: context.colors.danger)),
                    ),
                  ],
                ),
              ),
            if (_result != null) ...[
              AppCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Scanned Result', style: AppTypography.cardTitle),
                    const SizedBox(height: AppSpacing.md),
                    _ResultRow('Amount', '₹${_result!['amount'] ?? 0}'),
                    _ResultRow('Category', _result!['category'] ?? 'Unknown'),
                    _ResultRow('Description', _result!['description'] ?? ''),
                    _ResultRow('Merchant', _result!['merchant'] ?? ''),
                    const SizedBox(height: AppSpacing.lg),
                    AppButton(
                      label: 'Create Transaction',
                      onPressed: _createTransaction,
                      fullWidth: true,
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _ResultRow extends StatelessWidget {
  final String label;
  final String value;
  const _ResultRow(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 90,
            child: Text(label, style: AppTypography.small.copyWith(color: context.colors.textMuted)),
          ),
          Expanded(child: Text(value, style: AppTypography.bodyMedium)),
        ],
      ),
    );
  }
}
