import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Switch, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Haptics } from '@/utils/haptics';

const APPS = [
  { id: 'safari', name: 'Safari', icon: 'globe-outline' },
  { id: 'chrome', name: 'Chrome', icon: 'logo-chrome' },
  { id: 'instagram', name: 'Instagram', icon: 'logo-instagram' },
  { id: 'tiktok', name: 'TikTok', icon: 'musical-notes-outline' },
  { id: 'twitter', name: 'Twitter', icon: 'logo-twitter' },
  { id: 'youtube', name: 'YouTube', icon: 'logo-youtube' },
  { id: 'reddit', name: 'Reddit', icon: 'logo-reddit' },
];

const DURATIONS = [
  { label: '2 minutes', value: 2 },
  { label: '5 minutes', value: 5 },
  { label: '10 minutes', value: 10 },
  { label: '30 minutes', value: 30 },
  { label: '1 hour', value: 60 },
];

export default function LockdownSettingsScreen() {
  const router = useRouter();
  const [selectedDuration, setSelectedDuration] = useState(2);
  const [blockedApps, setBlockedApps] = useState({
    safari: true,
    chrome: true,
    instagram: true,
    tiktok: true,
    twitter: false,
    youtube: false,
    reddit: false,
  });

  const toggleApp = (appId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBlockedApps(prev => ({
      ...prev,
      [appId]: !prev[appId as keyof typeof prev]
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
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
        <Text style={styles.title}>Lockdown Settings</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Duration</Text>
          <View style={styles.durationGrid}>
            {DURATIONS.map((duration) => (
              <TouchableOpacity
                key={duration.value}
                style={[
                  styles.durationButton,
                  selectedDuration === duration.value && styles.durationButtonActive
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedDuration(duration.value);
                }}
              >
                <Text style={[
                  styles.durationText,
                  selectedDuration === duration.value && styles.durationTextActive
                ]}>
                  {duration.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Blocked Apps</Text>
          <View style={styles.appsList}>
            {APPS.map((app) => (
              <View key={app.id} style={styles.appItem}>
                <View style={styles.appInfo}>
                  <Ionicons name={app.icon as any} size={24} color="#FFF" />
                  <Text style={styles.appName}>{app.name}</Text>
                </View>
                <Switch
                  value={blockedApps[app.id as keyof typeof blockedApps]}
                  onValueChange={() => toggleApp(app.id)}
                  trackColor={{ false: '#3A3A3A', true: '#5B7FDE' }}
                  thumbColor="#FFF"
                />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
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
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#FFF',
    marginBottom: 16,
  },
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  durationButton: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  durationButtonActive: {
    backgroundColor: '#5B7FDE',
    borderColor: '#5B7FDE',
  },
  durationText: {
    color: '#AAA',
    fontSize: 16,
  },
  durationTextActive: {
    color: '#FFF',
  },
  appsList: {
    gap: 12,
  },
  appItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  appInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  appName: {
    fontSize: 16,
    color: '#FFF',
  },
});