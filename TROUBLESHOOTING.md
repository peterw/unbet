# Troubleshooting Guide

## Steps to Fix and Get the App Working

Follow these in order—start from a clean slate. Run everything from your project root (`/Users/peter/Desktop/projects.nosync/anti-gambling`).

### 1. Update Your Environment Tools

- **Ensure Node is v18+** (Expo 52 recommends it): `node -v`. If not, install via nvm or brew.
- **Update npm**: `npm install -g npm@latest`.
- **Update CocoaPods** (critical for pod errors): `sudo gem install cocoapods` (may need Ruby update via `brew install ruby` if on macOS).
- **Update Expo CLI**: `npm install -g expo-cli@latest`.
- **Clean global caches**: `pod cache clean --all && npm cache clean --force`.

### 2. Fix Dependency Versions

- **Run Expo's diagnostic**: `npx expo doctor`. This will flag mismatches.
- **Upgrade to match expectations**: `npx expo install --fix`. This auto-updates packages like expo, react-native, expo-router, etc.
- **If using OpenAI**: Ensure it's the JS package (`npm install openai@latest`). If it's `react-native-openai` or similar native wrapper, confirm compatibility with Expo 52—may require prebuild: `npx expo prebuild --clean`.
- **Reinstall all deps**: `rm -rf node_modules package-lock.json && npm install`.

### 3. Thorough Cache Reset (Improved Script)

Your `reset-metro.sh` is solid, but expand it for completeness. Create/update `full-reset.sh` in project root:

```bash
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
```

- **Make executable**: `chmod +x full-reset.sh && ./full-reset.sh`.
- **Then**: `npm install && cd ios && pod install --repo-update && cd ..`.

### 4. Resolve Pod and Xcode Issues

- **If "openai" path error persists**: Check Podfile for any manual `pod 'openai'` lines—remove if it's not a native pod. Search node_modules for "openai" and ensure it's not mislinked. If it's a custom package, add to package.json and reinstall.
- **For missing xcconfig**: After `pod install`, open Xcode (`open ios/Unbet.xcworkspace`), go to Project > Info > Configurations, and ensure Debug/Release point to the generated Pods configs. Clean build folder: Shift+Cmd+K.
- **Ignore "CocoaPods did not set base configuration" warning** if custom configs exist—it's harmless.
- **Build in Xcode**: Select scheme "Unbet > Debug > iOS Simulator", build (Cmd+B). If fails, check build logs for specifics.

### 5. Start the App with Fresh Bundle

- `npx expo start --reset-cache --ios` (or `--android`).
- **If "_interopRequireDefault" lingers**: Add/update `.babelrc` or `babel.config.js`:

```javascript
module.exports = {
  presets: ['babel-preset-expo'],
  plugins: ['@babel/plugin-transform-runtime'],
};
```

Then reset cache again.

### 6. Prevention for Future Issues

- **Use Yarn instead of npm** for faster/consistent installs: `npm install -g yarn && yarn install`.
- **Lock versions**: After fixes, commit `package.json` and `Podfile.lock`.
- **Test incrementally**: After adding packages, run `expo doctor` and build.
- **If native modules are heavy** (e.g., FBSDK, RevenueCat), consider Expo's development builds (`expo run:ios`) over full prebuild.

### Resources

- [Expo docs on upgrades](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/)
- [React Native troubleshooting guide](https://reactnative.dev/docs/troubleshooting)

If these don't resolve it, share the full stack trace from the latest error or your `package.json`—it might pinpoint a bad package. Hang in there; once aligned, RN/Expo is smooth.

## Common Issues and Solutions

### App Stuck on Splash Screen

If the app is stuck on the splash/launch screen:

1. **Check Metro bundler**: Ensure Metro is running and accessible
2. **Clear caches**: Run the full reset script above
3. **Check environment variables**: Ensure all required env vars are set in `.env`
4. **Check for errors**: Look at the Metro bundler console for any errors
5. **Rebuild**: Sometimes a clean rebuild fixes splash screen issues

### PIF Transfer Session Error in Xcode

If you see "unable to initiate PIF transfer session":

1. Kill Xcode processes: `pkill -f "Xcode|xcodebuild"`
2. Clear derived data: `rm -rf ~/Library/Developer/Xcode/DerivedData/*`
3. Clear Xcode caches: `rm -rf ~/Library/Caches/com.apple.dt.Xcode`
4. Disable built-in SCM: `defaults write com.apple.dt.Xcode IDEPackageSupportUseBuiltinSCM -bool NO`
5. Restart Xcode and open the `.xcworkspace` file