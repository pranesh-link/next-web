import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/features/chat/services/encrypted_file_loader.dart';

/// Displays an encrypted image: fetches, decrypts, renders from memory.
class EncryptedImageBubble extends ConsumerStatefulWidget {
  final String filePath;
  final bool isMe;

  const EncryptedImageBubble({
    super.key,
    required this.filePath,
    required this.isMe,
  });

  @override
  ConsumerState<EncryptedImageBubble> createState() =>
      _EncryptedImageBubbleState();
}

class _EncryptedImageBubbleState extends ConsumerState<EncryptedImageBubble> {
  Uint8List? _bytes;
  bool _loading = true;
  bool _error = false;

  @override
  void initState() {
    super.initState();
    _loadImage();
  }

  Future<void> _loadImage() async {
    final loader = ref.read(encryptedFileLoaderProvider);
    final bytes = await loader.load(widget.filePath);
    if (!mounted) return;
    setState(() {
      _bytes = bytes;
      _loading = false;
      _error = bytes == null;
    });
  }

  void _openFullScreen(BuildContext context) {
    if (_bytes == null) return;
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => _FullScreenDecryptedImage(bytes: _bytes!),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return _buildShimmer();
    if (_error || _bytes == null) return _buildError();

    return GestureDetector(
      onTap: () => _openFullScreen(context),
      child: ClipRRect(
        borderRadius: BorderRadius.only(
          topLeft: const Radius.circular(16),
          topRight: const Radius.circular(16),
          bottomLeft: Radius.circular(widget.isMe ? 16 : 4),
          bottomRight: Radius.circular(widget.isMe ? 4 : 16),
        ),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 240, maxHeight: 300),
          child: Image.memory(_bytes!, fit: BoxFit.cover),
        ),
      ),
    );
  }

  Widget _buildShimmer() {
    return Container(
      width: 200,
      height: 150,
      decoration: BoxDecoration(
        color: Colors.grey.shade200,
        borderRadius: BorderRadius.circular(AppSpacing.sm),
      ),
      child: const Center(child: CircularProgressIndicator(strokeWidth: 2)),
    );
  }

  Widget _buildError() {
    return Container(
      width: 200,
      height: 100,
      decoration: BoxDecoration(
        color: Colors.grey.shade100,
        borderRadius: BorderRadius.circular(AppSpacing.sm),
      ),
      child: const Center(
        child: Icon(Icons.broken_image, color: Colors.grey, size: 40),
      ),
    );
  }
}

class _FullScreenDecryptedImage extends StatelessWidget {
  final Uint8List bytes;
  const _FullScreenDecryptedImage({required this.bytes});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: Center(child: InteractiveViewer(child: Image.memory(bytes))),
    );
  }
}
