import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TextInput, Image, Dimensions, ActivityIndicator, Animated, Linking, PanResponder } from 'react-native';
import Svg, { Path } from 'react-native-svg';

// Conditionally import notifications - will fail in Expo Go
let Notifications: any;
try {
  Notifications = require('expo-notifications');
} catch (error) {
  console.log('expo-notifications not available in Expo Go. Use development build for notifications.');
}
import { useSignUp, useOAuth, useAuth as useClerkAuth } from '@clerk/clerk-expo';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Picker } from '@react-native-picker/picker';
import { useMutation, useQuery, useConvex } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { LinearGradient } from 'expo-linear-gradient';
// import { useRevenueCat } from '../providers/RevenueCatProvider'; // Disabled temporarily
import { isExpoGo } from '@/utils/isExpoGo';

// Only import RevenueCat UI on native platforms
let RevenueCatUI: any = {
  presentPaywall: async () => ({ result: 'CANCELLED' }),
  presentPaywallIfNeeded: async () => ({ result: 'NOT_PRESENTED' }),
};
let PAYWALL_RESULT: any = {
  PURCHASED: 'PURCHASED',
  CANCELLED: 'CANCELLED',
  NOT_PRESENTED: 'NOT_PRESENTED',
  ERROR: 'ERROR',
  RESTORED: 'RESTORED',
};

if (Platform.OS !== 'web' && !isExpoGo()) {
  try {
    const rcUI = require("react-native-purchases-ui");
    RevenueCatUI = rcUI.default;
    PAYWALL_RESULT = rcUI.PAYWALL_RESULT;
  } catch (error) {
    console.warn('Failed to load react-native-purchases-ui:', error);
  }
}
import { Haptics } from '../utils/haptics';
import { ExternalLink } from '../components/ExternalLink';
import { requestRating, trackRatingAction, shouldShowRating } from '../utils/ratings';
import { validateReferralCode, getReferralDetails } from '@/utils/referralCodes';
import AdjustEvents from '@/utils/adjustEvents';
import FacebookSDK from '@/utils/facebook';
import LottieView from 'lottie-react-native';
import { useAnalytics } from '@/providers/AnalyticsProvider';

type OnboardingMode = 'full' | 'user_details' | 'signin';

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [userData, setUserData] = useState({
    goals: '',
    sex: '',
    age: '25',
    height: '175',
    heightFt: '5',
    heightIn: '4',
    weight: '70',
    weightLbs: '154',
    diet: '',
    training_frequency: '',
    training_type: [] as string[],
    referralCode: '',
  });
  const { startOAuthFlow: startGoogleOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const { startOAuthFlow: startAppleOAuthFlow } = useOAuth({ strategy: "oauth_apple" });
  const store = useMutation(api.users.store);
  const updateUser = useMutation(api.users.updateCurrentUser)
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [useMetric, setUseMetric] = useState(false);
  const [proteinResult, setProteinResult] = useState({
    dailyProtein: '0',
  });
  const [isLoading, setIsLoading] = useState(false);
  // Temporary fallback since RevenueCat provider is disabled
  const packages = null;
  const purchasePackage = async () => ({ success: false });
  const [mode, setMode] = useState<OnboardingMode>('full');
  const [selectedRating, setSelectedRating] = useState(0);
  const [referralInput, setReferralInput] = useState('');
  const { signOut, isLoaded, isSignedIn } = useClerkAuth();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_apple' });
  const convex = useConvex();
  const user = mode === 'user_details' ? useQuery(api.users.getCurrentUser) : undefined;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef<ScrollView>(null);
  const analytics = useAnalytics();

  // Apple Sign In function
  const handleAppleSignIn = async () => {
    try {
      console.log('Starting Apple Sign In...');
      
      // Check if already signed in
      if (isSignedIn) {
        console.log('User already signed in, redirecting to home');
        router.replace('/(main)/(tabs)/');
        return;
      }
      
      const { createdSessionId, signIn, signUp, setActive } = await startOAuthFlow();
      
      if (createdSessionId) {
        console.log('Apple Sign In successful, setting active session');
        await setActive({ session: createdSessionId });
        console.log('Session activated, redirecting to home');
        router.replace('/(main)/(tabs)/');
      } else {
        console.log('Apple Sign In cancelled or failed');
      }
    } catch (error) {
      console.error('Apple Sign In error:', error);
      
      // If error is "already signed in", redirect anyway
      if (error.message?.includes('already signed in')) {
        console.log('Already signed in error, redirecting to home');
        router.replace('/(main)/(tabs)/');
      }
    }
  };

  // Create refs to store paths to avoid closure issues
  const pathsRef = useRef<any[]>([]);
  const currentPathRef = useRef<any[]>([]);
  
  // Signature handling with PanResponder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => {
        const { locationX, locationY } = event.nativeEvent;
        currentPathRef.current = [{ x: locationX, y: locationY }];
        setCurrentPath([{ x: locationX, y: locationY }]);
      },
      onPanResponderMove: (event) => {
        const { locationX, locationY } = event.nativeEvent;
        currentPathRef.current = [...currentPathRef.current, { x: locationX, y: locationY }];
        setCurrentPath([...currentPathRef.current]);
      },
      onPanResponderRelease: () => {
        console.log('PanResponder Release - currentPath length:', currentPathRef.current.length);
        if (currentPathRef.current.length > 1) {
          // Store in ref first
          pathsRef.current = [...pathsRef.current, currentPathRef.current];
          console.log('Stored paths in ref:', pathsRef.current.length);
          // Then update state
          setSignaturePaths([...pathsRef.current]);
        }
        currentPathRef.current = [];
        setCurrentPath([]);
      },
    })
  ).current;

  const clearSignature = () => {
    pathsRef.current = [];
    setSignaturePaths([]);
    setCurrentPath([]);
  };

  // Debug effect to monitor signature state
  useEffect(() => {
    console.log('Signature paths updated:', signaturePaths.length, 'paths');
  }, [signaturePaths]);

  const pathToSvg = (path: any[]) => {
    if (!path || path.length < 2) return '';
    let svgPath = `M ${Math.round(path[0].x)} ${Math.round(path[0].y)}`;
    for (let i = 1; i < path.length; i++) {
      svgPath += ` L ${Math.round(path[i].x)} ${Math.round(path[i].y)}`;
    }
    return svgPath;
  };

  const { mode: onboardingMode } = useLocalSearchParams<{ mode?: OnboardingMode }>();

  const windowDimensions = Dimensions.get('window');
  const isSmallDevice = windowDimensions.height < 700;

  // 27 screens as per the screenshots
  const screens = [
    { id: 1, type: 'welcome' },
    { id: 2, type: 'stats' },
    { id: 3, type: 'community' },
    { id: 4, type: 'healing' },
    { id: 5, type: 'life' },
    { id: 6, type: 'transform' },
    { id: 7, type: 'session_duration' },
    { id: 8, type: 'motivation_1' },
    { id: 9, type: 'motivation_2' },
    { id: 10, type: 'age_range' },
    { id: 11, type: 'start_age' },
    { id: 12, type: 'sexually_active_age' }, // Now asks about gambling frequency
    { id: 13, type: 'gambling_increase' },
    { id: 14, type: 'risk_escalation' },
    // { id: 15, type: 'blockers' },
    // { id: 16, type: 'track' },
    { id: 17, type: 'religious' },
    { id: 18, type: 'last_relapse' },
    { id: 19, type: 'wakeup' },
    { id: 20, type: 'bedtime' },
    { id: 21, type: 'science' },
    { id: 22, type: 'days' },
    { id: 23, type: 'symptoms' },
    { id: 24, type: 'plan' },
    { id: 25, type: 'graph' },
    { id: 26, type: 'commitment' },
    { id: 27, type: 'notification' },
    { id: 28, type: 'signup' },
    { id: 29, type: 'complete' },
  ];

  // State for user selections
  const [sessionDuration, setSessionDuration] = useState('');
  const [motivations, setMotivations] = useState<string[]>([]);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [notificationTime, setNotificationTime] = useState('');
  const [wakeupTime, setWakeupTime] = useState('');
  const [bedtime, setBedtime] = useState('');
  const [userAge, setUserAge] = useState('');
  const [startAge, setStartAge] = useState('');
  const [hasPartner, setHasPartner] = useState('');
  const [goal, setGoal] = useState('');
  const [frequency, setFrequency] = useState('');
  const [triggers, setTriggers] = useState<string[]>([]);
  const [sexuallyActiveAge, setSexuallyActiveAge] = useState('');
  const [gamblingIncrease, setGamblingIncrease] = useState('');
  const [riskEscalation, setRiskEscalation] = useState('');
  const [religious, setReligious] = useState('');
  const [lastRelapse, setLastRelapse] = useState('');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [signaturePaths, setSignaturePaths] = useState<any[]>([]);
  const [currentPath, setCurrentPath] = useState<any[]>([]);

  const handleNext = async () => {
    console.log('handleNext called, currentStep:', currentStep);
    
    try {
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.log('Haptics not available');
    }
    
    // Track step completion
    try {
      analytics.track({
        name: `Onboarding Step Completed - ${screens[currentStep].type}`,
        properties: {
          stepNumber: currentStep + 1,
          screenType: screens[currentStep].type,
        },
      });
    } catch (error) {
      console.log('Analytics error:', error);
    }

    if (currentStep < screens.length - 1) {
      console.log('Moving to next step:', currentStep + 1);
      setCurrentStep(prev => prev + 1);
    } else {
      // Mark user as onboarded when completing onboarding
      console.log('Onboarding complete, marking user as onboarded');
      try {
        if (updateUser) {
          await updateUser({});  // This will set onboarded: true
        }
      } catch (error) {
        console.error('Error updating user onboarded status:', error);
      }
      router.replace('/(main)');
    }
  };

  const handleOAuthSignUp = async (strategy: 'oauth_google' | 'oauth_apple') => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    analytics.track({ name: 'Signup Attempt', properties: { strategy } });
    try {
      const startOAuthFlow = strategy === 'oauth_google' ? startGoogleOAuthFlow : startAppleOAuthFlow;
      const { createdSessionId, setActive } = await startOAuthFlow();

      if (createdSessionId && setActive) {
        console.log('[Onboarding] Setting active session...');
        await setActive({ session: createdSessionId });
        
        // Give Clerk time to propagate the session
        console.log('[Onboarding] Waiting for session to propagate...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        try {
          console.log('[Onboarding] Creating user in Convex...');
          await store();
          console.log('[Onboarding] User created successfully');
        } catch (storeError) {
          console.error('[Onboarding] Error creating user in Convex:', storeError);
          // Continue anyway - the SimpleAuthProvider will retry
        }
        
        analytics.track({ name: 'Signup Success', properties: { strategy } });
        if (createdSessionId) {
          analytics.identify(createdSessionId);
        }
        
        console.log('[Onboarding] Moving to next step...');
        handleNext();
      }
    } catch (err) {
      analytics.track({ name: 'Signup Failure', properties: { strategy, error: JSON.stringify(err) } });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error('OAuth error', JSON.stringify(err));
    }
  };

  const handleBack = async () => {
    try {
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.log('Haptics not available');
    }
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Add effect to log state changes
  useEffect(() => {
    console.log('Current step changed to:', currentStep);
    console.log('Current screen type:', screens[currentStep]?.type);
  }, [currentStep]);

  const renderScreen = () => {
    const screen = screens[currentStep];
    
    switch (screen.type) {
      case 'welcome':
        return (
          <View style={styles.welcomeContainer}>
            {/* Premium star field background */}
            <View style={styles.starsContainer}>
              {[...Array(25)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.star,
                    {
                      top: `${Math.random() * 100}%`,
                      left: `${Math.random() * 100}%`,
                      width: Math.random() * 4 + 2,
                      height: Math.random() * 4 + 2,
                      opacity: Math.random() * 0.6 + 0.2,
                    },
                  ]}
                />
              ))}
            </View>
            
            <View style={styles.welcomeContent}>
              <Text style={styles.welcomeTitle}>
                Welcome{'\n'}to <Text style={styles.welcomeTitleGold}>Unbet</Text>
              </Text>
              <Text style={styles.welcomeSubtitle}>Secure your Future.{'\n'}Leave Gambling Behind.</Text>
            </View>
            
            <View style={styles.welcomeActions}>
              <TouchableOpacity 
                style={styles.welcomeButton} 
                onPress={() => {
                  console.log('Start journey button pressed');
                  console.log('Current step before:', currentStep);
                  console.log('Screens length:', screens.length);
                  handleNext();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.welcomeButtonText}>Start my journey</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.loginButton} 
                onPress={handleAppleSignIn}
              >
                <Text style={styles.loginButtonText}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      
      case 'stats':
        return (
          <View style={styles.statsContainer}>
            <View style={styles.starsContainer}>
              <View style={[styles.star, { top: '5%', left: '8%', width: 3, height: 3 }]} />
              <View style={[styles.star, { top: '15%', left: '90%', width: 4, height: 4 }]} />
              <View style={[styles.star, { top: '25%', left: '12%', width: 2, height: 2 }]} />
              <View style={[styles.star, { top: '40%', left: '85%', width: 3, height: 3 }]} />
              <View style={[styles.star, { top: '60%', left: '10%', width: 4, height: 4 }]} />
              <View style={[styles.star, { top: '75%', left: '88%', width: 3, height: 3 }]} />
              <View style={[styles.star, { top: '85%', left: '15%', width: 2, height: 2 }]} />
            </View>
            <ScrollView style={styles.statsScrollView} contentContainerStyle={styles.statsScrollContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.statsTitle}>A science-based approach to overcome gambling addiction for good.</Text>
              <View style={styles.statsBig}>
                <Text style={styles.statsBigNumber}>$400</Text>
                <Text style={styles.statsBigUnit}>billion</Text>
              </View>
              <Text style={styles.statsDescription}>are lost every year to gambling around the world.</Text>
              <View style={styles.statsItems}>
                <View style={styles.statsItem}>
                  <Text style={styles.statsIcon}>🚀</Text>
                  <Text style={styles.statsItemText}>More than 10 countries' annual GDP combined</Text>
                </View>
                <View style={styles.statsItem}>
                  <Text style={styles.statsIcon}>🏛</Text>
                  <Text style={styles.statsItemText}>Could fund 200,000 schools worldwide</Text>
                </View>
                <View style={styles.statsItem}>
                  <Text style={styles.statsIcon}>🔬</Text>
                  <Text style={styles.statsItemText}>4x all global scientific research funding</Text>
                </View>
              </View>
            </ScrollView>
            <TouchableOpacity style={styles.statsButton} onPress={handleNext}>
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        );

      case 'community':
        return (
          <View style={styles.communityContainer}>
            <Text style={styles.communityTitle}>You're not alone.</Text>
            <Text style={styles.communitySubtitle}>Daily check-ins with the community.</Text>
            <View style={styles.communityCard}>
              <Text style={styles.communityEmoji}>📢</Text>
              <Text style={styles.communityCardTitle}>Salute to the 312 soldiers that folded today.</Text>
              <Text style={styles.communityNumber}>544</Text>
              <Text style={styles.communityStatus}>are still going strong</Text>
            </View>
            <TouchableOpacity style={styles.continueButton} onPress={handleNext}>
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        );

      case 'healing':
        return (
          <View style={styles.healingContainer}>
            <Text style={styles.healingTitle}>See your brain healing in real-time.</Text>
            <View style={styles.healingImageContainer}>
              <Image 
                source={require('../assets/images/onboarding_brain.png')}
                style={styles.brainImage}
                resizeMode="contain"
              />
            </View>
            <TouchableOpacity style={styles.continueButton} onPress={handleNext}>
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        );

      case 'life':
        return (
          <ScrollView style={styles.lifeContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.lifeTitle}>This journey{'\n'}can save your life.</Text>
            <View style={styles.lifeGrid}>
              <View style={styles.lifeItem}>
                <Text style={styles.lifeIcon}>🧘‍♂️</Text>
                <Text style={styles.lifeItemTitle}>Anxiety</Text>
                <Text style={styles.lifeItemSubtitle}>Reduced to normal levels</Text>
              </View>
              <View style={styles.lifeItem}>
                <Text style={styles.lifeIcon}>💪</Text>
                <Text style={styles.lifeItemTitle}>Confidence</Text>
                <Text style={styles.lifeItemSubtitle}>Finally you are yourself</Text>
              </View>
              <View style={styles.lifeItem}>
                <Text style={styles.lifeIcon}>🧠</Text>
                <Text style={styles.lifeItemTitle}>Focus</Text>
                <Text style={styles.lifeItemSubtitle}>Crystal clear thinking</Text>
              </View>
              <View style={styles.lifeItem}>
                <Text style={styles.lifeIcon}>💑</Text>
                <Text style={styles.lifeItemTitle}>Relationship</Text>
                <Text style={styles.lifeItemSubtitle}>Feel true love & connection</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.continueButton} onPress={handleNext}>
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </ScrollView>
        );

      case 'transform':
        return (
          <ScrollView style={styles.transformContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.transformTitle}>10,653 people transformed their lives this year.</Text>
            <View style={styles.transformTestimonials}>
              <View style={styles.testimonial}>
                <Text style={styles.testimonialQuote}>"Finally free after 8 years of gambling addiction. Unbet saved my marriage and finances."</Text>
                <Text style={styles.testimonialAuthor}>- Mark, 34</Text>
              </View>
              <View style={styles.testimonial}>
                <Text style={styles.testimonialQuote}>"90 days clean. My anxiety is gone and I feel like myself again."</Text>
                <Text style={styles.testimonialAuthor}>- David, 28</Text>
              </View>
              <View style={styles.testimonial}>
                <Text style={styles.testimonialQuote}>"The brain science approach actually works. 6 months strong!"</Text>
                <Text style={styles.testimonialAuthor}>- Alex, 41</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.continueButton} onPress={handleNext}>
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </ScrollView>
        );

      case 'session_duration':
        return (
          <View style={styles.durationContainer}>
            <View style={styles.starsContainer}>
              <View style={[styles.star, { top: '10%', left: '5%', width: 3, height: 3 }]} />
              <View style={[styles.star, { top: '20%', left: '92%', width: 4, height: 4 }]} />
              <View style={[styles.star, { top: '35%', left: '15%', width: 2, height: 2 }]} />
              <View style={[styles.star, { top: '50%', left: '88%', width: 3, height: 3 }]} />
              <View style={[styles.star, { top: '70%', left: '10%', width: 4, height: 4 }]} />
              <View style={[styles.star, { top: '80%', left: '85%', width: 2, height: 2 }]} />
            </View>
            <Text style={styles.questionTitle}>How long do your sessions last ?</Text>
            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
              <View style={styles.optionsContainer}>
                {[
                  'Less than 5 minutes',
                  '10 to 20 minutes',
                  '30 minutes',
                  '30 to 60 minutes',
                  '1 to 2 hours',
                  '2+ hours'
                ].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.optionButton, sessionDuration === option && styles.optionButtonSelected]}
                    onPress={() => {
                      setSessionDuration(option);
                      handleNext();
                    }}
                  >
                    <Text style={styles.optionButtonText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        );

      case 'motivation_1':
        return (
          <View style={styles.motivationContainer}>
            <Text style={styles.questionTitle}>What's your motivations behind quitting gambling ?</Text>
            <ScrollView style={styles.scrollContainer}>
              {[
                'Reclaim control of my life',
                'Improve relationships',
                'Financial freedom',
                'Reduce anxiety and stress',
                'Stop lying to loved ones',
                'Build a secure future',
                'End the shame and secrecy'
              ].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.checkboxContainer}
                  onPress={() => {
                    if (motivations.includes(option)) {
                      setMotivations(motivations.filter(m => m !== option));
                    } else {
                      setMotivations([...motivations, option]);
                    }
                  }}
                >
                  <View style={[styles.checkbox, motivations.includes(option) && styles.checkboxSelected]}>
                    {motivations.includes(option) && <View style={styles.radioInner} />}
                  </View>
                  <Text style={styles.checkboxText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity 
              style={[styles.continueButton, motivations.length === 0 && styles.continueButtonDisabled]} 
              onPress={handleNext}
              disabled={motivations.length === 0}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        );

      case 'motivation_2':
        return (
          <View style={styles.motivationContainer}>
            <Text style={styles.questionTitle}>What's your motivations behind quitting gambling ?</Text>
            <ScrollView style={styles.scrollContainer}>
              {[
                'Regain self-respect',
                'Save money',
                'Focus on family',
                'Improve sleep quality',
                'Reduce mood swings',
                'Stop chasing losses',
                'Religious reasons'
              ].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.checkboxContainer}
                  onPress={() => {
                    if (motivations.includes(option)) {
                      setMotivations(motivations.filter(m => m !== option));
                    } else {
                      setMotivations([...motivations, option]);
                    }
                  }}
                >
                  <View style={[styles.checkbox, motivations.includes(option) && styles.checkboxSelected]}>
                    {motivations.includes(option) && <View style={styles.radioInner} />}
                  </View>
                  <Text style={styles.checkboxText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity 
              style={[styles.continueButton, motivations.length === 0 && styles.continueButtonDisabled]} 
              onPress={handleNext}
              disabled={motivations.length === 0}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        );

      case 'age_range':
        return (
          <View style={styles.ageRangeContainer}>
            <Text style={styles.questionTitle}>What is your age range ?</Text>
            <View style={styles.optionsContainer}>
              {[
                '14 - 17',
                '18 - 24',
                '25 - 30',
                '30 - 40',
                '40+'
              ].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.optionButton, userAge === option && styles.optionButtonSelected]}
                  onPress={() => {
                    setUserAge(option);
                    handleNext();
                  }}
                >
                  <Text style={styles.optionButtonText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'start_age':
        return (
          <View style={styles.startAgeContainer}>
            <Text style={styles.questionTitle}>When did you start gambling ?</Text>
            <View style={styles.optionsContainer}>
              {[
                '14 - 17',
                '18 - 24',
                '25 - 30',
                '30 - 40',
                '40+'
              ].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.optionButton, startAge === option && styles.optionButtonSelected]}
                  onPress={() => {
                    setStartAge(option);
                    handleNext();
                  }}
                >
                  <Text style={styles.optionButtonText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'sexually_active_age':
        return (
          <View style={styles.sexuallyActiveContainer}>
            <Text style={styles.questionTitle}>How often do you gamble ?</Text>
            <View style={styles.optionsContainer}>
              {[
                'Daily',
                'Few times a week',
                'Weekly',
                'Few times a month',
                'Monthly',
                'Rarely'
              ].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.optionButton, sexuallyActiveAge === option && styles.optionButtonSelected]}
                  onPress={() => {
                    setSexuallyActiveAge(option);
                    handleNext();
                  }}
                >
                  <Text style={styles.optionButtonText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'gambling_increase':
        return (
          <View style={styles.gamblingIncreaseContainer}>
            <Text style={styles.questionTitle}>Has the amount of money you gamble increased over time ?</Text>
            <View style={styles.optionsContainer}>
              {[
                'Yes',
                'No'
              ].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.optionButton, gamblingIncrease === option && styles.optionButtonSelected]}
                  onPress={() => {
                    setGamblingIncrease(option);
                    handleNext();
                  }}
                >
                  <Text style={styles.optionButtonText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'risk_escalation':
        return (
          <View style={styles.riskEscalationContainer}>
            <Text style={styles.questionTitle}>Have you started to bet larger amounts or take bigger risks over time ?</Text>
            <View style={styles.optionsContainer}>
              {[
                'Yes',
                'No'
              ].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.optionButton, riskEscalation === option && styles.optionButtonSelected]}
                  onPress={() => {
                    setRiskEscalation(option);
                    handleNext();
                  }}
                >
                  <Text style={styles.optionButtonText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      // case 'blockers':
      //   return (
      //     <View style={styles.blockersContainer}>
      //       <Text style={styles.blockersTitle}>Install a porn blocker ?</Text>
      //       <Text style={styles.blockersSubtitle}>For accountability, block inappropriate content on your phone</Text>
      //       <View style={styles.blockersCard}>
      //         <Ionicons name="shield-checkmark" size={48} color="#5B8DFF" style={styles.blockersIcon} />
      //         <Text style={styles.blockersCardTitle}>Blocker App</Text>
      //         <Text style={styles.blockersCardSubtitle}>Block adult content across all browsers and apps</Text>
      //       </View>
      //       <TouchableOpacity style={styles.installButton} onPress={handleNext}>
      //         <Text style={styles.installButtonText}>Install Blocker</Text>
      //       </TouchableOpacity>
      //       <TouchableOpacity style={styles.skipButton} onPress={handleNext}>
      //         <Text style={styles.skipButtonText}>Skip for now</Text>
      //       </TouchableOpacity>
      //     </View>
      //   );

      // case 'track':
      //   return (
      //     <View style={styles.trackContainer}>
      //       <Text style={styles.trackTitle}>Track your journey, every single day.</Text>
      //       <View style={styles.phoneContainer}>
      //         <View style={styles.phoneMockup}>
      //           <Text style={styles.phoneMockupText}>Journey Tracker UI</Text>
      //         </View>
      //       </View>
      //       <TouchableOpacity style={styles.continueButton} onPress={handleNext}>
      //         <Text style={styles.continueButtonText}>Continue</Text>
      //       </TouchableOpacity>
      //     </View>
      //   );

      case 'science':
        return (
          <View style={styles.scienceContainer}>
            <Text style={styles.scienceTitle}>Backed by brain science.</Text>
            <Text style={styles.scienceSubtitle}>Your recovery is designed by neuroscientists and gambling addiction experts</Text>
            <View style={styles.scienceItems}>
              <View style={styles.scienceItem}>
                <Ionicons name="fitness" size={32} color="#5B8DFF" />
                <Text style={styles.scienceItemTitle}>Neuroplasticity</Text>
                <Text style={styles.scienceItemText}>Rewire your brain pathways</Text>
              </View>
              <View style={styles.scienceItem}>
                <Ionicons name="pulse" size={32} color="#5B8DFF" />
                <Text style={styles.scienceItemTitle}>Dopamine Reset</Text>
                <Text style={styles.scienceItemText}>Restore natural reward system</Text>
              </View>
              <View style={styles.scienceItem}>
                <Ionicons name="trending-up" size={32} color="#5B8DFF" />
                <Text style={styles.scienceItemTitle}>Progressive Recovery</Text>
                <Text style={styles.scienceItemText}>Evidence-based milestones</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.continueButton} onPress={handleNext}>
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        );

      case 'days':
        return (
          <ScrollView style={styles.daysContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.daysTitle}>90 days to transform your life.</Text>
            <View style={styles.milestonesContainer}>
              <View style={styles.milestoneCard}>
                <View style={styles.milestoneCheckmark}>
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.milestoneContent}>
                  <Text style={styles.milestoneDay}>7 days</Text>
                  <Text style={styles.milestoneTitle}>First Week</Text>
                  <Text style={styles.milestoneText}>Break the betting cycle</Text>
                </View>
              </View>
              
              <View style={styles.milestoneCard}>
                <View style={styles.milestoneCheckmark}>
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.milestoneContent}>
                  <Text style={styles.milestoneDay}>30 days</Text>
                  <Text style={styles.milestoneTitle}>One Month</Text>
                  <Text style={styles.milestoneText}>Financial awareness returns</Text>
                </View>
              </View>
              
              <View style={[styles.milestoneCard, styles.milestoneCardHighlight]}>
                <View style={[styles.milestoneCheckmark, styles.milestoneCheckmarkHighlight]}>
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.milestoneContent}>
                  <Text style={styles.milestoneDay}>90 days</Text>
                  <Text style={styles.milestoneTitle}>Full Reboot</Text>
                  <Text style={styles.milestoneText}>Healthy relationship with money</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.continueButton} onPress={handleNext}>
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </ScrollView>
        );

      case 'plan':
        return (
          <ScrollView style={styles.planContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.planTitle}>Your personalized recovery plan is ready</Text>
            <View style={styles.planCard}>
              <Text style={styles.planCardTitle}>Custom Recovery Plan</Text>
              <View style={styles.planItem}>
                <Ionicons name="checkmark-circle" size={20} color="#5B8DFF" />
                <Text style={styles.planItemText}>Daily check-ins & progress tracking</Text>
              </View>
              <View style={styles.planItem}>
                <Ionicons name="checkmark-circle" size={20} color="#5B8DFF" />
                <Text style={styles.planItemText}>Science-based recovery exercises</Text>
              </View>
              <View style={styles.planItem}>
                <Ionicons name="checkmark-circle" size={20} color="#5B8DFF" />
                <Text style={styles.planItemText}>Community support & accountability</Text>
              </View>
              <View style={styles.planItem}>
                <Ionicons name="checkmark-circle" size={20} color="#5B8DFF" />
                <Text style={styles.planItemText}>Brain healing visualization</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.getStartedButton} onPress={handleNext}>
              <Text style={styles.getStartedButtonText}>Get Started</Text>
            </TouchableOpacity>
          </ScrollView>
        );


      case 'notification':
        return (
          <ScrollView style={styles.notificationContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.notificationTitle}>Increase your willpower with some notification buffs</Text>
            <View style={styles.notificationCard}>
              <Text style={styles.notificationCardTitle}>Unbet Would Like to Send You Notifications</Text>
              <Text style={styles.notificationCardSubtext}>Notifications may include alerts, sounds, and icon badges. These can be configured in Settings.</Text>
              <View style={styles.notificationButtonsRow}>
                <TouchableOpacity style={styles.dontAllowButton} onPress={handleNext}>
                  <Text style={styles.dontAllowButtonText}>Don't Allow</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.allowButton} onPress={async () => {
                  if (Platform.OS !== 'web') {
                    try {
                      // Check if Notifications module is available (won't be in Expo Go)
                      if (Notifications && Notifications.getPermissionsAsync) {
                        const { status: existingStatus } = await Notifications.getPermissionsAsync();
                        let finalStatus = existingStatus;
                        if (existingStatus !== 'granted') {
                          const { status } = await Notifications.requestPermissionsAsync();
                          finalStatus = status;
                        }
                        if (finalStatus === 'granted') {
                          console.log('Notification permissions granted!');
                        }
                      } else {
                        console.log('Notifications module not available in Expo Go. Run with development build.');
                      }
                    } catch (error) {
                      console.log('Error requesting notification permissions:', error);
                      console.log('Note: Notifications require a development build. Run: npx expo run:ios');
                    }
                  }
                  handleNext();
                }}>
                  <Text style={styles.allowButtonText}>Allow</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.notificationPreviewCard}>
              <View style={styles.notificationPreviewHeader}>
                <View style={styles.notificationPreviewIcon}>
                  <Text style={styles.notificationPreviewIconText}>🟣</Text>
                </View>
                <View style={styles.notificationPreviewDetails}>
                  <Text style={styles.notificationPreviewApp}>nafs</Text>
                  <Text style={styles.notificationPreviewTime}>now</Text>
                </View>
              </View>
              <Text style={styles.notificationPreviewTitle}>Don't lose your streak!</Text>
              <Text style={styles.notificationPreviewBody}>Small steps compound to big results.</Text>
              <Text style={styles.notificationPreviewMore}>3 more notifications</Text>
            </View>
          </ScrollView>
        );


      case 'wakeup':
        return (
          <View style={styles.wakeupContainer}>
            <Text style={styles.wakeupTitle}>What time do you usually wake up?</Text>
            <Text style={styles.wakeupSubtitle}>We'll personalize your recovery schedule</Text>
            <View style={styles.timeSlots}>
              {[
                '5:00 AM - 6:00 AM',
                '6:00 AM - 7:00 AM',
                '7:00 AM - 8:00 AM',
                '8:00 AM - 9:00 AM',
                '9:00 AM - 10:00 AM',
                'After 10:00 AM'
              ].map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[styles.timeSlot, wakeupTime === time && styles.timeSlotSelected]}
                  onPress={() => setWakeupTime(time)}
                >
                  <Text style={[styles.timeSlotText, wakeupTime === time && styles.timeSlotTextSelected]}>
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity 
              style={[styles.continueButton, !wakeupTime && styles.continueButtonDisabled]} 
              onPress={handleNext}
              disabled={!wakeupTime}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        );

      case 'bedtime':
        return (
          <View style={styles.bedtimeContainer}>
            <Text style={styles.bedtimeTitle}>What time do you go to bed?</Text>
            <Text style={styles.bedtimeSubtitle}>Night time is often the most challenging</Text>
            <View style={styles.timeSlots}>
              {[
                'Before 9:00 PM',
                '9:00 PM - 10:00 PM',
                '10:00 PM - 11:00 PM',
                '11:00 PM - 12:00 AM',
                '12:00 AM - 1:00 AM',
                'After 1:00 AM'
              ].map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[styles.timeSlot, bedtime === time && styles.timeSlotSelected]}
                  onPress={() => setBedtime(time)}
                >
                  <Text style={[styles.timeSlotText, bedtime === time && styles.timeSlotTextSelected]}>
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity 
              style={[styles.continueButton, !bedtime && styles.continueButtonDisabled]} 
              onPress={handleNext}
              disabled={!bedtime}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        );

      case 'complete':
        return (
          <View style={styles.completeContainer}>
            <View style={styles.completeIconContainer}>
              <Ionicons name="checkmark-circle" size={100} color="#4CAF50" />
            </View>
            <Text style={styles.completeTitle}>You're all set!</Text>
            <Text style={styles.completeSubtitle}>Your journey to freedom starts now</Text>
            <TouchableOpacity style={styles.startJourneyButton} onPress={() => router.replace('/(main)')}>
              <Text style={styles.startJourneyButtonText}>Start Your Journey</Text>
            </TouchableOpacity>
          </View>
        );

      case 'religious':
        return (
          <View style={styles.religiousContainer}>
            <Text style={styles.questionTitle}>Are you religious ?</Text>
            <View style={styles.optionsContainer}>
              {[
                'Not Religious',
                'Christian',
                'Muslim',
                'Hindu',
                'Buddhist',
                'Judaism',
                'Other'
              ].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.optionButton, religious === option && styles.optionButtonSelected]}
                  onPress={() => {
                    setReligious(option);
                    handleNext();
                  }}
                >
                  <Text style={styles.optionButtonText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'last_relapse':
        return (
          <View style={styles.lastRelapseContainer}>
            <Text style={styles.questionTitle}>When was your last relapse ?</Text>
            <View style={styles.optionsContainer}>
              {[
                'Today',
                'Yesterday',
                '2 days ago',
                '3 days ago',
                '4 days ago',
                'A week ago',
                '2 weeks ago'
              ].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.optionButton, lastRelapse === option && styles.optionButtonSelected]}
                  onPress={() => {
                    setLastRelapse(option);
                    handleNext();
                  }}
                >
                  <Text style={styles.optionButtonText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'symptoms':
        return (
          <View style={styles.symptomsContainer}>
            <Text style={styles.symptomsTitle}>Gambling addiction may lead to these common symptoms</Text>
            <ScrollView style={styles.scrollContainer}>
              {[
                'Financial problems',
                'Relationship issues',
                'Loss of interest in hobbies',
                'Anxiety about money',
                'Lying about spending',
                'Chasing losses',
                'Mood swings'
              ].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.checkboxContainer}
                  onPress={() => {
                    if (symptoms.includes(option)) {
                      setSymptoms(symptoms.filter(s => s !== option));
                    } else {
                      setSymptoms([...symptoms, option]);
                    }
                  }}
                >
                  <View style={[styles.checkbox, symptoms.includes(option) && styles.checkboxSelected]}>
                    {symptoms.includes(option) && <View style={styles.radioInner} />}
                  </View>
                  <Text style={styles.checkboxText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity 
              style={styles.continueButton} 
              onPress={handleNext}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        );

      case 'graph':
        return (
          <View style={styles.graphContainer}>
            <ScrollView style={styles.graphScrollView} contentContainerStyle={styles.graphScrollContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.graphTitle}>Overcome gambling addiction in as little as 90 days.</Text>
              <Image 
                source={require('../assets/images/onboarding_graph.png')}
                style={styles.graphImage}
                resizeMode="contain"
              />
              <Text style={styles.graphSubtitle}>The key milestones are</Text>
              <View style={styles.graphItems}>
                <View style={styles.graphItem}>
                  <Text style={styles.graphIcon}>🟠</Text>
                  <Text style={styles.graphItemText}>Reduced anxiety and depression symptoms by around 20-30%.</Text>
                </View>
                <View style={styles.graphItem}>
                  <Text style={styles.graphIcon}>🟢</Text>
                  <Text style={styles.graphItemText}>Enhanced focus and cognitive performance, with improvements of 30-50%.</Text>
                </View>
                <View style={styles.graphItem}>
                  <Text style={styles.graphIcon}>🔵</Text>
                  <Text style={styles.graphItemText}>Increased relationship satisfaction by around 15-20%.</Text>
                </View>
              </View>
            </ScrollView>
            <TouchableOpacity style={styles.graphButton} onPress={handleNext}>
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        );

      case 'commitment':
        return (
          <ScrollView 
            style={styles.commitmentContainer} 
            contentContainerStyle={styles.commitmentContent}
            scrollEnabled={false}>
            <Text style={styles.commitmentTitle}>Let's commit.</Text>
            <Text style={styles.commitmentSubtitle}>From this day onwards, I commit to</Text>
            <View style={styles.commitmentItems}>
              <View style={styles.commitmentItem}>
                <Ionicons name="checkmark-circle" size={24} color="#5B8DFF" />
                <Text style={styles.commitmentItemText}>Prioritizing my mental and physical health</Text>
              </View>
              <View style={styles.commitmentItem}>
                <Ionicons name="checkmark-circle" size={24} color="#5B8DFF" />
                <Text style={styles.commitmentItemText}>Staying focused and productive</Text>
              </View>
              <View style={styles.commitmentItem}>
                <Ionicons name="checkmark-circle" size={24} color="#5B8DFF" />
                <Text style={styles.commitmentItemText}>Letting go of my past self</Text>
              </View>
              <View style={styles.commitmentItem}>
                <Ionicons name="checkmark-circle" size={24} color="#5B8DFF" />
                <Text style={styles.commitmentItemText}>Becoming the person I want to be</Text>
              </View>
            </View>
            <View style={styles.signatureBox}>
              <View style={styles.signatureCanvas} {...panResponder.panHandlers}>
                <Svg 
                  height={150} 
                  width={Dimensions.get('window').width - 60}
                  style={styles.signatureSvg}
                  viewBox={`0 0 ${Dimensions.get('window').width - 60} 150`}
                >
                  {signaturePaths.map((path, index) => {
                    const pathData = pathToSvg(path);
                    return pathData ? (
                      <Path
                        key={`path-${index}`}
                        d={pathData}
                        stroke="#5B8DFF"
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    ) : null;
                  })}
                  {currentPath.length > 0 && pathToSvg(currentPath) && (
                    <Path
                      d={pathToSvg(currentPath)}
                      stroke="#5B8DFF"
                      strokeWidth="3"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                </Svg>
                {signaturePaths.length === 0 && currentPath.length === 0 && (
                  <Text style={styles.signatureText}>Sign here with your finger before moving to next page</Text>
                )}
              </View>
              {(signaturePaths.length > 0 || currentPath.length > 0) && (
                <TouchableOpacity style={styles.clearButton} onPress={clearSignature}>
                  <Text style={styles.clearButtonText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity 
              style={[styles.commitButton, signaturePaths.length === 0 && styles.commitButtonDisabled]} 
              onPress={handleNext}
              disabled={signaturePaths.length === 0}
            >
              <Text style={[styles.commitButtonText, signaturePaths.length === 0 && styles.commitButtonTextDisabled]}>
                I commit to myself
              </Text>
            </TouchableOpacity>
          </ScrollView>
        );


      case 'signup':
        return (
          <View style={styles.signupContainer}>
            <Text style={styles.signupTitle}>Create your account</Text>
            <Text style={styles.signupSubtitle}>Join thousands on the path to freedom</Text>
            <TouchableOpacity style={styles.authButton} onPress={() => handleOAuthSignUp('oauth_apple')}>
              <Ionicons name="logo-apple" size={24} color="#FFFFFF" />
              <Text style={styles.authButtonText}>Continue with Apple</Text>
            </TouchableOpacity>
            <Text style={styles.termsText}>
              By continuing, you agree to our{' '}
              <Text 
                style={styles.termsLink}
                onPress={() => Linking.openURL('https://tryunbet.com/privacy.html')}
              >
                Terms & Privacy Policy
              </Text>
            </Text>
          </View>
        );

      default:
        return (
          <View style={styles.defaultContainer}>
            <Text style={styles.defaultText}>Screen {screen.id} - {screen.type}</Text>
            <TouchableOpacity style={styles.continueButton} onPress={handleNext}>
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {currentStep > 0 && (
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  { width: `${((currentStep + 1) / screens.length) * 100}%` }
                ]} 
              />
            </View>
            <View style={{ width: 40 }} />
          </View>
        )}
        {renderScreen()}
      </SafeAreaView>
    </View>
  );
}

// Typography constants
const typography = {
  headline: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  subheadline: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  body: {
    fontSize: 18,
    fontWeight: '400' as const,
    color: '#FFFFFF',
    lineHeight: 26,
  },
  bodySmall: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: '#999999',
    lineHeight: 24,
  },
  button: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: '#999999',
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    ...(Platform.OS === 'web' ? { height: '100vh' } : {}),
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  progressBarContainer: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginLeft: 20,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#5B8DFF',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 120,
    paddingBottom: 80,
  },
  starsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  star: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
  },
  welcomeContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  welcomeTitle: {
    fontSize: 64,
    fontFamily: 'DMSerifDisplay_400Regular',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 72,
    marginBottom: 32,
    letterSpacing: -1,
  },
  welcomeTitleGold: {
    color: '#FFD700',
    textShadowColor: '#FFD700',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  welcomeSubtitle: {
    fontSize: 20,
    fontFamily: 'DMSans_500Medium',
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.85,
    lineHeight: 28,
    letterSpacing: 0.2,
  },
  welcomeActions: {
    width: '100%',
    alignItems: 'center',
  },
  welcomeButton: {
    backgroundColor: '#5B7FDE',
    paddingHorizontal: 60,
    paddingVertical: 20,
    borderRadius: 30,
    marginBottom: 24,
    shadowColor: '#5B7FDE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  welcomeButtonText: {
    fontSize: 18,
    fontFamily: 'DMSans_700Bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  loginButton: {
    marginBottom: 20,
  },
  loginButtonText: {
    fontSize: 17,
    fontFamily: 'DMSans_500Medium',
    color: '#FFFFFF',
    opacity: 0.75,
    letterSpacing: 0.2,
  },
  gradientOrbContainer: {
    position: 'absolute',
    bottom: -400,
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  gradientOrb: {
    width: 800,
    height: 800,
    borderRadius: 400,
    opacity: 0.3,
  },
  statsContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 10,
  },
  statsScrollView: {
    flex: 1,
  },
  statsScrollContent: {
    paddingBottom: 20,
  },
  statsButton: {
    backgroundColor: '#5B8DFF',
    paddingVertical: 20,
    borderRadius: 40,
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 30,
  },
  statsTitle: {
    fontSize: 32,
    fontFamily: 'DMSerifDisplay_400Regular',
    color: '#FFFFFF',
    lineHeight: 40,
    marginBottom: 12,
  },
  statsBig: {
    marginBottom: 15,
  },
  statsBigNumber: {
    fontSize: 90,
    fontFamily: 'DMSerifDisplay_400Regular',
    color: '#FFFFFF',
    lineHeight: 90,
  },
  statsBigUnit: {
    fontSize: 36,
    fontFamily: 'DMSans_400Regular',
    color: '#FFFFFF',
    lineHeight: 40,
  },
  statsDescription: {
    fontSize: 20,
    color: '#5B8DFF',
    marginBottom: 30,
    lineHeight: 28,
  },
  statsItems: {
    marginBottom: 20,
  },
  statsItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  statsIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  statsItemText: {
    fontSize: 18,
    color: '#FFFFFF',
    lineHeight: 24,
    flex: 1,
    opacity: 0.9,
  },
  continueButton: {
    backgroundColor: '#5B8DFF',
    paddingVertical: 20,
    borderRadius: 40,
    alignItems: 'center',
    marginTop: 20,
    marginHorizontal: 30,
    marginBottom: 30,
  },
  continueButtonText: {
    ...typography.button,
    fontSize: 20,
  },
  communityContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 15,
  },
  communityTitle: {
    fontSize: 40,
    fontFamily: 'DMSerifDisplay_400Regular',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  communitySubtitle: {
    fontSize: 20,
    fontFamily: 'DMSans_400Regular',
    color: '#FFFFFF',
    opacity: 0.7,
    marginBottom: 48,
  },
  communityCard: {
    backgroundColor: '#1A1A2E',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  communityEmoji: {
    fontSize: 48,
    marginBottom: 20,
  },
  communityCardTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 30,
  },
  communityNumber: {
    fontSize: 72,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  communityStatus: {
    fontSize: 18,
    color: '#5B8DFF',
  },
  healingContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 15,
  },
  healingTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 40,
    marginBottom: 40,
  },
  healingImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brainImage: {
    width: 300,
    height: 300,
  },
  lifeContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 15,
  },
  lifeTitle: {
    fontSize: 40,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 48,
    marginBottom: 48,
  },
  lifeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  lifeItem: {
    width: '48%',
    backgroundColor: '#1A1A2E',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  lifeIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  lifeItemTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  lifeItemSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.6,
    textAlign: 'center',
  },
  transformContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 15,
  },
  transformTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 40,
    marginBottom: 40,
  },
  transformTestimonials: {
    marginTop: 20,
  },
  testimonial: {
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
  },
  testimonialQuote: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  testimonialAuthor: {
    fontSize: 14,
    color: '#5B8DFF',
  },
  defaultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultText: {
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 40,
  },
  // Session duration styles
  durationContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 15,
  },
  questionTitle: {
    ...typography.headline,
    lineHeight: 40,
    marginBottom: 40,
  },
  optionsContainer: {
    flex: 1,
  },
  optionButton: {
    backgroundColor: '#5B8DFF',
    borderRadius: 30,
    paddingVertical: 20,
    paddingHorizontal: 32,
    marginBottom: 12,
    borderWidth: 0,
  },
  optionButtonSelected: {
    backgroundColor: '#5B8DFF',
  },
  optionButtonText: {
    ...typography.button,
    fontSize: 20,
    textAlign: 'center',
  },
  // Motivation styles
  motivationContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 15,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5B8DFF',
    borderRadius: 40,
    padding: 22,
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: '#FFFFFF',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  checkboxText: {
    fontSize: 18,
    color: '#FFFFFF',
    flex: 1,
    fontFamily: 'DMSans_500Medium',
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  // Blockers styles
  blockersContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 15,
    alignItems: 'center',
  },
  blockersTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  blockersSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 40,
    textAlign: 'center',
  },
  blockersCard: {
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginBottom: 40,
    width: '100%',
  },
  blockersIcon: {
    marginBottom: 20,
  },
  blockersCardTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  blockersCardSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.7,
    textAlign: 'center',
  },
  installButton: {
    backgroundColor: '#5B8DFF',
    paddingVertical: 20,
    paddingHorizontal: 60,
    borderRadius: 40,
    marginBottom: 15,
  },
  installButtonText: {
    ...typography.button,
  },
  skipButton: {
    paddingVertical: 10,
  },
  skipButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    opacity: 0.7,
    textDecorationLine: 'underline',
  },
  // Track styles
  trackContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 15,
    alignItems: 'center',
  },
  trackTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 40,
    marginBottom: 40,
    textAlign: 'center',
  },
  phoneContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneMockup: {
    width: 250,
    height: 500,
    backgroundColor: '#1A1A2E',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2A2A4A',
  },
  phoneMockupText: {
    color: '#5B8DFF',
    fontSize: 16,
  },
  // Science styles
  scienceContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 10,
    justifyContent: 'space-between',
  },
  scienceTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  scienceSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 40,
    textAlign: 'center',
  },
  scienceItems: {
    flex: 1,
    justifyContent: 'center',
    marginVertical: 20,
  },
  scienceItem: {
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
  },
  scienceItemTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 10,
    marginBottom: 5,
  },
  scienceItemText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.7,
    textAlign: 'center',
  },
  // Days styles
  daysContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 15,
  },
  daysTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 40,
    marginBottom: 50,
    textAlign: 'center',
  },
  milestonesContainer: {
    paddingHorizontal: 0,
    marginBottom: 40,
  },
  milestoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  milestoneCardHighlight: {
    backgroundColor: '#1A2E1A',
    borderColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  milestoneCheckmark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#5B8DFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  milestoneCheckmarkHighlight: {
    backgroundColor: '#4CAF50',
  },
  milestoneContent: {
    flex: 1,
  },
  milestoneDay: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5B8DFF',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  milestoneTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  milestoneText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.7,
    lineHeight: 20,
  },
  milestoneLine: {
    width: 2,
    height: 40,
    backgroundColor: '#2A2A3E',
    marginBottom: 20,
  },
  // Plan styles
  planContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 15,
  },
  planTitle: {
    ...typography.headline,
    lineHeight: 36,
    marginBottom: 30,
    textAlign: 'center',
  },
  planCard: {
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    padding: 30,
    marginBottom: 40,
  },
  planCardTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  planItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  planItemText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 10,
    flex: 1,
  },
  getStartedButton: {
    backgroundColor: '#5B8DFF',
    paddingVertical: 20,
    borderRadius: 40,
    marginTop: 30,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  getStartedButtonText: {
    ...typography.button,
    textAlign: 'center',
  },
  // Choose plan styles
  choosePlanContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 15,
  },
  choosePlanTitle: {
    ...typography.headline,
    marginBottom: 30,
    textAlign: 'center',
  },
  planOption: {
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  planOptionSelected: {
    borderColor: '#5B8DFF',
    backgroundColor: '#2A2A3E',
  },
  planOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  planOptionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  planBadge: {
    backgroundColor: '#5B8DFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  planBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  planSavings: {
    fontSize: 16,
    color: '#4CAF50',
    marginBottom: 5,
  },
  planTotal: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.7,
  },
  termsText: {
    fontSize: 12,
    fontFamily: 'DMSans_300Light',
    color: '#FFFFFF',
    opacity: 0.5,
    textAlign: 'center',
    marginTop: 20,
  },
  termsLink: {
    color: '#5B8DFF',
    textDecorationLine: 'underline',
  },
  // Success styles
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  successIcon: {
    marginBottom: 30,
  },
  successTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  successSubtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 40,
  },
  // Notification styles
  notificationContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 15,
  },
  notificationTitle: {
    fontSize: 32,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 40,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    marginBottom: 40,
  },
  notificationCardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 10,
  },
  notificationCardSubtext: {
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  notificationButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingTop: 15,
  },
  dontAllowButton: {
    flex: 1,
  },
  dontAllowButtonText: {
    fontSize: 17,
    color: '#007AFF',
    textAlign: 'center',
  },
  allowButton: {
    flex: 1,
  },
  allowButtonText: {
    fontSize: 17,
    color: '#007AFF',
    textAlign: 'center',
    fontWeight: '600',
  },
  notificationPreviewCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 14,
    padding: 16,
    marginTop: 40,
  },
  notificationPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationPreviewIcon: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: '#8B85F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  notificationPreviewIconText: {
    fontSize: 16,
  },
  notificationPreviewDetails: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  notificationPreviewApp: {
    fontSize: 13,
    color: '#666666',
  },
  notificationPreviewTime: {
    fontSize: 13,
    color: '#999999',
  },
  notificationPreviewTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  notificationPreviewBody: {
    fontSize: 15,
    color: '#666666',
    marginBottom: 8,
  },
  notificationPreviewMore: {
    fontSize: 13,
    color: '#999999',
  },
  enableButton: {
    backgroundColor: '#5B8DFF',
    paddingVertical: 20,
    paddingHorizontal: 60,
    borderRadius: 40,
    marginBottom: 15,
  },
  enableButtonText: {
    ...typography.button,
  },
  // Notification time styles
  notificationTimeContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 15,
  },
  notificationTimeTitle: {
    ...typography.headline,
    lineHeight: 36,
    marginBottom: 40,
  },
  timeOptions: {
    flex: 1,
  },
  timeOption: {
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  timeOptionSelected: {
    borderColor: '#5B8DFF',
    backgroundColor: '#2A2A3E',
  },
  timeOptionText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  timeOptionTextSelected: {
    color: '#5B8DFF',
  },
  // Custom time styles
  customTimeContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 15,
    alignItems: 'center',
  },
  customTimeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 40,
  },
  timePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    padding: 20,
    marginBottom: 40,
  },
  timePickerText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginLeft: 10,
  },
  // Wakeup/Bedtime styles
  wakeupContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 15,
  },
  wakeupTitle: {
    ...typography.headline,
    marginBottom: 10,
  },
  wakeupSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 30,
  },
  bedtimeContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 15,
  },
  bedtimeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  bedtimeSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 30,
  },
  timeSlots: {
    flex: 1,
  },
  timeSlot: {
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  timeSlotSelected: {
    borderColor: '#5B8DFF',
    backgroundColor: '#2A2A3E',
  },
  timeSlotText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  timeSlotTextSelected: {
    color: '#5B8DFF',
  },
  // Age range styles
  ageRangeContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 15,
  },
  startAgeContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 15,
  },
  // Partner styles
  partnerContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 15,
  },
  partnerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  partnerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 40,
  },
  partnerOption: {
    backgroundColor: '#1A1A2E',
    borderRadius: 25,
    paddingVertical: 20,
    paddingHorizontal: 30,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  partnerOptionSelected: {
    borderColor: '#5B8DFF',
    backgroundColor: '#2A2A3E',
  },
  partnerOptionText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  partnerOptionTextSelected: {
    color: '#5B8DFF',
  },
  // Goal styles
  goalContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 15,
  },
  goalTitle: {
    ...typography.headline,
    marginBottom: 30,
  },
  goalScroll: {
    flex: 1,
    marginBottom: 100,
  },
  goalOption: {
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  goalOptionSelected: {
    borderColor: '#5B8DFF',
    backgroundColor: '#2A2A3E',
  },
  goalOptionText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  goalOptionTextSelected: {
    color: '#5B8DFF',
  },
  // Frequency styles
  frequencyContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 15,
  },
  frequencyTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  frequencySubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 30,
  },
  frequencyOptions: {
    flex: 1,
  },
  frequencyOption: {
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  frequencyOptionSelected: {
    borderColor: '#5B8DFF',
    backgroundColor: '#2A2A3E',
  },
  frequencyOptionText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  frequencyOptionTextSelected: {
    color: '#5B8DFF',
  },
  // Trigger styles
  triggerContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 15,
  },
  triggerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  triggerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 30,
  },
  triggerScroll: {
    flex: 1,
    marginBottom: 100,
  },
  // Signup styles
  signupContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  signupTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  signupSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 40,
    textAlign: 'center',
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 30,
    marginBottom: 15,
    width: '100%',
    justifyContent: 'center',
  },
  authButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 10,
    fontFamily: 'DMSans_500Medium',
  },
  // Complete styles
  completeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  completeIconContainer: {
    marginBottom: 30,
  },
  completeTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  completeSubtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 40,
  },
  startJourneyButton: {
    backgroundColor: '#5B8DFF',
    paddingVertical: 20,
    paddingHorizontal: 60,
    borderRadius: 40,
  },
  startJourneyButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  // New screen styles
  sexuallyActiveContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 15,
  },
  gamblingIncreaseContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 15,
  },
  riskEscalationContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 15,
  },
  religiousContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 15,
  },
  lastRelapseContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 15,
  },
  symptomsContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 15,
  },
  symptomsTitle: {
    fontSize: 32,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 40,
    marginBottom: 32,
  },
  graphContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 10,
  },
  graphScrollView: {
    flex: 1,
  },
  graphScrollContent: {
    paddingBottom: 20,
  },
  graphButton: {
    backgroundColor: '#5B8DFF',
    paddingVertical: 20,
    borderRadius: 40,
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 30,
  },
  graphTitle: {
    fontSize: 32,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 40,
    marginBottom: 32,
  },
  graphImage: {
    width: '100%',
    height: 200,
    marginBottom: 24,
  },
  graphSubtitle: {
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 20,
  },
  graphItems: {
    marginBottom: 60,
  },
  graphItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  graphIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  graphItemText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 22,
    flex: 1,
  },
  commitmentContainer: {
    flex: 1,
  },
  commitmentContent: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingTop: 15,
    paddingBottom: 30,
  },
  commitmentTitle: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  commitmentSubtitle: {
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 32,
  },
  commitmentItems: {
    marginBottom: 40,
  },
  commitmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  commitmentItemText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginLeft: 12,
  },
  signatureBox: {
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    height: 150,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#5B8DFF',
    overflow: 'hidden',
  },
  signatureCanvas: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  signatureSvg: {
    backgroundColor: 'transparent',
  },
  signatureText: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -120 }, { translateY: -10 }],
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.5,
    textAlign: 'center',
    width: 240,
  },
  clearButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#5B8DFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  clearButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  commitButton: {
    backgroundColor: '#5B8DFF',
    paddingVertical: 20,
    borderRadius: 40,
    marginTop: 30,
    marginHorizontal: 30,
    marginBottom: 20,
  },
  commitButtonDisabled: {
    backgroundColor: '#333',
    opacity: 0.5,
  },
  commitButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  commitButtonTextDisabled: {
    color: '#666',
  },
});