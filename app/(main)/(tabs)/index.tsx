import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, TouchableWithoutFeedback, Dimensions as RNDimensions } from 'react-native';
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPanicModal, setShowPanicModal] = useState(false);
  const [currentQuote] = useState(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  
  // Timer state
  const [startTime] = useState(new Date('2025-01-29T00:00:00')); // This should come from user data
  const [timer, setTimer] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  
  // Animation values
  const rotation = useSharedValue(0);
  const fabScale = useSharedValue(1);
  const overlayOpacity = useSharedValue(0);
  
  // Button positions for expanded state
  const buttonAnimations = [
    { x: useSharedValue(0), y: useSharedValue(0), opacity: useSharedValue(0), scale: useSharedValue(0.8) }, // Panic
    { x: useSharedValue(0), y: useSharedValue(0), opacity: useSharedValue(0), scale: useSharedValue(0.8) }, // AI Coach
    { x: useSharedValue(0), y: useSharedValue(0), opacity: useSharedValue(0), scale: useSharedValue(0.8) }, // I relapsed
    { x: useSharedValue(0), y: useSharedValue(0), opacity: useSharedValue(0), scale: useSharedValue(0.8) }, // Reflect
  ];

  // Update timer every second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const diff = now.getTime() - startTime.getTime();
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimer({ days, hours, minutes, seconds });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [startTime]);

  // Animated styles
  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: fabScale.value }
    ]
  }));

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
    pointerEvents: overlayOpacity.value > 0 ? 'auto' : 'none',
  }));

  const buttonAnimatedStyles = buttonAnimations.map((anim) =>
    useAnimatedStyle(() => ({
      transform: [
        { translateX: anim.x.value },
        { translateY: anim.y.value },
        { scale: anim.scale.value }
      ],
      opacity: anim.opacity.value,
    }))
  );


  const toggleExpand = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const expanding = !isExpanded;
    setIsExpanded(expanding);
    
    // Animate FAB rotation
    rotation.value = withSpring(expanding ? 45 : 0, {
      damping: 20,
      stiffness: 300,
    });
    
    // Animate overlay
    overlayOpacity.value = withTiming(expanding ? 1 : 0, { duration: 200 });
    
    // Animate buttons
    const buttonRadius = 90;
    const positions = [
      { x: -buttonRadius * 1.5, y: -buttonRadius * 0.5 }, // Panic (top left)
      { x: buttonRadius * 1.5, y: -buttonRadius * 0.5 },  // AI Coach (top right)
      { x: -buttonRadius * 1.5, y: -buttonRadius * 1.8 }, // I relapsed (bottom left)
      { x: buttonRadius * 1.5, y: -buttonRadius * 1.8 },  // Reflect (bottom right)
    ];
    
    buttonAnimations.forEach((anim, index) => {
      if (expanding) {
        anim.opacity.value = withTiming(1, { duration: 200 });
        anim.scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        anim.x.value = withSpring(positions[index].x, { damping: 15, stiffness: 300 });
        anim.y.value = withSpring(positions[index].y, { damping: 15, stiffness: 300 });
      } else {
        anim.opacity.value = withTiming(0, { duration: 150 });
        anim.scale.value = withSpring(0.8, { damping: 15, stiffness: 300 });
        anim.x.value = withSpring(0, { damping: 15, stiffness: 300 });
        anim.y.value = withSpring(0, { damping: 15, stiffness: 300 });
      }
    });
  }, [isExpanded]);


  const handlePanic = () => {
    setIsExpanded(false);
    setShowPanicModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  const handleAICoach = () => {
    setIsExpanded(false);
    router.push('/chat');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleRelapse = () => {
    setIsExpanded(false);
    router.push('/relapse');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  const handleReflect = () => {
    setIsExpanded(false);
    router.push('/journal');
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
  
  // 3D Brain component placeholder
  const Brain3D = () => {
    // This would be replaced with actual 3D brain/rock model
    return (
      <View style={styles.brainContainer}>
        <View style={styles.brainPlaceholder}>
          {/* Placeholder for 3D brain model */}
          <View style={styles.brainInner} />
        </View>
      </View>
    );
  };

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
          <View style={styles.timerRow}>
            <Text style={styles.timerNumber}>{timer.days}</Text>
            <Text style={styles.timerLabel}>days</Text>
          </View>
          <View style={styles.timerRow}>
            <Text style={styles.timerNumber}>{timer.hours}</Text>
            <Text style={styles.timerLabel}>hours</Text>
          </View>
          <View style={styles.timerRow}>
            <Text style={styles.timerNumber}>{timer.minutes}</Text>
            <Text style={styles.timerLabel}>minutes</Text>
          </View>
          <View style={styles.timerRow}>
            <Text style={styles.timerNumber}>{timer.seconds}</Text>
            <Text style={styles.timerLabel}>seconds</Text>
          </View>
        </View>

        <Text style={styles.statusText}>since last relapse</Text>
        <Text style={styles.progressText}>{progress}% rewired</Text>

        {/* 3D Brain */}
        <Brain3D />

        {/* Diamond indicator */}
        <View style={styles.diamondContainer}>
          <Ionicons name="diamond" size={40} color="#4A90E2" />
        </View>

        {/* Floating Action Buttons */}
        <View style={styles.fabContainer}>
          {/* Panic Button */}
          <Animated.View style={[styles.actionButton, buttonAnimatedStyles[0]]}>
            <TouchableOpacity style={[styles.actionButtonInner, styles.panicButton]} onPress={handlePanic}>
              <Text style={styles.actionButtonText}>Panic</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* AI Coach Button */}
          <Animated.View style={[styles.actionButton, buttonAnimatedStyles[1]]}>
            <TouchableOpacity style={[styles.actionButtonInner, styles.aiCoachButton]} onPress={handleAICoach}>
              <Text style={styles.actionButtonText}>AI Coach</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* I relapsed Button */}
          <Animated.View style={[styles.actionButton, buttonAnimatedStyles[2]]}>
            <TouchableOpacity style={[styles.actionButtonInner, styles.relapsedButton]} onPress={handleRelapse}>
              <Text style={styles.actionButtonText}>I relapsed</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Reflect Button */}
          <Animated.View style={[styles.actionButton, buttonAnimatedStyles[3]]}>
            <TouchableOpacity style={[styles.actionButtonInner, styles.reflectButton]} onPress={handleReflect}>
              <Text style={styles.actionButtonText}>I wanna reflect</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Main FAB */}
          <TouchableOpacity style={styles.fab} onPress={toggleExpand}>
            <Animated.View style={fabAnimatedStyle}>
              <Ionicons name="add" size={32} color="white" />
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Overlay for expanded state */}
        {isExpanded && (
          <TouchableWithoutFeedback onPress={toggleExpand}>
            <Animated.View style={[styles.overlay, overlayAnimatedStyle]} />
          </TouchableWithoutFeedback>
        )}

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
    color: '#FFF',
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 60,
    marginHorizontal: 20,
    lineHeight: 30,
  },
  timerContainer: {
    marginTop: 40,
    marginLeft: 40,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  timerNumber: {
    color: '#FFF',
    fontSize: 72,
    fontWeight: '300',
    width: 120,
  },
  timerLabel: {
    color: '#4A90E2',
    fontSize: 28,
    fontWeight: '300',
    marginLeft: 10,
  },
  statusText: {
    color: '#999',
    fontSize: 18,
    marginLeft: 40,
    marginTop: 10,
  },
  progressText: {
    color: '#999',
    fontSize: 18,
    marginLeft: 40,
    marginTop: 5,
  },
  brainContainer: {
    position: 'absolute',
    right: 20,
    top: '35%',
    width: 200,
    height: 200,
  },
  brainPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#444',
    borderRadius: 100,
    opacity: 0.3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brainInner: {
    width: '80%',
    height: '80%',
    backgroundColor: '#666',
    borderRadius: 80,
    opacity: 0.5,
  },
  diamondContainer: {
    position: 'absolute',
    right: 50,
    bottom: 180,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 120,
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#5B5FDE',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  actionButton: {
    position: 'absolute',
  },
  actionButtonInner: {
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 40,
    minWidth: 160,
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  panicButton: {
    backgroundColor: '#C74545',
  },
  aiCoachButton: {
    backgroundColor: '#4DB8B8',
  },
  relapsedButton: {
    backgroundColor: '#8B5FDE',
  },
  reflectButton: {
    backgroundColor: '#5B7FDE',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '500',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
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
    fontWeight: '500',
  },
  modalButtonTextRed: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '500',
  },
});
