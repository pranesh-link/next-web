---
name: flutter-ci-gotchas
description: "Common Flutter CI failure patterns for LuvVerse. Covers analyze flag differences between local and CI, Dart type-safety traps in catchError, and build-breaking warnings. Use when a flutter analyze or flutter build step fails in CI but passes locally."
applyTo: "mobile_flutter/**,.github/workflows/flutter-*.yml"
---

# Flutter CI Gotchas

## Analyze flags — local vs CI differ

| Context | Command | Effect |
|---------|---------|--------|
| Local (quick check) | `flutter analyze --no-pub` | Infos + warnings shown, **none are fatal** |
| CI (`flutter-build.yml`) | `flutter analyze --no-fatal-infos` | Infos non-fatal, **warnings ARE fatal** |

**Always run the CI-equivalent command before pushing:**
```bash
cd mobile_flutter && flutter analyze --no-pub --no-fatal-infos
```
If this passes cleanly (exit 0), CI will pass.

## `catchError` return type trap (body_might_complete_normally_catch_error)

Dart's `.catchError()` handler must return a value **assignable to the Future's type parameter**.  
`Future<T>.catchError((e) { ... })` — the handler must return `T`.

### ❌ Breaks CI — handler returns void on `Future<bool>`
```dart
launchUrl(Uri.parse('app-settings:'), mode: LaunchMode.externalApplication)
    .catchError((Object _) {
  // body returns void — Future<bool> needs a bool returned!
  fallback();
});
```

### ✅ Fix option A — convert to `Future<void>` first with `.then((_) {})`
```dart
pushService.registerToken()   // Future<TokenRegistrationResult>
    .then((_) {})             // now Future<void>
    .catchError((Object e) {  // void handler is fine
  debugPrint('failed: $e');
});
```

### ✅ Fix option B — use `async/try-catch` (preferred for readability)
```dart
Future<void> _openSettings() async {
  try {
    final opened = await launchUrl(Uri.parse('app-settings:'), mode: LaunchMode.externalApplication);
    if (!opened) await launchUrl(Uri.parse('package:com.pranesh.luvverse'), mode: LaunchMode.externalApplication);
  } catch (_) {}
}
```

**Rule of thumb:** Never chain `.catchError()` on a `Future<non-void>` with a void handler. Always use `async/try-catch` or `.then((_) {}).catchError(...)`.

## Other warnings that are fatal in CI

| Warning lint ID | Cause | Fix |
|----------------|-------|-----|
| `unnecessary_underscores` | Using `__` when `_` suffices in a catch handler | Use single `_` |
| `body_might_complete_normally_catch_error` | catchError handler missing return | See above |
| `use_null_aware_elements` | `if (x != null) x` in collection | Use `?x` |
| `unnecessary_null_comparison` | Comparing non-nullable to null | Remove check |

## CI workflow reference
File: `.github/workflows/flutter-build.yml`

```yaml
- run: flutter analyze --no-fatal-infos   # warnings = exit 1
- run: flutter test --coverage
- run: flutter build apk --release        # only on push to master
- run: flutter build ios --release --no-codesign
```

Build iOS/Android jobs only run after Analyze & Test passes, and only for specific triggers (not every PR push). If analyze fails, builds are skipped entirely.

## Fast local CI simulation
```bash
cd mobile_flutter

# Step 1: exact analyze flags as CI
flutter analyze --no-pub --no-fatal-infos

# Step 2: tests (same as CI)
flutter test --coverage

# Step 3: Android build check (optional, slow)
flutter build apk --release
```
