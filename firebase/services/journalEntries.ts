import { auth, db } from '../config';
import { 
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  Timestamp
} from 'firebase/firestore';
import { JournalEntry, JournalCategory } from '../types';

const JOURNAL_ENTRIES_COLLECTION = 'journalEntries';

// Create a new journal entry
export const createJournalEntry = async (
  content: string,
  category: JournalCategory
): Promise<string> => {
  const currentUser = auth.currentUser;
  console.log("Journal create - user:", currentUser?.uid);
  
  if (!currentUser) {
    console.error("No authenticated user in journal create");
    throw new Error("Not authenticated");
  }
  
  const entryData: Omit<JournalEntry, 'id'> = {
    userId: currentUser.uid,
    content,
    category,
    createdAt: Timestamp.now()
  };
  
  const docRef = await addDoc(collection(db, JOURNAL_ENTRIES_COLLECTION), entryData);
  return docRef.id;
};

// Get all journal entries for the current user
export const listJournalEntries = async (): Promise<JournalEntry[]> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.log("Journal list - no authenticated user");
    return [];
  }
  
  const q = query(
    collection(db, JOURNAL_ENTRIES_COLLECTION),
    where('userId', '==', currentUser.uid),
    orderBy('createdAt', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  const entries: JournalEntry[] = [];
  
  querySnapshot.forEach((doc) => {
    entries.push({
      id: doc.id,
      ...doc.data()
    } as JournalEntry);
  });
  
  console.log(`Journal list - returning ${entries.length} entries for user ${currentUser.uid}`);
  return entries;
};

// Get a single journal entry
export const getJournalEntry = async (id: string): Promise<JournalEntry | null> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return null;
  }
  
  const entryRef = doc(db, JOURNAL_ENTRIES_COLLECTION, id);
  const entryDoc = await getDoc(entryRef);
  
  if (!entryDoc.exists()) {
    return null;
  }
  
  const entry = {
    id: entryDoc.id,
    ...entryDoc.data()
  } as JournalEntry;
  
  // Verify the entry belongs to the current user
  if (entry.userId !== currentUser.uid) {
    return null;
  }
  
  return entry;
};

// Update a journal entry
export const updateJournalEntry = async (
  id: string,
  content: string,
  category: JournalCategory
): Promise<void> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("Not authenticated");
  }
  
  const entryRef = doc(db, JOURNAL_ENTRIES_COLLECTION, id);
  const entryDoc = await getDoc(entryRef);
  
  if (!entryDoc.exists()) {
    throw new Error("Entry not found");
  }
  
  const entry = entryDoc.data() as JournalEntry;
  
  // Verify the entry belongs to the current user
  if (entry.userId !== currentUser.uid) {
    throw new Error("Unauthorized");
  }
  
  await updateDoc(entryRef, {
    content,
    category,
    updatedAt: Timestamp.now()
  });
};

// Delete a journal entry
export const removeJournalEntry = async (id: string): Promise<void> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("Not authenticated");
  }
  
  const entryRef = doc(db, JOURNAL_ENTRIES_COLLECTION, id);
  const entryDoc = await getDoc(entryRef);
  
  if (!entryDoc.exists()) {
    throw new Error("Entry not found");
  }
  
  const entry = entryDoc.data() as JournalEntry;
  
  // Verify the entry belongs to the current user
  if (entry.userId !== currentUser.uid) {
    throw new Error("Unauthorized");
  }
  
  await deleteDoc(entryRef);
};