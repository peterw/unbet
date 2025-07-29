#!/bin/bash

echo "🧹 Resetting Metro bundler and clearing all caches..."

# Kill any running processes
echo "Killing running processes..."
pkill -f "react-native|metro|expo" || true

# Clear watchman
echo "Clearing watchman..."
watchman watch-del-all 2>/dev/null || true

# Clear Metro cache
echo "Clearing Metro cache..."
rm -rf node_modules/.cache
rm -rf .expo
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-* 2>/dev/null || true

# Clear React Native cache
echo "Clearing React Native cache..."
rm -rf ~/Library/Caches/com.facebook.ReactNativeBuild

# Clear npm cache
echo "Clearing npm cache..."
npm cache clean --force

# Reset babel cache
echo "Clearing babel cache..."
rm -rf .babel.json

echo "✅ All caches cleared!"
echo ""
echo "Now run:"
echo "  npm start -- --reset-cache"