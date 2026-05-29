import 'package:any_link_preview/any_link_preview.dart';
import 'package:flutter/material.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:url_launcher/url_launcher.dart';

/// Detects URLs in message text and shows an OG-tag link preview card.
class LinkPreviewCard extends StatelessWidget {
  final String text;

  const LinkPreviewCard({super.key, required this.text});

  static final _urlRegex = RegExp(
    r'https?://[^\s<>\"]+',
    caseSensitive: false,
  );

  /// Returns the first URL found in the text, or null.
  String? get _firstUrl {
    final match = _urlRegex.firstMatch(text);
    return match?.group(0);
  }

  @override
  Widget build(BuildContext context) {
    final url = _firstUrl;
    if (url == null) return const SizedBox.shrink();

    // Validate it's a valid URL before trying preview
    if (!AnyLinkPreview.isValidLink(url)) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.only(top: AppSpacing.xs),
      child: GestureDetector(
        onTap: () => _launchUrl(url),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: AnyLinkPreview.builder(
            link: url,
            placeholderWidget: const SizedBox.shrink(),
            errorWidget: const SizedBox.shrink(),
            itemBuilder: (context, metadata, imageProvider, _) {
              return Container(
                constraints: const BoxConstraints(maxWidth: 260),
                decoration: BoxDecoration(
                  color: context.colors.bgElevated,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: context.colors.cardBorder),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (imageProvider != null)
                      ClipRRect(
                        borderRadius: const BorderRadius.vertical(
                          top: Radius.circular(8),
                        ),
                        child: Image(
                          image: imageProvider,
                          height: 120,
                          width: double.infinity,
                          fit: BoxFit.cover,
                          errorBuilder: (_, _, _) => const SizedBox.shrink(),
                        ),
                      ),
                    Padding(
                      padding: const EdgeInsets.all(AppSpacing.sm),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (metadata.title != null)
                            Text(
                              metadata.title!,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          if (metadata.desc != null) ...[
                            const SizedBox(height: 2),
                            Text(
                              metadata.desc!,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                fontSize: 11,
                                color: context.colors.textMuted,
                              ),
                            ),
                          ],
                          const SizedBox(height: 2),
                          Text(
                            Uri.parse(url).host,
                            style: TextStyle(
                              fontSize: 10,
                              color: context.colors.textMuted,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ),
    );
  }

  Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }
}
