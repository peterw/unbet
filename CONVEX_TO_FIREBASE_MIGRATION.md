# Convex to Firebase Migration Guide

This guide explains how to migrate from Convex to Firebase in your anti-gambling app.

## What's Been Created

### 1. Firebase Configuration (`/firebase/config.ts`)
- Initializes Firebase app with environment variables
- Sets up Firebase Auth and Firestore

### 2. Data Types (`/firebase/types.ts`)
- `User` interface - matches Convex user schema
- `JournalEntry` interface - matches Convex journal schema
- `JournalCategory` type - union type for journal categories

### 3. Service Functions (`/firebase/services/`)
- **auth.ts** - Authentication functions (signIn, signUp, logOut, etc.)
- **users.ts** - User CRUD operations
- **journalEntries.ts** - Journal entry CRUD operations

### 4. React Hooks (`/firebase/hooks/`)
- **useUsers.ts** - Hooks for user operations
- **useJournalEntries.ts** - Hooks for journal operations

### 5. Providers
- **FirebaseAuthProvider.tsx** - Replaces ConvexAuthProvider

## Migration Steps

### Step 1: Update Environment Variables
Add these to your `.env` or `.env.local`:
```
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

### Step 2: Update App Root Provider
In `app/_layout.tsx`, replace ConvexAuthProvider:

```tsx
// OLD
import { ConvexAuthProvider } from '@/providers/ConvexAuthProvider';

// NEW
import { FirebaseAuthProvider } from '@/providers/FirebaseAuthProvider';

// Replace <ConvexAuthProvider> with <FirebaseAuthProvider>
```

### Step 3: Update Component Imports

#### Replace Convex Hooks:
```tsx
// OLD
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useConvexAuth } from '@/providers/ConvexAuthProvider';

// NEW
import { useAuth } from '@/providers/FirebaseAuthProvider';
import { useCurrentUser, useUpdateCurrentUser } from '@/firebase/hooks/useUsers';
import { useJournalEntries, useCreateJournalEntry } from '@/firebase/hooks/useJournalEntries';
```

#### Authentication Usage:
```tsx
// OLD
const { isAuthenticated, isLoading } = useConvexAuth();

// NEW
const { user, loading, userData } = useAuth();
const isAuthenticated = !!user;
const isLoading = loading;
```

#### User Queries:
```tsx
// OLD
const user = useQuery(api.users.getCurrentUser);

// NEW
const { user, loading, error } = useCurrentUser();
```

#### User Mutations:
```tsx
// OLD
const updateUser = useMutation(api.users.updateCurrentUser);
await updateUser({ lastRelapseDate: "2025-01-01" });

// NEW
const { updateCurrentUser } = useUpdateCurrentUser();
await updateCurrentUser({ lastRelapseDate: "2025-01-01" });
```

#### Journal Entries:
```tsx
// OLD
const entries = useQuery(api.journalEntries.list);
const createEntry = useMutation(api.journalEntries.create);

// NEW
const { entries, loading, refetch } = useJournalEntries();
const { create } = useCreateJournalEntry();
```

### Step 4: Update Authentication Flow

#### Sign In:
```tsx
// OLD (using Clerk)
// Handled by Clerk components

// NEW
import { signIn } from '@/firebase/services/auth';
await signIn(email, password);
```

#### Sign Out:
```tsx
// OLD
import { useClerk } from "@clerk/clerk-expo";
const { signOut } = useClerk();

// NEW
import { logOut } from '@/firebase/services/auth';
await logOut();
```

### Step 5: Handle Real-time Updates

Firebase doesn't provide the same automatic real-time updates as Convex. You'll need to:

1. Call `refetch()` after mutations:
```tsx
const { entries, refetch } = useJournalEntries();
const { create } = useCreateJournalEntry();

const handleCreate = async () => {
  await create(content, category);
  await refetch(); // Manually refresh the list
};
```

2. Or set up Firestore listeners for real-time updates (not implemented in this migration).

### Step 6: Update Data Access Patterns

#### Timestamps:
- Convex uses ISO strings for dates
- Firebase uses Firestore Timestamps
- The service functions handle conversion automatically

#### IDs:
- Convex uses `_id` field
- Firebase uses document IDs (accessible as `id` field)

### Common Issues and Solutions

1. **Authentication State Not Persisting**: 
   - Firebase Auth persists by default
   - Check that you're not clearing storage

2. **Missing User Data**:
   - Ensure `storeUser()` is called after authentication
   - The FirebaseAuthProvider handles this automatically

3. **Type Errors**:
   - Update imports to use Firebase types
   - User type now includes `uid` instead of `tokenIdentifier`

### Testing Checklist

- [ ] User can sign up with email/password
- [ ] User can sign in
- [ ] User data persists after refresh
- [ ] Journal entries can be created
- [ ] Journal entries list updates after creation
- [ ] User profile can be updated
- [ ] Onboarding flow works correctly

### Cleanup

After successful migration:
1. Remove `/convex` directory
2. Remove Convex dependencies from package.json
3. Remove ConvexAuthProvider and related files
4. Update any remaining Convex imports