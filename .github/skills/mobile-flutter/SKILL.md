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
