#!/bin/bash
# Build and install LuvVerse beta APK on Android device
# Usage: ./scripts/build-android.sh [--local]
#
# After build completes, scan the QR code or open the URL on your phone to install.
# Requires: eas-cli (npm i -g eas-cli), logged in via `eas login`

set -e

cd "$(dirname "$0")/../mobile"

echo "🚀 Starting EAS Android build (beta profile)..."
echo ""

# Build and capture the JSON output
BUILD_JSON=$(eas build --profile beta --platform android --non-interactive --json 2>/dev/null)

# Extract build info
BUILD_ID=$(echo "$BUILD_JSON" | jq -r '.[0].id')
STATUS=$(echo "$BUILD_JSON" | jq -r '.[0].status')
APK_URL=$(echo "$BUILD_JSON" | jq -r '.[0].artifacts.buildUrl // empty')

echo ""
echo "✅ Build complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Status:   $STATUS"
echo "Build ID: $BUILD_ID"
echo ""

if [ -n "$APK_URL" ]; then
  echo "📲 Install URL (open on your Android device):"
  echo "$APK_URL"
  echo ""
  echo "Or scan QR code:"
  # Generate QR in terminal if qrencode is available
  if command -v qrencode &> /dev/null; then
    qrencode -t ANSIUTF8 "$APK_URL"
  else
    echo "(install qrencode for terminal QR: brew install qrencode)"
    echo ""
    echo "Expo dashboard: https://expo.dev/accounts/pranaish/projects/luvverse/builds/$BUILD_ID"
  fi
else
  echo "📲 Download from Expo dashboard:"
  echo "https://expo.dev/accounts/pranaish/projects/luvverse/builds/$BUILD_ID"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 Tip: For JS-only changes, use: eas update --branch beta --message \"description\""
