import { Timestamp } from 'firebase/firestore';

export interface User {
  id?: string;
  uid: string; // Firebase Auth UID
  name?: string;
  email?: string;
  onboarded: boolean;
  // Anti-gambling specific fields
  lastRelapseDate?: string;
  recoveryStartDate?: string;
  accountabilityPartner?: string;
  blockedSites?: string[];
  // Monthly challenge tracking
  currentMonthlyChallenge?: {
    month: string; // e.g., "2025-01"
    joinedAt: string; // ISO date string
    completed: boolean;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type JournalCategory = "Thoughts" | "Feelings" | "Gratitude" | "Progress";

export interface JournalEntry {
  id?: string;
  userId: string; // Firebase Auth UID
  content: string;
  category: JournalCategory;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}