# Package.json Updates for Firebase Migration

## Dependencies to Remove

Remove these Convex-related dependencies:
```json
"convex": "^1.x.x",
"convex-lucia-auth": "^x.x.x",
"lucia": "^3.x.x",
"@lucia-auth/adapter-sqlite": "^x.x.x"
```

## Dependencies to Add

These have already been added:
```json
"firebase": "^10.x.x",
"firebase-admin": "^12.x.x",
"@react-native-firebase/app": "^20.x.x",
"@react-native-firebase/auth": "^20.x.x",
"@react-native-firebase/firestore": "^20.x.x"
```

## Scripts to Update

Update these scripts in package.json:
```json
{
  "scripts": {
    // Remove Convex-specific scripts
    "dev:backend": "convex dev", // REMOVE
    "predev": "convex dev --until-sync", // REMOVE
    "convex:dev": "convex dev", // REMOVE
    
    // Add Firebase emulator scripts (optional)
    "firebase:emulators": "firebase emulators:start",
    "firebase:deploy": "firebase deploy"
  }
}
```

## Complete Example

Your updated dependencies section should look like:
```json
{
  "dependencies": {
    "@clerk/clerk-expo": "^2.11.0",
    "@expo/vector-icons": "^14.0.4",
    "@react-native-async-storage/async-storage": "1.23.1",
    "@react-navigation/native": "^7.0.14",
    "expo": "~52.0.25",
    "expo-auth-session": "~6.0.2",
    "expo-constants": "~17.0.5",
    "expo-crypto": "~14.0.2",
    "expo-dev-client": "~5.0.28",
    "expo-font": "~13.0.3",
    "expo-haptics": "~14.0.1",
    "expo-image": "~2.0.3",
    "expo-linking": "~7.0.5",
    "expo-localization": "~16.0.2",
    "expo-router": "~4.0.17",
    "expo-secure-store": "~14.0.0",
    "expo-splash-screen": "~0.29.28",
    "expo-status-bar": "~2.0.1",
    "expo-system-ui": "~4.0.6",
    "expo-tracking-transparency": "~5.0.1",
    "expo-web-browser": "~14.0.2",
    "firebase": "^10.x.x",
    "firebase-admin": "^12.x.x",
    "@react-native-firebase/app": "^20.x.x",
    "@react-native-firebase/auth": "^20.x.x",
    "@react-native-firebase/firestore": "^20.x.x",
    "lottie-react-native": "7.1.0",
    "mixpanel-react-native": "^3.0.6",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "react-native": "^0.77.5",
    "react-native-gesture-handler": "~2.20.2",
    "react-native-purchases": "^8.2.6",
    "react-native-reanimated": "~3.16.6",
    "react-native-safe-area-context": "4.14.0",
    "react-native-screens": "~4.5.0",
    "react-native-web": "~0.19.13"
  }
}
```

## Post-Installation Steps

1. Clean your project:
```bash
npm run clean
rm -rf node_modules
npm install
```

2. For iOS, update pods:
```bash
cd ios && pod install
```

3. For Android, sync project in Android Studio

4. Clear Metro cache:
```bash
npx expo start --clear
```