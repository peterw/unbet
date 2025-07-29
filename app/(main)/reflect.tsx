import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Haptics } from '@/utils/haptics';

export default function ReflectScreen() {
  const router = useRouter();
  const [reflection, setReflection] = useState('');

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Save reflection
    console.log('Saving reflection:', reflection);
    router.back();
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
            disabled={!reflection.trim()}
          >
            <Text style={[styles.saveButtonText, !reflection.trim() && styles.saveButtonTextDisabled]}>
              Save
            </Text>
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
});