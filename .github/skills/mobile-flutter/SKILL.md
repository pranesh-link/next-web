---
name: mobile-flutter
description: "Flutter mobile development for LuvVerse (mobile_flutter/). Covers Android + iOS compatibility, state management (Riverpod), auth (Google Sign-In), plugins, permissions, signing, CI, and platform-conditional code."
applyTo: "mobile_flutter/**"
---

# Mobile Flutter Development

## Architecture
- **App**: LuvVerse — Everyday for the couple
- **Bundle ID**: `link.pranaish.luvverse` (both platforms)
- **Min targets**: Android SDK 23, iOS 15.0
- **State**: Riverpod 2 + freezed models
- **Navigation**: go_router
- **Storage**: flutter_secure_storage + Drift (SQLite)
- **Auth**: Google Sign-In → backend JWT

## Platform Compatibility (MANDATORY)
Every Flutter code change must work on BOTH Android and iOS:
- **Never** import `dart:io` in files that may run on web
- Use `defaultTargetPlatform` from `package:flutter/foundation.dart` for platform checks
- Declare permissions in BOTH:
  - `ios/Runner/Info.plist` (NS*UsageDescription keys)
  - `android/app/src/main/AndroidManifest.xml` (`<uses-permission>`)
- After adding/changing plugins: run `cd ios && pod install` AND verify Gradle sync

## Auth Setup
- Android: client matched via package name + SHA-1 from `google-services.json`
- iOS: client from `GoogleService-Info.plist` + reversed client ID as URL scheme in Info.plist
- Web: client ID via meta tag in `web/index.html`
- `serverClientId` provides idToken for backend verification (non-web only)

## Signing
- **Android**: `upload-keystore.jks`, release signing via `key.properties`
- **iOS**: `DEVELOPMENT_TEAM` in `project.pbxproj`, provisioning via Apple Developer portal

## CI/CD
- `.github/workflows/flutter-build.yml` — PR checks (analyze + test + build)
- `.github/workflows/flutter-distribute.yml` — Firebase App Distribution (Android + iOS)
- **CI analyze flag**: `flutter analyze --no-fatal-infos` — warnings are **fatal** in CI even though they aren't locally
- **Local CI equivalent**: `flutter analyze --no-pub --no-fatal-infos` — run this before every push
- See `flutter-ci-gotchas` skill for common CI failure patterns

## Code Conventions
- Feature folders: `lib/features/<name>/`
- Core utilities: `lib/core/`
- Shared widgets: `lib/shared/widgets/`
- Models use freezed + json_serializable with `.g.dart` / `.freezed.dart`
- Run codegen: `dart run build_runner build --delete-conflicting-outputs`

## Google Services Files
- Android: `android/app/google-services.json`
- iOS: `ios/Runner/GoogleService-Info.plist`
- Both are gitignored sensitive files — must be present locally for builds

## Flutter Code Quality Rules

### Null Safety
- Write soundly null-safe code
- **NEVER** use `!` unless the value is guaranteed to be non-null
- Always handle nullable types properly in `fromJson` to match DB schema

### State Management (Riverpod)
- Use `FutureProvider` for async data that loads once
- Use `StateNotifierProvider` for complex mutable state
- Use `ref.invalidate()` to force a provider to refetch
- Avoid silently catching errors in providers — log or rethrow

### Code Structure
- Keep functions < 20 lines where possible
- Use `PascalCase` for classes, `camelCase` for members/variables, `snake_case` for files
- Line length: 80 characters or fewer
- Use arrow syntax for simple one-line functions
- Prefer `const` constructors wherever possible

### Widget Best Practices
- Widgets (especially `StatelessWidget`) should be immutable
- Use `const` constructors in `build()` methods to reduce rebuilds
- Break down large `build()` methods into smaller, reusable private Widget classes
- Use `ListView.builder` for long lists (lazy loading)
- Avoid expensive operations (network calls, computations) in `build()` methods

### Error Handling
- Use `try-catch` for exceptions with appropriate exception types
- **NEVER** let code fail silently — always log errors
- Use `developer.log` from `dart:developer` instead of `print`

### JSON Serialization
- Match nullable fields in models to DB schema (e.g., `String?` for nullable columns)
- Use `json_serializable` + `json_annotation` for parsing
- Run `dart run build_runner build --delete-conflicting-outputs` after model changes

### Testing
- Follow Arrange-Act-Assert pattern
- Write unit tests for domain logic and data layer
- Write widget tests for UI components
- Aim for high test coverage
- Prefer fakes/stubs over mocks

## Mutation UX Pattern (Optimistic UI)

All finance forms follow fire-and-forget: **close the modal first, run API in background**.

```dart
Future<void> _submit() async {
  if (!_validate()) return;
  // 1. Optimistic state update
  ref.read(xyzProvider.notifier).updateOptimistic(id, patch);
  // 2. Capture messenger before pop (context may be gone after)
  final messenger = ScaffoldMessenger.of(context);
  if (mounted) Navigator.pop(context);
  // 3. API in background — .catchError rolls back
  ref.read(xyzProvider.notifier).updateXyz(...).catchError((Object e) {
    ref.read(xyzProvider.notifier).updateOptimistic(id, original.toJson());
    messenger.showSnackBar(const SnackBar(content: Text('Update failed.')));
  });
}
```

Key rules:
- **Never `await` the API call inside `_submit()`** — user shouldn't wait for network
- **Capture `ScaffoldMessenger` before `Navigator.pop()`** — context is invalid after pop
- **All finance notifiers** expose `updateOptimistic(id, data)` and `removeOptimistic(id)`
- See `mobile-flutter-finance` skill for the full provider map and model field names

## Opening Device Settings

Use `url_launcher` (already in pubspec) — do **not** add `app_settings` package:

```dart
import 'package:url_launcher/url_launcher.dart';

Future<void> openNotificationSettings() async {
  try {
    final opened = await launchUrl(
      Uri.parse('app-settings:'),
      mode: LaunchMode.externalApplication,
    );
    if (!opened) {
      await launchUrl(
        Uri.parse('package:com.pranesh.luvverse'),
        mode: LaunchMode.externalApplication,
      );
    }
  } catch (_) {}
}
```
