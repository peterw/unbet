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
// import Slider from '@react-native-community/slider';
// Using a simple progress bar instead of slider for now

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function TapePlayerScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(131); // 2:11 in seconds

  // Mock tape data
  const tape = {
    id: id as string,
    title: 'The Introduction',
    imageUrl: 'https://via.placeholder.com/400x400',
    duration: 131,
  };

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

        {/* Title */}
        <Text style={styles.title}>{tape.title}</Text>

        {/* Instructions */}
        <View style={styles.instructions}>
          <View style={styles.instructionItem}>
            <Ionicons name="headset" size={24} color="#FFF" />
            <Text style={styles.instructionText}>Listen with headphones</Text>
          </View>
          <View style={styles.instructionItem}>
            <Text style={styles.meditationIcon}>🧘</Text>
            <Text style={styles.instructionText}>Find a silent, relaxing environment.</Text>
          </View>
          <View style={styles.instructionItem}>
            <Text style={styles.targetIcon}>🎯</Text>
            <Text style={styles.instructionText}>Lock in.</Text>
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
            <Text style={styles.timeText}>/ {formatTime(duration)}</Text>
          </View>
        </View>

        {/* Control Buttons */}
        <View style={styles.controlButtons}>
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={handleRewind}
          >
            <View style={styles.skipButton}>
              <Ionicons name="play-back" size={20} color="#FFF" />
              <Text style={styles.skipText}>15</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.playButton}
            onPress={togglePlayPause}
          >
            <Ionicons 
              name={isPlaying ? "pause" : "play"} 
              size={32} 
              color="#FFF" 
              style={isPlaying ? {} : { marginLeft: 4 }}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.controlButton}
            onPress={handleForward}
          >
            <View style={styles.skipButton}>
              <Text style={styles.skipText}>15</Text>
              <Ionicons name="play-forward" size={20} color="#FFF" />
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
  contentContainer: {
    flex: 1,
    paddingBottom: 220, // Space for player controls
  },
  albumArtContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  albumArt: {
    width: SCREEN_WIDTH * 0.6,
    height: SCREEN_WIDTH * 0.6,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
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
    width: 2,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 1,
  },
  title: {
    fontSize: 28,
    fontFamily: 'DMSans_500Medium',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  instructions: {
    paddingHorizontal: 40,
    gap: 16,
    flex: 1,
    justifyContent: 'center',
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  instructionText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    flex: 1,
  },
  meditationIcon: {
    fontSize: 24,
    width: 24,
    textAlign: 'center',
  },
  targetIcon: {
    fontSize: 24,
    width: 24,
    textAlign: 'center',
  },
  playerContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingTop: 20,
  },
  progressContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
  },
  progressBarContainer: {
    width: '100%',
    paddingVertical: 10,
  },
  progressBarBackground: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 2,
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
    color: '#FFF',
    fontWeight: '500',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});