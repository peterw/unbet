import { auth, db } from '../config';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection,
  query,
  where,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { User } from '../types';

const USERS_COLLECTION = 'users';

// Store/create a new user
export const storeUser = async (): Promise<string> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error("No authenticated user found");
    throw new Error("Called storeUser without authentication present");
  }
  
  console.log("Store user called with uid:", currentUser.uid);
  
  // Check if user document already exists
  const userRef = doc(db, USERS_COLLECTION, currentUser.uid);
  const userDoc = await getDoc(userRef);
  
  if (userDoc.exists()) {
    console.log("User already exists:", currentUser.uid);
    return currentUser.uid;
  }
  
  // Create new user document
  const userData: User = {
    uid: currentUser.uid,
    name: currentUser.displayName || currentUser.email || currentUser.uid,
    email: currentUser.email || undefined,
    onboarded: false,
    recoveryStartDate: new Date().toISOString(),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };
  
  await setDoc(userRef, userData);
  console.log("Created new user:", currentUser.uid);
  return currentUser.uid;
};

// Get current user
export const getCurrentUser = async (): Promise<User | null> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return null;
  }
  
  const userRef = doc(db, USERS_COLLECTION, currentUser.uid);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    return null;
  }
  
  return {
    id: userDoc.id,
    ...userDoc.data()
  } as User;
};

// Update current user
export const updateCurrentUser = async (updates: {
  lastRelapseDate?: string;
  recoveryStartDate?: string;
  accountabilityPartner?: string;
  blockedSites?: string[];
}): Promise<string> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("Called updateUser without authentication present");
  }
  
  const userRef = doc(db, USERS_COLLECTION, currentUser.uid);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    throw new Error("User not found");
  }
  
  // Build update object
  const updateData: any = {
    ...updates,
    onboarded: true, // Mark user as onboarded when they update their profile
    updatedAt: Timestamp.now()
  };
  
  // Remove undefined values
  Object.keys(updateData).forEach(key => 
    updateData[key] === undefined && delete updateData[key]
  );
  
  await updateDoc(userRef, updateData);
  return currentUser.uid;
};

// Dev only function to reset onboarding
export const resetOnboarding = async (): Promise<{ success: boolean }> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("Not authenticated");
  }
  
  const userRef = doc(db, USERS_COLLECTION, currentUser.uid);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    throw new Error("User not found");
  }
  
  await updateDoc(userRef, { 
    onboarded: false,
    updatedAt: Timestamp.now()
  });
  
  return { success: true };
};