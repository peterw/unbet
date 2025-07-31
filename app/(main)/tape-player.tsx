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
  const [duration, setDuration] = useState(131); // Default duration

  // Tape data based on ID
  const tapes: Record<string, any> = {
    '1': { title: 'The Introduction', duration: 131 },
    '2': { title: 'Breaking Free', duration: 750 }, // 12:30
    '3': { title: 'New Beginnings', duration: 375 }, // 6:15
    '4': { title: 'Daily Affirmations', duration: 262 }, // 4:22
    '5': { title: 'Financial Freedom', duration: 558 }, // 9:18
  };
  
  const tape = tapes[id as string] || tapes['1'];
  
  // Update duration when tape changes
  useEffect(() => {
    setDuration(tape.duration);
    setCurrentTime(0);
    setIsPlaying(false);
  }, [id]);

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
        <View style={styles.headerSpacer} />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'DMSans_500Medium',
    color: '#FFF',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 48, // Same width as close button to center the title
    height: 48,
  },
  closeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  contentContainer: {
    flex: 1,
    paddingBottom: 320, // More space for player controls
  },
  albumArtContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  albumArt: {
    width: SCREEN_WIDTH * 0.55,
    height: SCREEN_WIDTH * 0.55,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#5B7FDE',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 16,
    borderWidth: 2,
    borderColor: 'rgba(91, 127, 222, 0.3)',
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
    letterSpacing: -0.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  instructions: {
    paddingHorizontal: 30,
    gap: 12,
    marginTop: 10,
    marginBottom: 20,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  instructionText: {
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255, 255, 255, 0.9)',
    flex: 1,
    lineHeight: 20,
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
    left: 20,
    right: 20,
    backgroundColor: 'rgba(20, 20, 30, 0.95)',
    paddingTop: 16,
    paddingBottom: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressContainer: {
    backgroundColor: 'rgba(40, 40, 55, 0.8)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  progressBarContainer: {
    width: '100%',
    paddingVertical: 10,
  },
  progressBarBackground: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#5B7FDE',
    borderRadius: 3,
    shadowColor: '#5B7FDE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    gap: 4,
  },
  timeText: {
    fontSize: 15,
    fontFamily: 'DMSans_500Medium',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 50,
    paddingHorizontal: 20,
  },
  controlButton: {
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  skipText: {
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
    color: '#FFF',
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#5B7FDE',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#5B7FDE',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
});