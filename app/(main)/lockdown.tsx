import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Haptics } from '@/utils/haptics';

export default function LockdownScreen() {
  const router = useRouter();
  const [timeRemaining, setTimeRemaining] = useState(120); // 2 minutes in seconds

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Success);
          router.back();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEmergencyExit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.lockIcon}>
          <Ionicons name="lock-closed" size={80} color="#5B7FDE" />
        </View>

        <Text style={styles.title}>Lockdown Mode Active</Text>
        
        <Text style={styles.timer}>{formatTime(timeRemaining)}</Text>

        <Text style={styles.message}>
          Take a deep breath. Go for a walk, call a friend, or do some pushups. You've got this!
        </Text>

        <View style={styles.blockedApps}>
          <Text style={styles.blockedTitle}>Blocked Apps:</Text>
          <View style={styles.appsList}>
            <Text style={styles.appItem}>• Safari</Text>
            <Text style={styles.appItem}>• Chrome</Text>
            <Text style={styles.appItem}>• Instagram</Text>
            <Text style={styles.appItem}>• TikTok</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.emergencyButton}
        onPress={handleEmergencyExit}
      >
        <Text style={styles.emergencyText}>Emergency Exit</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockIcon: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 20,
  },
  timer: {
    fontSize: 64,
    fontWeight: '300',
    color: '#5B7FDE',
    marginBottom: 30,
  },
  message: {
    fontSize: 18,
    color: '#AAA',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  blockedApps: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    width: '100%',
  },
  blockedTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFF',
    marginBottom: 12,
  },
  appsList: {
    gap: 8,
  },
  appItem: {
    fontSize: 15,
    color: '#888',
  },
  emergencyButton: {
    marginHorizontal: 30,
    marginBottom: 40,
    padding: 16,
    alignItems: 'center',
  },
  emergencyText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '500',
  },
});