import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/core/network/api_client.dart';
import 'package:luvverse/core/network/api_endpoints.dart';
import 'package:luvverse/core/theme/app_colors.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/features/finance/providers/finance_providers.dart';
import 'package:luvverse/shared/widgets/app_button.dart';
import 'package:luvverse/shared/widgets/app_card.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:convert';

/// Screen for scanning loan/deposit schedules via camera/gallery.
class ScanScheduleScreen extends ConsumerStatefulWidget {
  const ScanScheduleScreen({super.key});

  @override
  ConsumerState<ScanScheduleScreen> createState() => _ScanScheduleScreenState();
}

class _ScanScheduleScreenState extends ConsumerState<ScanScheduleScreen> {
  bool _scanning = false;
  List<Map<String, dynamic>>? _schedule;
  String? _error;

  Future<void> _pickAndScan(ImageSource source) async {
    final picker = ImagePicker();
    final image = await picker.pickImage(source: source, imageQuality: 80);
    if (image == null) return;

    setState(() {
      _scanning = true;
      _error = null;
      _schedule = null;
    });

    try {
      final bytes = await image.readAsBytes();
      final base64Image = base64Encode(bytes);
      final mimeType = image.path.toLowerCase().endsWith('.png')
          ? 'image/png'
          : 'image/jpeg';

      final api = ref.read(apiClientProvider);
      final response = await api.post<Map<String, dynamic>>(
        ApiEndpoints.scanSchedule,
        data: {
          'image': base64Image,
          'mimeType': mimeType,
        },
      );

      final data = response['data'];
      if (data is List) {
        setState(() => _schedule = data.cast<Map<String, dynamic>>());
      } else if (data is Map && data['schedule'] is List) {
        setState(() => _schedule =
            (data['schedule'] as List).cast<Map<String, dynamic>>());
      }
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _scanning = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: const Text('Scan Schedule'),
        backgroundColor: AppColors.bg,
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
                  const Icon(Icons.table_chart, size: 48, color: AppColors.accent),
                  const SizedBox(height: AppSpacing.md),
                  Text(
                    'Scan a loan or deposit schedule document',
                    style: AppTypography.body.copyWith(color: AppColors.textMuted),
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
                    Text('Scanning schedule with AI...'),
                  ],
                ),
              ),
            if (_error != null)
              AppCard(
                child: Row(
                  children: [
                    const Icon(Icons.error_outline, color: AppColors.danger),
                    const SizedBox(width: AppSpacing.sm),
                    Expanded(
                      child: Text(_error!,
                          style: AppTypography.small.copyWith(color: AppColors.danger)),
                    ),
                  ],
                ),
              ),
            if (_schedule != null)
              Expanded(
                child: AppCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Extracted Schedule (${_schedule!.length} entries)',
                          style: AppTypography.cardTitle),
                      const SizedBox(height: AppSpacing.md),
                      Expanded(
                        child: ListView.builder(
                          itemCount: _schedule!.length,
                          itemBuilder: (_, i) {
                            final row = _schedule![i];
                            return Padding(
                              padding:
                                  const EdgeInsets.only(bottom: AppSpacing.xs),
                              child: Row(
                                children: [
                                  SizedBox(
                                    width: 30,
                                    child: Text('${i + 1}',
                                        style: AppTypography.xs),
                                  ),
                                  Expanded(
                                    child: Text(
                                      row.entries
                                          .map((e) => '${e.key}: ${e.value}')
                                          .join(' | '),
                                      style: AppTypography.xs,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
