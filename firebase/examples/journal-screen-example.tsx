// Example: How to update the Journal screen from Convex to Firebase

// ============= OLD CONVEX VERSION =============
/*
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useConvexAuth } from '@/providers/ConvexAuthProvider';

export default function JournalScreen() {
  const { isAuthenticated } = useConvexAuth();
  const entries = useQuery(api.journalEntries.list);
  const createEntry = useMutation(api.journalEntries.create);
  const deleteEntry = useMutation(api.journalEntries.remove);

  const handleCreate = async () => {
    await createEntry({
      content: "My journal entry",
      category: "Thoughts"
    });
  };

  const handleDelete = async (id: string) => {
    await deleteEntry({ id });
  };

  return (
    // UI code here
  );
}
*/

// ============= NEW FIREBASE VERSION =============
import React from 'react';
import { useAuth } from '@/providers/FirebaseAuthProvider';
import { 
  useJournalEntries, 
  useCreateJournalEntry, 
  useRemoveJournalEntry 
} from '@/firebase/hooks/useJournalEntries';

export default function JournalScreen() {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  
  const { entries, loading, error, refetch } = useJournalEntries();
  const { create, loading: creating } = useCreateJournalEntry();
  const { remove, loading: deleting } = useRemoveJournalEntry();

  const handleCreate = async () => {
    try {
      await create("My journal entry", "Thoughts");
      // Refresh the entries list after creation
      await refetch();
    } catch (error) {
      console.error("Failed to create entry:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(id);
      // Refresh the entries list after deletion
      await refetch();
    } catch (error) {
      console.error("Failed to delete entry:", error);
    }
  };

  if (loading) return <Text>Loading entries...</Text>;
  if (error) return <Text>Error: {error.message}</Text>;

  return (
    // UI code here
    <View>
      {entries.map((entry) => (
        <View key={entry.id}>
          <Text>{entry.content}</Text>
          <Button 
            title="Delete" 
            onPress={() => handleDelete(entry.id!)}
            disabled={deleting}
          />
        </View>
      ))}
      <Button 
        title="Create Entry" 
        onPress={handleCreate}
        disabled={creating}
      />
    </View>
  );
}