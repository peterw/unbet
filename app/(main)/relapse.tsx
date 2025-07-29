import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Haptics } from '@/utils/haptics';

export default function RelapseScreen() {
  const router = useRouter();

  const handleRestartMilestone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    // Reset timer and navigate back
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity 
        style={styles.closeButton}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.back();
        }}
      >
        <Ionicons name="close" size={28} color="#FFF" />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.brainContainer}>
          <View style={styles.brainPlaceholder} />
        </View>

        <Text style={styles.title}>Hey, It's completely okay.</Text>
        
        <Text style={styles.subtitle}>
          You made it 11 Hours. Don't let one bad moment wash away the hard work you've put in.
        </Text>

        <Text style={styles.stats}>
          358 people have restarted their journey today. Join them and come back stronger. You got this.
        </Text>
      </View>

      <TouchableOpacity style={styles.restartButton} onPress={handleRestartMilestone}>
        <Text style={styles.restartButtonText}>Restart Milestone</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 1,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brainContainer: {
    width: 180,
    height: 180,
    marginBottom: 40,
  },
  brainPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#444',
    borderRadius: 90,
    opacity: 0.3,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    color: '#AAA',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 30,
  },
  stats: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  restartButton: {
    backgroundColor: '#8B5FDE',
    paddingVertical: 18,
    paddingHorizontal: 60,
    borderRadius: 30,
    marginBottom: 40,
    marginHorizontal: 30,
  },
  restartButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});