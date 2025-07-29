import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Haptics } from '@/utils/haptics';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useEffect } from 'react';

export default function ReflectScreen() {
  const router = useRouter();
  const [reflection, setReflection] = useState('');
  const [category, setCategory] = useState<'Thoughts' | 'Feelings' | 'Gratitude' | 'Progress'>('Thoughts');
  const [isSaving, setIsSaving] = useState(false);
  
  const createEntry = useMutation(api.journalEntries.create);
  const storeUser = useMutation(api.users.store);
  const currentUser = useQuery(api.users.getCurrentUser);
  
  // Ensure user exists in Convex
  useEffect(() => {
    const ensureUser = async () => {
      console.log('[Reflect] Current user status:', currentUser);
      if (currentUser === null) {
        try {
          console.log('[Reflect] No user found, attempting to create...');
          const userId = await storeUser();
          console.log('[Reflect] User created with ID:', userId);
        } catch (error) {
          console.error('[Reflect] Failed to create user:', error);
        }
      }
    };
    ensureUser();
  }, [currentUser, storeUser]);

  const handleSave = async () => {
    if (!reflection.trim()) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSaving(true);
    
    try {
      console.log('Attempting to save journal entry...');
      await createEntry({
        content: reflection.trim(),
        category: category,
      });
      console.log('Journal entry saved successfully');
      router.back();
    } catch (error) {
      console.error('Error saving reflection:', error);
      // Check if it's an authentication error
      if (error && error.toString().includes('Not authenticated')) {
        alert('Authentication error. Please sign out and sign in again.');
      } else {
        alert('Failed to save reflection. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Reflect</Text>
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSave}
            disabled={!reflection.trim() || isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#5B7FDE" />
            ) : (
              <Text style={[styles.saveButtonText, (!reflection.trim() || isSaving) && styles.saveButtonTextDisabled]}>
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.prompt}>
            Take a moment to reflect on your journey. What are you feeling? What challenges did you face today? What are you grateful for?
          </Text>

          {/* Category Selection */}
          <View style={styles.categoryContainer}>
            <Text style={styles.categoryTitle}>Category:</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
            >
              <View style={styles.categoryButtons}>
                {(['Thoughts', 'Feelings', 'Gratitude', 'Progress'] as const).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryButton,
                      category === cat && styles.categoryButtonActive
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setCategory(cat);
                    }}
                  >
                    <Text style={[
                      styles.categoryButtonText,
                      category === cat && styles.categoryButtonTextActive
                    ]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <TextInput
            style={styles.textInput}
            multiline
            placeholder="Write your thoughts here..."
            placeholderTextColor="#666"
            value={reflection}
            onChangeText={setReflection}
            textAlignVertical="top"
          />

          <View style={styles.promptsContainer}>
            <Text style={styles.promptsTitle}>Reflection prompts:</Text>
            <View style={styles.promptsList}>
              <Text style={styles.promptItem}>• What triggered you today?</Text>
              <Text style={styles.promptItem}>• How did you handle difficult moments?</Text>
              <Text style={styles.promptItem}>• What are you proud of?</Text>
              <Text style={styles.promptItem}>• What will you do differently tomorrow?</Text>
              <Text style={styles.promptItem}>• Who or what are you grateful for?</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
  },
  saveButton: {
    padding: 4,
  },
  saveButtonText: {
    color: '#5B7FDE',
    fontSize: 17,
    fontWeight: '500',
  },
  saveButtonTextDisabled: {
    color: '#444',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  prompt: {
    fontSize: 16,
    color: '#AAA',
    lineHeight: 24,
    marginBottom: 24,
  },
  textInput: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    color: '#FFF',
    fontSize: 16,
    lineHeight: 24,
    minHeight: 200,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  promptsContainer: {
    marginTop: 32,
  },
  promptsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#5B7FDE',
    marginBottom: 12,
  },
  promptsList: {
    gap: 8,
  },
  promptItem: {
    fontSize: 15,
    color: '#888',
    lineHeight: 22,
  },
  categoryContainer: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFF',
    marginBottom: 12,
  },
  categoryScroll: {
    maxHeight: 40,
  },
  categoryButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  categoryButtonActive: {
    backgroundColor: '#5B7FDE',
    borderColor: '#5B7FDE',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#888',
  },
  categoryButtonTextActive: {
    color: '#FFF',
    fontWeight: '500',
  },
});