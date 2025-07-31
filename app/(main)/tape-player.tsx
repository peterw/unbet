import React, { useState, useEffect, useRef } from 'react';
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
import { Audio } from 'expo-av';
import { Asset } from 'expo-asset';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function TapePlayerScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Audio file mapping
  const audioFiles = {
    '1': require('../../assets/audio/Tape_1.mp3'),
    '2': require('../../assets/audio/Tape_2.mp3'),
    '3': require('../../assets/audio/Tape_3.mp3'),
    '4': require('../../assets/audio/Tape_4.mp3'),
    '5': require('../../assets/audio/Tape_5.mp3'),
  };

  // Dynamic tape data based on ID
  const getTapeData = (tapeId: string) => {
    const tapes = {
      '1': {
        id: '1',
        title: 'Mindful Recovery',
        subtitle: 'A guided meditation for gambling addiction',
      },
      '2': {
        id: '2',
        title: 'Breaking Free',
        subtitle: 'Overcome the chains of addiction',
      },
      '3': {
        id: '3',
        title: 'New Beginnings',
        subtitle: 'Start your journey to recovery',
      },
      '4': {
        id: '4',
        title: 'Daily Affirmations',
        subtitle: 'Positive mantras for recovery',
      },
      '5': {
        id: '5',
        title: 'Financial Freedom',
        subtitle: 'Rebuild your financial future',
      },
    };
    return tapes[tapeId as keyof typeof tapes] || tapes['1'];
  };

  const tape = getTapeData(id as string);
  const [duration, setDuration] = useState(0);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Load audio on mount and cleanup on unmount
  useEffect(() => {
    loadAudio();
    return () => {
      // Cleanup when component unmounts (user leaves page)
      if (sound) {
        sound.stopAsync().then(() => {
          sound.unloadAsync();
        });
      }
    };
  }, [tape.id]);

  const loadAudio = async () => {
    try {
      setIsLoading(true);
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      const audioFile = audioFiles[tape.id as keyof typeof audioFiles];
      const { sound: newSound } = await Audio.Sound.createAsync(
        audioFile,
        { shouldPlay: false }
      );

      const status = await newSound.getStatusAsync();
      if (status.isLoaded && status.durationMillis) {
        setDuration(status.durationMillis / 1000);
      }

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setCurrentTime(status.positionMillis / 1000);
          if (status.didJustFinish) {
            setIsPlaying(false);
            setCurrentTime(0);
          }
        }
      });

      setSound(newSound);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading audio:', error);
      setIsLoading(false);
    }
  };

  const togglePlayPause = async () => {
    if (!sound) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (isPlaying) {
      await sound.pauseAsync();
      setIsPlaying(false);
    } else {
      await sound.playAsync();
      setIsPlaying(true);
    }
  };

  const handleRewind = async () => {
    if (!sound) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newPosition = Math.max(0, currentTime - 15) * 1000;
    await sound.setPositionAsync(newPosition);
  };

  const handleForward = async () => {
    if (!sound) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newPosition = Math.min(duration, currentTime + 15) * 1000;
    await sound.setPositionAsync(newPosition);
  };

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
            style={[styles.playButton, isLoading && styles.playButtonDisabled]} 
            onPress={togglePlayPause}
            disabled={isLoading}
          >
            {isLoading ? (
              <View style={styles.loadingIndicator}>
                <Ionicons name="time-outline" size={36} color="#FFF" />
              </View>
            ) : (
              <Ionicons 
                name={isPlaying ? "pause" : "play"} 
                size={36} 
                color="#FFF" 
              />
            )}
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
    fontFamily: 'DMSans_700Bold',
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
    width: SCREEN_WIDTH * 0.5,
    height: SCREEN_WIDTH * 0.5,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#5B7FDE',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
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
  playButtonDisabled: {
    opacity: 0.5,
  },
  loadingIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});