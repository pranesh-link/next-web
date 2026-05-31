import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:luvverse/features/chat/repositories/chat_repository.dart';
import 'package:luvverse/features/chat/services/chat_key_bootstrap.dart';
import 'package:luvverse/features/chat/services/crypto_service.dart';

class _MockCryptoService extends Mock implements CryptoService {}

class _MockChatRepository extends Mock implements ChatRepository {}

void main() {
  late _MockCryptoService crypto;
  late _MockChatRepository repo;
  late ChatKeyBootstrap bootstrap;

  setUp(() {
    crypto = _MockCryptoService();
    repo = _MockChatRepository();
    bootstrap = ChatKeyBootstrap(crypto, repo);

    // Default crypto behavior — overridden per test as needed.
    when(() => crypto.hasKeyPair()).thenAnswer((_) async => true);
    when(() => crypto.generateKeyPair()).thenAnswer((_) async {});
    when(
      () => crypto.exportPublicKeyBase64(),
    ).thenAnswer((_) async => 'pub-key');
    when(() => crypto.deriveSharedKey(any())).thenAnswer((_) async {});
    when(() => crypto.isReady).thenReturn(true);

    when(
      () => repo.uploadPublicKey(any()),
    ).thenAnswer((_) async => <String, dynamic>{});
    when(
      () => repo.uploadPublicKeyForce(any()),
    ).thenAnswer((_) async => <String, dynamic>{});
  });

  group('ChatKeyBootstrap.ensureBootstrapped', () {
    test(
      'returns true and derives shared key when partner key present',
      () async {
        when(() => repo.getPartnerPublicKeyWithVersion()).thenAnswer(
          (_) async =>
              (publicKey: 'partner-pub', keyVersion: 1, keyRotatedAt: null),
        );

        final ok = await bootstrap.ensureBootstrapped();

        expect(ok, isTrue);
        expect(bootstrap.isReady, isTrue);
        verify(() => crypto.deriveSharedKey('partner-pub')).called(1);
        verify(() => repo.uploadPublicKey('pub-key')).called(1);
      },
    );

    test('generates key pair when none exists', () async {
      when(() => crypto.hasKeyPair()).thenAnswer((_) async => false);
      when(() => repo.getPartnerPublicKeyWithVersion()).thenAnswer(
        (_) async =>
            (publicKey: 'partner-pub', keyVersion: 1, keyRotatedAt: null),
      );

      final ok = await bootstrap.ensureBootstrapped();

      expect(ok, isTrue);
      verify(() => crypto.generateKeyPair()).called(1);
    });

    test(
      'returns false (not ready) when partner key absent — no caching',
      () async {
        when(() => repo.getPartnerPublicKeyWithVersion()).thenAnswer(
          (_) async => (publicKey: null, keyVersion: null, keyRotatedAt: null),
        );

        final first = await bootstrap.ensureBootstrapped();
        expect(first, isFalse);
        expect(bootstrap.isReady, isFalse);

        // Next call should retry (partner may have signed in by then).
        when(() => repo.getPartnerPublicKeyWithVersion()).thenAnswer(
          (_) async =>
              (publicKey: 'partner-pub', keyVersion: 1, keyRotatedAt: null),
        );
        final second = await bootstrap.ensureBootstrapped();
        expect(second, isTrue);
        verify(() => repo.getPartnerPublicKeyWithVersion()).called(2);
      },
    );

    test('is idempotent — second call after success is a no-op', () async {
      when(() => repo.getPartnerPublicKeyWithVersion()).thenAnswer(
        (_) async =>
            (publicKey: 'partner-pub', keyVersion: 1, keyRotatedAt: null),
      );

      await bootstrap.ensureBootstrapped();
      await bootstrap.ensureBootstrapped();
      await bootstrap.ensureBootstrapped();

      verify(() => repo.getPartnerPublicKeyWithVersion()).called(1);
      verify(() => crypto.deriveSharedKey(any())).called(1);
    });

    test('coalesces concurrent in-flight calls', () async {
      when(() => repo.getPartnerPublicKeyWithVersion()).thenAnswer((_) async {
        await Future<void>.delayed(const Duration(milliseconds: 20));
        return (publicKey: 'partner-pub', keyVersion: 1, keyRotatedAt: null);
      });

      final results = await Future.wait([
        bootstrap.ensureBootstrapped(),
        bootstrap.ensureBootstrapped(),
        bootstrap.ensureBootstrapped(),
      ]);

      expect(results, [true, true, true]);
      verify(() => repo.getPartnerPublicKeyWithVersion()).called(1);
    });

    test('returns false on error and allows retry', () async {
      when(
        () => repo.getPartnerPublicKeyWithVersion(),
      ).thenThrow(Exception('network down'));

      final first = await bootstrap.ensureBootstrapped();
      expect(first, isFalse);
      expect(bootstrap.isReady, isFalse);

      // Recovery — retry should run again, not return cached failure.
      when(() => repo.getPartnerPublicKeyWithVersion()).thenAnswer(
        (_) async =>
            (publicKey: 'partner-pub', keyVersion: 1, keyRotatedAt: null),
      );
      final second = await bootstrap.ensureBootstrapped();
      expect(second, isTrue);
    });

    test('tolerates uploadPublicKey failure and continues', () async {
      when(
        () => repo.uploadPublicKey(any()),
      ).thenThrow(Exception('upload failed'));
      when(() => repo.getPartnerPublicKeyWithVersion()).thenAnswer(
        (_) async =>
            (publicKey: 'partner-pub', keyVersion: 1, keyRotatedAt: null),
      );

      final ok = await bootstrap.ensureBootstrapped();

      expect(ok, isTrue);
      verify(() => crypto.deriveSharedKey('partner-pub')).called(1);
    });
  });
}
