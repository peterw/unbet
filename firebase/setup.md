# Firebase Setup Instructions

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter your project name
4. Enable/disable Google Analytics as needed
5. Click "Create project"

## 2. Enable Authentication

1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Enable "Email/Password" provider
4. (Optional) Enable other providers like Google, Apple, etc.

## 3. Create Firestore Database

1. Go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in production mode" or "test mode"
4. Select your region
5. Click "Create"

## 4. Set Up Security Rules

In Firestore, go to "Rules" and add:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can only read/write their own journal entries
    match /journalEntries/{entryId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
  }
}
```

## 5. Get Firebase Configuration

1. Go to Project Settings (gear icon)
2. Scroll to "Your apps"
3. Click "Web" icon to add a web app
4. Register your app with a nickname
5. Copy the configuration object

## 6. Set Environment Variables

Create or update your `.env.local` file:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

## 7. Initialize Firebase Admin (Optional - for server-side)

If you need server-side functionality:

1. Go to Project Settings > Service Accounts
2. Click "Generate new private key"
3. Save the JSON file securely
4. Set up admin SDK in your server code

## 8. Enable Firebase Services for React Native

For React Native (iOS/Android), you'll also need:

### iOS Setup:
1. Download `GoogleService-Info.plist` from Firebase Console
2. Add it to your iOS project
3. Update `ios/Podfile` if needed

### Android Setup:
1. Download `google-services.json` from Firebase Console
2. Place it in `android/app/`
3. Update `android/build.gradle` files

## 9. Test Your Setup

Run this test code to verify everything works:

```typescript
import { signIn, signUp } from '@/firebase/services/auth';
import { getCurrentUser } from '@/firebase/services/users';

// Test sign up
try {
  const user = await signUp('test@example.com', 'password123');
  console.log('User created:', user.uid);
} catch (error) {
  console.error('Sign up failed:', error);
}

// Test sign in
try {
  const user = await signIn('test@example.com', 'password123');
  console.log('User signed in:', user.uid);
} catch (error) {
  console.error('Sign in failed:', error);
}

// Test get user data
try {
  const userData = await getCurrentUser();
  console.log('User data:', userData);
} catch (error) {
  console.error('Get user failed:', error);
}
```

## Common Issues

1. **"Firebase: No Firebase App '[DEFAULT]' has been created"**
   - Ensure Firebase is initialized before using any services
   - Check that environment variables are loaded correctly

2. **"Permission denied" errors**
   - Check Firestore security rules
   - Ensure user is authenticated before accessing data

3. **Authentication not persisting**
   - Firebase Auth persists by default
   - Check if you're clearing app data/storage

4. **Real-time updates not working**
   - The current implementation uses manual refetch
   - Consider implementing Firestore listeners for real-time updates