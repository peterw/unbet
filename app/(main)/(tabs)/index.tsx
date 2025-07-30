import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, TouchableWithoutFeedback, Dimensions as RNDimensions, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  withSpring,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Haptics } from '../../../utils/haptics';
import { BlurView } from 'expo-blur';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useConvexAuth } from '@/providers/SimpleConvexAuth';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = RNDimensions.get('window');

// Motivational quotes
const QUOTES = [
  "Don't just imagine doing things someday. Do them now.",
  "Every moment is a fresh beginning.",
  "The best time to start was yesterday. The next best time is now.",
  "Progress, not perfection.",
  "You are stronger than your urges.",
  "One day at a time.",
  "Your future self will thank you.",
  "Break the chain, build a better life."
];

export default function HomeScreen() {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showPanicModal, setShowPanicModal] = useState(false);
  const [currentQuote] = useState(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  
  // Get user data from Convex
  const user = useQuery(api.users.getCurrentUser, isAuthenticated ? {} : 'skip');
  const isLoading = isAuthenticated && user === undefined;
  
  // Timer state
  const [timer, setTimer] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Calculate real streak data
  const getStreakStartDate = () => {
    if (!user) return new Date();
    
    // If user has no relapses, use recovery start date
    if (!user.lastRelapseDate && user.recoveryStartDate) {
      return new Date(user.recoveryStartDate);
    }
    
    // If user has relapsed, use day after last relapse
    if (user.lastRelapseDate) {
      const lastRelapse = new Date(user.lastRelapseDate);
      lastRelapse.setDate(lastRelapse.getDate() + 1);
      return lastRelapse;
    }
    
    // Fallback to today
    return new Date();
  };

  // Update timer every second
  useEffect(() => {
    if (!user) return;
    
    const calculateTimer = () => {
      const now = new Date();
      const streakStart = getStreakStartDate();
      const diff = now.getTime() - streakStart.getTime();
      
      // Ensure we don't show negative time
      const totalSeconds = Math.max(0, Math.floor(diff / 1000));
      
      const days = Math.floor(totalSeconds / (24 * 60 * 60));
      const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
      const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
      const seconds = totalSeconds % 60;
      
      return { days, hours, minutes, seconds };
    };
    
    // Set initial value
    setTimer(calculateTimer());
    
    const interval = setInterval(() => {
      setTimer(calculateTimer());
    }, 1000);
    
    return () => clearInterval(interval);
  }, [user]);

  const openActionMenu = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowActionMenu(true);
  }, []);


  const handlePanic = () => {
    setShowActionMenu(false);
    setShowPanicModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  const handleAICoach = () => {
    setShowActionMenu(false);
    router.push('/chat');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleRelapse = () => {
    setShowActionMenu(false);
    router.push('/relapse');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  const handleReflect = () => {
    setShowActionMenu(false);
    router.push('/(main)/(tabs)/journal');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleStartLockdown = () => {
    setShowPanicModal(false);
    router.push('/lockdown');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  const handleLockdownSettings = () => {
    setShowPanicModal(false);
    router.push('/settings/lockdown');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // Calculate progress percentage (mock data - should come from user data)
  const progress = 16; // 16% rewired
  
  // 3D Brain component removed

  // Handle loading state
  if (!isAuthenticated || isLoading) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={[styles.container, styles.loadingContainer]}>
          <ActivityIndicator size="large" color="#5B7FDE" />
          <Text style={styles.loadingText}>
            {!isAuthenticated ? 'Authenticating...' : 'Loading...'}
          </Text>
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* Stars background */}
        <View style={styles.starsContainer}>
          {[...Array(200)].map((_, i) => {
            // Generate consistent star positions based on index
            const x = ((i * 137.5) % 100); // Golden angle distribution
            const y = ((i * 23.7) % 100);
            const size = 0.3 + (i % 5) * 0.3; // Vary sizes
            const opacity = 0.1 + (i % 10) * 0.05; // Vary opacity
            
            return (
              <View
                key={i}
                style={[
                  styles.star,
                  {
                    left: `${x}%`,
                    top: `${y}%`,
                    width: size * 2,
                    height: size * 2,
                    opacity: opacity,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Quote */}
        <Text style={styles.quote}>{currentQuote}</Text>

        {/* Timer */}
        <View style={styles.timerContainer}>
          <View style={styles.timerItem}>
            <Text style={styles.timerNumber}>{timer.days}</Text>
            <Text style={styles.timerLabel}>days</Text>
          </View>
          <View style={styles.timerItem}>
            <Text style={styles.timerNumber}>{timer.hours}</Text>
            <Text style={styles.timerLabel}>hours</Text>
          </View>
          <View style={styles.timerItem}>
            <Text style={styles.timerNumber}>{timer.minutes}</Text>
            <Text style={styles.timerLabel}>minutes</Text>
          </View>
          <View style={styles.timerItem}>
            <Text style={styles.timerNumber}>{timer.seconds}</Text>
            <Text style={styles.timerLabel}>seconds</Text>
          </View>
        </View>

        <Text style={styles.statusText}>since last relapse</Text>
        <Text style={styles.progressText}>{progress}% rewired</Text>

        {/* 3D Brain */}

        {/* Milestones Coin Button */}
        <TouchableOpacity 
          style={styles.coinButton} 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/milestones');
          }} 
          activeOpacity={0.8}
        >
          <View style={styles.coinIcon}>
            <Text style={styles.coinText}>$</Text>
          </View>
        </TouchableOpacity>

        {/* Floating Action Button */}
        <TouchableOpacity style={styles.fab} onPress={openActionMenu} activeOpacity={0.8}>
          <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>

        {/* Action Menu Modal */}
        <Modal
          visible={showActionMenu}
          transparent
          animationType="fade"
          onRequestClose={() => setShowActionMenu(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowActionMenu(false)}>
            <View style={styles.actionMenuOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.actionMenuContainer}>
                  {/* Panic Button */}
                  <TouchableOpacity style={[styles.actionMenuItem, styles.panicButton]} onPress={handlePanic}>
                    <Text style={styles.actionMenuText}>Panic</Text>
                  </TouchableOpacity>

                  {/* AI Coach Button */}
                  <TouchableOpacity style={[styles.actionMenuItem, styles.aiCoachButton]} onPress={handleAICoach}>
                    <Text style={styles.actionMenuText}>AI Coach</Text>
                  </TouchableOpacity>

                  {/* I relapsed Button */}
                  <TouchableOpacity style={[styles.actionMenuItem, styles.relapsedButton]} onPress={handleRelapse}>
                    <Text style={styles.actionMenuText}>I relapsed</Text>
                  </TouchableOpacity>

                  {/* Reflect Button */}
                  <TouchableOpacity style={[styles.actionMenuItem, styles.reflectButton]} onPress={handleReflect}>
                    <Text style={styles.actionMenuText}>I wanna reflect</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Panic Modal */}
        <Modal
          visible={showPanicModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPanicModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Lockdown Mode (2 minutes)</Text>
              <Text style={styles.modalSubtitle}>You can edit duration & blocked apps in settings</Text>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalButton} onPress={handleLockdownSettings}>
                  <Text style={styles.modalButtonTextBlue}>Settings</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.modalButtonRed]} onPress={handleStartLockdown}>
                  <Text style={styles.modalButtonTextRed}>Start</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
    fontFamily: 'DMSans_400Regular',
    marginTop: 16,
  },
  starsContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  star: {
    position: 'absolute',
    width: 2,
    height: 2,
    backgroundColor: '#FFF',
    borderRadius: 1,
  },
  quote: {
    color: '#999',
    fontSize: 20,
    fontFamily: 'DMSans_400Regular',
    textAlign: 'center',
    marginTop: 80,
    marginHorizontal: 30,
    lineHeight: 28,
  },
  timerContainer: {
    marginTop: 60,
    paddingLeft: 30,
    alignItems: 'flex-start',
  },
  timerItem: {
    alignItems: 'center',
    marginBottom: 20,
  },
  timerNumber: {
    color: '#E0E0E0',
    fontSize: 80,
    fontFamily: 'DMSans_300Light',
    textAlign: 'left',
  },
  timerLabel: {
    color: '#5B8FDE',
    fontSize: 20,
    fontFamily: 'DMSans_300Light',
    textAlign: 'left',
    marginTop: -10,
  },
  statusText: {
    color: '#666',
    fontSize: 16,
    fontFamily: 'DMSans_400Regular',
    marginLeft: 30,
    marginRight: 30,
    marginTop: 8,
  },
  progressText: {
    color: '#666',
    fontSize: 16,
    fontFamily: 'DMSans_400Regular',
    marginLeft: 30,
    marginRight: 30,
    marginTop: 4,
    marginBottom: 100,
  },
  brainContainer: {
    position: 'absolute',
    right: 30,
    top: '40%',
    width: 180,
    height: 180,
  },
  brainPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1A1A1A',
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  brainInner: {
    width: '70%',
    height: '70%',
    backgroundColor: '#2A2A2A',
    borderRadius: 60,
    opacity: 0.8,
  },
  coinButton: {
    position: 'absolute',
    bottom: 170,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  coinIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  coinText: {
    fontSize: 24,
    fontFamily: 'DMSans_500Medium',
    color: '#B8860B',
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 24,
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
  actionMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  actionMenuContainer: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  actionMenuItem: {
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  panicButton: {
    backgroundColor: '#B54A4A',
  },
  aiCoachButton: {
    backgroundColor: '#4DB6AC',
  },
  relapsedButton: {
    backgroundColor: '#8B6DD4',
  },
  reflectButton: {
    backgroundColor: '#5B8FDE',
  },
  actionMenuText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'DMSans_500Medium',
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'DMSans_500Medium',
    color: '#000',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    fontFamily: 'DMSans_400Regular',
    color: '#666',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modalButtonRed: {
    borderColor: '#FF3B30',
  },
  modalButtonTextBlue: {
    color: '#007AFF',
    fontSize: 16,
    fontFamily: 'DMSans_500Medium',
  },
  modalButtonTextRed: {
    color: '#FF3B30',
    fontSize: 16,
    fontFamily: 'DMSans_500Medium',
  },
});
