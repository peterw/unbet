import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  Image,
  Dimensions
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Haptics } from '@/utils/haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function TapePlayerScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // Dynamic tape data based on ID
  const getTapeData = (tapeId: string) => {
    const tapes = {
      '1': {
        id: '1',
        title: 'Mindful Recovery',
        subtitle: 'A guided meditation for gambling addiction',
        duration: 525, // 8:45
      },
      '2': {
        id: '2',
        title: 'Breaking Free',
        subtitle: 'Overcome the chains of addiction',
        duration: 750, // 12:30
      },
      '3': {
        id: '3',
        title: 'New Beginnings',
        subtitle: 'Start your journey to recovery',
        duration: 375, // 6:15
      },
      '4': {
        id: '4',
        title: 'Daily Affirmations',
        subtitle: 'Positive mantras for recovery',
        duration: 262, // 4:22
      },
      '5': {
        id: '5',
        title: 'Financial Freedom',
        subtitle: 'Rebuild your financial future',
        duration: 558, // 9:18
      },
    };
    return tapes[tapeId as keyof typeof tapes] || tapes['1'];
  };

  const tape = getTapeData(id as string);
  const duration = tape.duration;
  
  // Debug logging
  console.log('Tape ID from URL:', id);
  console.log('Tape data:', tape);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlayPause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPlaying(!isPlaying);
  };

  const handleRewind = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentTime(Math.max(0, currentTime - 15));
  };

  const handleForward = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentTime(Math.min(duration, currentTime + 15));
  };

  // Simulate playback
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && currentTime < duration) {
      interval = setInterval(() => {
        setCurrentTime(prev => Math.min(duration, prev + 1));
      }, 1000);
    } else if (currentTime >= duration) {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTime, duration]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <Ionicons name="close" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{tape.title}</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Content Container */}
      <View style={styles.contentContainer}>
        {/* Album Art */}
        <View style={styles.albumArtContainer}>
          <View style={styles.albumArt}>
            <LinearGradient
              colors={[
                '#1a1a2e',
                '#16213e', 
                '#0f3460',
                '#1a1a2e'
              ]}
              style={styles.albumArtGradient}
              start={{ x: 0.1, y: 0.1 }}
              end={{ x: 0.9, y: 0.9 }}
            >
              {/* Noise texture overlay */}
              <View style={styles.noiseContainer}>
                {[...Array(40)].map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.noiseDot,
                      {
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        opacity: 0.1 + Math.random() * 0.2,
                        transform: [{ scale: 0.5 + Math.random() * 0.8 }],
                      },
                    ]}
                  />
                ))}
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Subtitle */}
        <Text style={styles.subtitle}>{tape.subtitle}</Text>

        {/* Instructions */}
        <View style={styles.instructions}>
          <View style={styles.instructionItem}>
            <Ionicons name="headset" size={22} color="#5B7FDE" />
            <Text style={styles.instructionText}>Listen with headphones</Text>
          </View>
          <View style={styles.instructionItem}>
            <Text style={styles.meditationIcon}>🧘</Text>
            <Text style={styles.instructionText}>Find a quiet place</Text>
          </View>
          <View style={styles.instructionItem}>
            <Text style={styles.targetIcon}>🎯</Text>
            <Text style={styles.instructionText}>Focus on your recovery</Text>
          </View>
        </View>
      </View>

      {/* Player Controls - Fixed at bottom */}
      <View style={styles.playerContainer}>
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { width: `${(currentTime / duration) * 100}%` }
                ]} 
              />
            </View>
          </View>
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
            <Text style={styles.timeText}> / </Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </View>

        {/* Control Buttons */}
        <View style={styles.controlButtons}>
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={handleRewind}
          >
            <View style={styles.skipButton}>
              <Ionicons name="play-back" size={22} color="rgba(255, 255, 255, 0.9)" />
              <Text style={styles.skipText}>15</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.playButton} 
            onPress={togglePlayPause}
          >
            <Ionicons 
              name={isPlaying ? "pause" : "play"} 
              size={36} 
              color="#FFF" 
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={handleForward}
          >
            <View style={styles.skipButton}>
              <Text style={styles.skipText}>15</Text>
              <Ionicons name="play-forward" size={22} color="rgba(255, 255, 255, 0.9)" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'DMSans_500Medium',
    color: '#FFF',
    flex: 1,
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1,
    paddingBottom: 240, // Increased padding to prevent overlap
  },
  albumArtContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  albumArt: {
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.7,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#5B7FDE',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 20,
  },
  albumArtGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  noiseContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  noiseDot: {
    position: 'absolute',
    width: 3,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 1.5,
  },
  tapeCenterIcon: {
    fontSize: 64,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 40,
    lineHeight: 24,
  },
  instructions: {
    paddingHorizontal: 40,
    gap: 20,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  instructionText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    flex: 1,
    fontFamily: 'DMSans_400Regular',
  },
  meditationIcon: {
    fontSize: 20,
    width: 20,
    textAlign: 'center',
  },
  targetIcon: {
    fontSize: 20,
    width: 20,
    textAlign: 'center',
  },
  playerContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    paddingHorizontal: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    paddingTop: 20,
  },
  progressContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  progressBarContainer: {
    width: '100%',
    paddingVertical: 10,
  },
  progressBarBackground: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#5B7FDE',
    borderRadius: 4,
    shadowColor: '#5B7FDE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    gap: 4,
  },
  timeText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'DMSans_400Regular',
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
  },
  controlButton: {
    padding: 8,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  skipText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#5B7FDE',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#5B7FDE',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 15,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
});