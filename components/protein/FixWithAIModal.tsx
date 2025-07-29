import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Haptics } from '@/utils/haptics';

type Props = {
  entryId: Id<"proteinEntries">;
  onClose: () => void;
  onSuccess: () => void;
};

export function FixWithAIModal({ entryId, onClose, onSuccess }: Props) {
  const [instruction, setInstruction] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const createFixJob = useMutation(api.analyse.createFixJob);

  const handleSubmit = async () => {
    if (!instruction.trim()) {
      Alert.alert('Error', 'Please describe the changes needed');
      return;
    }

    try {
      setIsProcessing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      await createFixJob({
        entryId,
        instruction: instruction.trim(),
      });

      onSuccess();
      onClose();
    } catch (error) {
      setIsProcessing(false);
      Alert.alert(
        "Error",
        "An error occurred while updating your entry. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  return (
    <View style={styles.overlay}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color="black" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Fix with AI</Text>
              <View style={styles.headerButton} />
            </View>

            <View style={styles.content}>
              <TextInput
                style={styles.input}
                placeholder="Describe what needs to be fixed (e.g., 'it's chicken not cheese')"
                value={instruction}
                placeholderTextColor="#666"
                onChangeText={setInstruction}
                multiline
                numberOfLines={4}
                maxLength={500}
                autoFocus
              />
            </View>

            <View style={styles.footer}>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  !instruction.trim() && styles.submitButtonDisabled
                ]}
                onPress={handleSubmit}
                disabled={!instruction.trim() || isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <View style={styles.submitButtonContent}>
                    <Ionicons name="sparkles-outline" size={24} color="white" />
                    <Text style={styles.submitButtonText}>Fix Entry</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
  },
  container: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
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
  },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
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
