#!/bin/bash
echo "🧹 Full reset..."

# Kill all related processes
echo "Killing running processes..."
pkill -f "react-native|metro|expo|node" || true

# Clear watchman
echo "Clearing watchman..."
watchman watch-del-all 2>/dev/null || true

# Remove node_modules
echo "Removing node_modules..."
rm -rf node_modules

# Clear all temp/cache directories
echo "Clearing all caches..."
rm -rf $TMPDIR/react-* $TMPDIR/metro-* $TMPDIR/haste-* /tmp/metro-* /tmp/haste-* 2>/dev/null || true
rm -rf ~/Library/Caches/com.facebook.ReactNativeBuild

# Clear npm cache
echo "Clearing npm cache..."
npm cache clean --force

# iOS cleanup
echo "Cleaning iOS..."
if [ -d "ios" ]; then
  cd ios
  rm -rf Pods Podfile.lock build ~/Library/Developer/Xcode/DerivedData/*
  pod cache clean --all 2>/dev/null || true
  cd ..
fi

# Android cleanup
echo "Cleaning Android..."
if [ -d "android" ]; then
  cd android
  rm -rf .gradle build
  cd ..
fi

# Remove package-lock
echo "Removing package-lock.json..."
rm -f package-lock.json

# Clear Expo cache
echo "Clearing Expo cache..."
rm -rf .expo

echo "✅ Done! Now run:"
echo "  1. npm install"
echo "  2. cd ios && pod install --repo-update && cd .."
echo "  3. npx expo start --reset-cache"