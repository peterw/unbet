import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/FirebaseAuthProvider';
import { 
  createJournalEntry,
  listJournalEntries,
  getJournalEntry,
  updateJournalEntry,
  removeJournalEntry
} from '../services/journalEntries';
import { JournalEntry, JournalCategory } from '../types';

// Hook to list journal entries
export const useJournalEntries = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchEntries = async () => {
      if (!user) {
        setEntries([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const journalEntries = await listJournalEntries();
        setEntries(journalEntries);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, [user]);

  const refetch = async () => {
    setLoading(true);
    try {
      const journalEntries = await listJournalEntries();
      setEntries(journalEntries);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { entries, loading, error, refetch };
};

// Hook to get a single journal entry
export const useJournalEntry = (id: string | null) => {
  const { user } = useAuth();
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchEntry = async () => {
      if (!user || !id) {
        setEntry(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const journalEntry = await getJournalEntry(id);
        setEntry(journalEntry);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchEntry();
  }, [user, id]);

  return { entry, loading, error };
};

// Hook to create journal entry
export const useCreateJournalEntry = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const create = async (content: string, category: JournalCategory) => {
    try {
      setLoading(true);
      setError(null);
      const entryId = await createJournalEntry(content, category);
      return entryId;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { create, loading, error };
};

// Hook to update journal entry
export const useUpdateJournalEntry = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const update = async (id: string, content: string, category: JournalCategory) => {
    try {
      setLoading(true);
      setError(null);
      await updateJournalEntry(id, content, category);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { update, loading, error };
};

// Hook to delete journal entry
export const useRemoveJournalEntry = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const remove = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await removeJournalEntry(id);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { remove, loading, error };
};