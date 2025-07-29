import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Haptics } from '@/utils/haptics';

const PROMPTS = [
  "I want to quit porn but I don't know where to start. Can you help me?",
  "What are some effective strategies for overcoming porn addiction?",
  "How can I deal with urges to watch porn?",
  "I keep relapsing. What can I do to stay committed to quitting?",
  "Explain the effects of porn on the brain and why it's addictive.",
  "Give me some tips for building a healthier relationship with my sexuality.",
  "How can I repair relationships damaged by my porn use?"
];

export default function ChatScreen() {
  const router = useRouter();

  const handlePromptPress = (prompt: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate to chat with selected prompt
    console.log('Selected prompt:', prompt);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Chat</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="document-text-outline" size={24} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
          >
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.promptsTitle}>Suggested Prompts</Text>

      <ScrollView 
        style={styles.promptsList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.promptsContent}
      >
        {PROMPTS.map((prompt, index) => (
          <TouchableOpacity
            key={index}
            style={styles.promptCard}
            onPress={() => handlePromptPress(prompt)}
          >
            <Text style={styles.promptText}>{prompt}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.fab}>
        <Ionicons name="arrow-up" size={24} color="#FFF" />
      </TouchableOpacity>
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
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFF',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  headerButton: {
    padding: 4,
  },
  promptsTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#5B7FDE',
    marginLeft: 20,
    marginTop: 20,
    marginBottom: 16,
  },
  promptsList: {
    flex: 1,
  },
  promptsContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  promptCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  promptText: {
    color: '#FFF',
    fontSize: 16,
    lineHeight: 24,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#5B7FDE',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});