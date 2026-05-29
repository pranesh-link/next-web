#!/usr/bin/env bash
#
# Build and distribute Flutter APK to Firebase App Distribution.
#
# Usage: ./scripts/distribute.sh
#
# Prerequisites:
#   - Firebase CLI: npm install -g firebase-tools
#   - Logged in: firebase login
#   - ANDROID_HOME set (for APK build)
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

# Extract version from pubspec.yaml
VERSION=$(grep '^version:' pubspec.yaml | awk '{print $2}')
VERSION_NAME="${VERSION%%+*}"
BUILD_NUMBER="${VERSION##*+}"

echo "═══════════════════════════════════════════════"
echo "  LuvVerse Flutter Distribute"
echo "  Version: $VERSION_NAME ($BUILD_NUMBER)"
echo "═══════════════════════════════════════════════"

# Generate release notes from recent git commits
RELEASE_NOTES=$(git log --oneline -10 --pretty=format:"• %s" 2>/dev/null || echo "• Bug fixes and improvements")

echo ""
echo "📋 Build Summary:"
echo "$RELEASE_NOTES"
echo ""

# Step 1: Analyze
echo "🔍 Running flutter analyze..."
flutter analyze --no-fatal-infos
echo "✓ Analysis passed"

# Step 2: Test
echo ""
echo "🧪 Running tests..."
flutter test
echo "✓ Tests passed"

# Step 3: Build APK
echo ""
echo "🔨 Building release APK..."
flutter build apk --release --build-name="$VERSION_NAME" --build-number="$BUILD_NUMBER"
APK_PATH="build/app/outputs/flutter-apk/app-release.apk"

if [[ ! -f "$APK_PATH" ]]; then
  echo "❌ APK not found at $APK_PATH"
  exit 1
fi

APK_SIZE=$(du -h "$APK_PATH" | awk '{print $1}')
echo "✓ APK built: $APK_PATH ($APK_SIZE)"

# Step 4: Distribute via Firebase
echo ""
echo "🚀 Distributing to Firebase App Distribution..."

if ! command -v firebase &>/dev/null; then
  echo "❌ Firebase CLI not found. Install with: npm install -g firebase-tools"
  echo ""
  echo "Manual upload: https://console.firebase.google.com/project/luvverse-pranaish/appdistribution"
  echo "APK location: $APK_PATH"
  exit 1
fi

firebase appdistribution:distribute "$APK_PATH" \
  --app "1:613218271037:android:1037ba7132fb6bf70ecf54" \
  --groups "testers" \
  --release-notes "$RELEASE_NOTES"

echo ""
echo "═══════════════════════════════════════════════"
echo "  ✓ v$VERSION_NAME ($BUILD_NUMBER) distributed!"
echo "═══════════════════════════════════════════════"
