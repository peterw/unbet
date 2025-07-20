import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import { format, parseISO } from 'date-fns';

export default function DescribeScreen() {
  const [description, setDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const router = useRouter();
  const user = useQuery(api.users.getCurrentUser);
  const createTextAnalysisJob = useMutation(api.analyse.createTextAnalysisJob);
  const { selectedDate } = useLocalSearchParams<{ selectedDate: string }>();

  // Analytics
  const analytics = useAnalytics();

  useEffect(() => {
    analytics.track({ name: 'Describe Viewed' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Please describe your meal');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'Please sign in to add a protein entry');
      return;
    }

    try {
      analytics.track({ name: 'Describe Analyze Attempt' });
      setIsAnalyzing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const localDate = selectedDate || format(new Date(), 'yyyy-MM-dd');
      const localTime = format(new Date(), 'HH:mm:ss.SSS');
      const entryDate = `${localDate}T${localTime}`;

      await createTextAnalysisJob({
        description: description.trim(),
        userId: user._id,
        date: entryDate
      });

      setIsAnalyzing(false);
      analytics.track({ name: 'Describe Analyze Success' });
      router.back();
    } catch (error) {
      setIsAnalyzing(false);
      analytics.track({ name: 'Describe Analyze Failure', properties: { error: (error as Error).message ?? 'unknown' } });
      Alert.alert(
        "Error",
        "An error occurred while analyzing your meal. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Describe Your Meal</Text>
        <View style={styles.headerButton} />
      </View>

      <View style={styles.content}>
        <TextInput
          style={styles.input}
          placeholder="Describe your meal in detail (e.g., '2 scrambled eggs with cheese, 2 slices of whole wheat toast')"
          value={description}
          placeholderTextColor="#666"
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          maxLength={500}
          autoFocus
        />

        <TouchableOpacity
          style={[
            styles.submitButton,
            !description.trim() && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={!description.trim() || isAnalyzing}
        >
          {isAnalyzing ? (
            <ActivityIndicator color="white" />
          ) : (
            <View style={styles.submitButtonContent}>
              <Ionicons name="sparkles-outline" size={24} color="white" />
              <Text style={styles.submitButtonText}>Analyze</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: Colors.light.secondaryButtonBackground,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 