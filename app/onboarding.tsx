import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TextInput, Image, Dimensions, ActivityIndicator, Animated, Alert } from 'react-native';
import { useSignUp, useOAuth, useAuth as useClerkAuth } from '@clerk/clerk-expo';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Picker } from '@react-native-picker/picker';
import { useMutation, useQuery, useConvex } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { LinearGradient } from 'expo-linear-gradient';
import { useRevenueCat } from '../providers/RevenueCatProvider';
// Only import RevenueCat UI on native platforms
let RevenueCatUI: any = {};
let PAYWALL_RESULT: any = {};
if (Platform.OS !== 'web') {
  const rcUI = require("react-native-purchases-ui");
  RevenueCatUI = rcUI.default;
  PAYWALL_RESULT = rcUI.PAYWALL_RESULT;
}
import { Haptics } from '../utils/haptics';
import { ExternalLink } from '../components/ExternalLink';
import { requestRating, trackRatingAction, shouldShowRating } from '../utils/ratings';
import { validateReferralCode, getReferralDetails } from './utils/referralCodes';
import AdjustEvents from '@/utils/adjustEvents';
import FacebookSDK from '@/utils/facebook';
import LottieView from 'lottie-react-native';
import { useAnalytics } from '@/providers/AnalyticsProvider';

type OnboardingMode = 'full' | 'user_details' | 'signin';



const goals = [
  { icon: '🥗', text: 'Minimal healthy amount' },
  { icon: '🍳', text: 'Lose weight' },
  { icon: '💪', text: 'Maintain muscle mass' },
  { icon: '🍗', text: 'Body recomposition [+ muscle - fat]' },
  { icon: '🍔', text: 'Bulk up' },
  { icon: '🏋️‍♂️', text: 'Bodybuilding' },
];

const sexOptions = ['Male', 'Female', 'Other'];

const introSlides = [
  {
    image: require('../assets/images/scan.jpeg'),
    text: 'Protein tracking made easy',
    subtext: 'Just snap a picture, and we\'ll do the rest',
  },
  {
    image: require('../assets/images/track.jpeg'),
    text: 'Hit your protein goal every day',
    subtext: 'Track your progress and stay on target',
  },
  {
    image: require('../assets/images/amino.jpeg'),
    text: 'Essential amino acid analysis',
    subtext: 'Make sure you\'re getting enough of the right stuff',
  },
];

const dietOptions = [
  { icon: '🍗', text: 'Classic' },
  { icon: '🐟', text: 'Pescatarian' },
  { icon: '🥕', text: 'Vegetarian' },
  { icon: '🌱', text: 'Vegan' },
];

const trainingFrequency = [
  { text: '0-1 times per week', value: 0 },
  { text: '2-3 times per week', value: 2 },
  { text: '4-5 times per week', value: 4 },
  { text: '6+ times per week', value: 6 },
];

const trainingTypes = [
  { icon: '🏋️', text: 'Weight Training' },
  { icon: '🏃', text: 'Running' },
  { icon: '🤸', text: 'Calisthenics' },
  { icon: '🚴', text: 'Cardio (HIIT/Cycling)' },
  { icon: '🏓', text: 'Other' },
];

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
  const { packages, purchasePackage } = useRevenueCat();
  const [mode, setMode] = useState<OnboardingMode>('full');
  const [selectedRating, setSelectedRating] = useState(0);
  const [referralInput, setReferralInput] = useState('');
  const { signOut, isLoaded, isSignedIn } = useClerkAuth();
  const convex = useConvex();
  // Only query user if we're in user_details mode (authenticated)
  const user = mode === 'user_details' ? useQuery(api.users.getCurrentUser) : undefined;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef<ScrollView>(null);
  // Analytics
  const analytics = useAnalytics();

  const { mode: onboardingMode } = useLocalSearchParams<{ mode?: OnboardingMode }>();

  // Check if device is small
  const windowDimensions = Dimensions.get('window');
  const isSmallDevice = windowDimensions.height < 700;

  // DEV ONLY: Check for skip to paywall parameter
  const skipToPaywall = __DEV__ && onboardingMode === 'skip-to-paywall';
  
  // Set mode based on URL parameter
  useEffect(() => {
    if (onboardingMode === 'signin') {
      setMode('signin');
      setCurrentStep(1);
    } else if (onboardingMode === 'user_details') {
      setMode('user_details');
    }
  }, [onboardingMode]);
  
  const steps = [
    { key: 'intro', question: '', subtext: '' },
    ...(mode === 'signin' ? [
      { key: 'signin', question: 'Sign In', subtext: 'Welcome back to Seed' }
    ] : [
      { key: 'sex', question: 'Choose your Gender', subtext: 'This helps us tailor your protein recommendations' },
      { key: 'age', question: 'How old are you?', subtext: 'Age affects your protein needs and metabolism' },
      { key: 'heightWeight', question: 'Height & Weight', subtext: 'This will be used to calibrate your custom plan.' },
      { key: 'training_frequency', question: 'How often do you train?', subtext: 'Training frequency affects your protein needs' },
      { key: 'training_type', question: 'What type of training do you do?', subtext: 'Different activities have different protein requirements' },
      { key: 'goals', question: 'What is your goal?', subtext: 'Your goals shape your personalized protein plan' },
      { key: 'diet', question: 'Do you follow a specific diet?', subtext: 'This helps us tailor your protein recommendations' },
      { key: 'referralCode', question: 'Do you have a referral code?', subtext: 'Enter your referral code if you have one' },
      { key: 'rating', question: 'We\'re a small team', subtext: '' },
      { key: 'calculateProtein', question: '', subtext: '' },
      { key: 'results', question: onboardingMode === 'user_details' ? 'Custom plan updated!' : 'Your custom plan is ready!', subtext: onboardingMode === 'user_details' ? 'Your new protein target has been saved' : 'Here\'s what we recommend based on your data' },
      { key: 'signup', question: 'Create an account', subtext: 'Sign up to save your progress and start tracking' },
    ]),
  ];

  useEffect(() => {
    if (onboardingMode === 'user_details') {
      setMode('user_details');
      setCurrentStep(1);
    } else if (skipToPaywall) {
      // DEV ONLY: Skip to results step (paywall shows after this)
      setProteinResult({ dailyProtein: '120' }); // Mock protein result
      const resultsStepIndex = steps.findIndex(step => step.key === 'results');
      setCurrentStep(resultsStepIndex);
    }
  }, [mode, skipToPaywall]);

  // Track whenever the user views a new onboarding step, emitting a unique
  // event name for each screen so we can analyse them separately in Mixpanel.
  useEffect(() => {
    const stepKey = steps[currentStep].key;

    analytics.track({
      name: `Onboarding Viewed - ${stepKey}`,
      properties: {
        index: currentStep,
        mode,
      },
    });
    // We purposefully leave `steps` out of deps to avoid triggering when the
    // array identity changes – `currentStep` provides the necessary signal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  // Pulsing animation for loading text
  useEffect(() => {
    if (isLoading) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    }
  }, [isLoading, pulseAnim]);

  const isStepComplete = () => {
    switch (steps[currentStep].key) {
      case 'intro':
        return true;
      case 'sex':
        return userData.sex !== '';
      case 'age':
        return userData.age !== '';
      case 'heightWeight':
        if (useMetric) {
          return userData.height !== '' && userData.weight !== '';
        } else {
          return userData.heightFt !== '' && userData.heightIn !== '' && userData.weightLbs !== '';
        }
      case 'training_frequency':
        return userData.training_frequency !== '';
      case 'training_type':
        return userData.training_type.length > 0;
      case 'goals':
        return userData.goals !== '';
      case 'diet':
        return userData.diet !== '';
      case 'referralCode':
        // Always allow proceeding from this step, validation happens in handleNext
        return true;
      case 'results':
        return true;
      case 'rating':
        return true;
      case 'signup':
        return true;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    // Validate referral code when trying to leave the referral step
    if (steps[currentStep].key === 'referralCode' && referralInput.trim()) {
      const isValid = validateReferralCode(referralInput);
      if (!isValid) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        alert('Invalid referral code. Please check the code or leave the field empty.');
        // Clear the local input state after showing the alert
        setReferralInput('');
        return; // Stop progression
      }
      // If valid, provide success feedback (optional)
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // // OPTIONAL: If you want to save the validated code to main userData *now*
      // setUserData(prev => ({ ...prev, referralCode: referralInput.toUpperCase() }));
    }

    // Check general step completion
    if (isStepComplete()) {
      // Track completion of the current step before moving on, using unique
      // event names per step as requested.
      const completedStepKey = steps[currentStep].key;
      analytics.track({
        name: `Onboarding Completed - ${completedStepKey}`,
        properties: {
          index: currentStep,
          mode,
        },
      });

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Handle sign-in step
      if (steps[currentStep].key === 'signin') {
        setMode('full');
        setCurrentStep(0);
        return;
      }

      // Handle rating step
      if (steps[currentStep].key === 'rating') {
        setCurrentStep(currentStep + 1);
        return;
      }

      // Handle referral code step with special offers (only if valid or empty)
      if (steps[currentStep].key === 'referralCode') {
        if (referralInput.trim() && validateReferralCode(referralInput)) {
          const referralDetails = getReferralDetails(referralInput);
          if (referralDetails?.type === 'free' && referralDetails.duration === 'lifetime') {
            console.log('User has a free lifetime access code from input:', referralInput);
          }
        } else {
          // Handle empty code case if necessary
        }
      }

      if (mode === 'user_details') {
        if (currentStep === 9) {
          await calculateOptimalProtein();
        } else if (currentStep === 10) {
          // Update user: Use the validated referralInput value
          let referralCodeToSave = '';
          if (referralInput.trim() && validateReferralCode(referralInput)) {
            referralCodeToSave = referralInput.toUpperCase();
          }
          await updateUser({
            goals: userData.goals,
            sex: userData.sex,
            age: parseInt(userData.age),
            height: parseInt(userData.height),
            weight: parseInt(userData.weight),
            diet: userData.diet,
            dailyProtein: parseInt(proteinResult.dailyProtein),
            training_type: userData.training_type,
            training_frequency: parseInt(userData.training_frequency),
            referralCode: referralCodeToSave,
          });
          router.back();
          return;
        }
      } else {
        if (currentStep === steps.length - 2) {
          // Check if user has a valid free referral code from the input
          const hasFreePlan = referralInput.trim() &&
            validateReferralCode(referralInput) &&
            getReferralDetails(referralInput)?.type === 'free';

          if (hasFreePlan) {
            setCurrentStep(currentStep + 1);
            return;
          }

          try {
            // For users with special paywall referral codes, use their specific paywall
            const referralDetails = referralInput &&
              validateReferralCode(referralInput)
              ? getReferralDetails(referralInput)
              : null;

            // Note: In a production app, you would use the paywallId to show a specific paywall
            // but we'll just show the default paywall for simplicity
            console.log(referralDetails && referralDetails.type === 'paywall'
              ? `Would show special paywall: ${referralDetails.paywallId}`
              : 'Showing default paywall');

            if (Platform.OS === 'web') {
              alert('Subscription required. Please use the mobile app to subscribe.');
              return;
            }

            const result = await RevenueCatUI.presentPaywall();

            switch (result) {
              case PAYWALL_RESULT.PURCHASED:
              case PAYWALL_RESULT.RESTORED:
                setCurrentStep(currentStep + 1);
                break;
              case PAYWALL_RESULT.CANCELLED:
              case PAYWALL_RESULT.ERROR:
              case PAYWALL_RESULT.NOT_PRESENTED:
              default:
                alert('Please subscribe to continue');
                break;
            }
          } catch (error) {
            console.error('Paywall error:', error);
            alert('Something went wrong. Please try again.');
          }
          return;
        }
      }

      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    } else {
      // This case should technically not be hit for referralCode step now
      // but kept for other steps
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      alert("Please complete this step before proceeding.");
    }
  };

  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // If we're in user_details mode and at the first visible step (sex selection)
    if (mode === 'user_details' && currentStep === 1) {
      router.back();
      return;
    }

    // If we're in signin mode and at the signin step
    if (mode === 'signin' && currentStep === 1) {
      // Go back to intro from sign-in
      setMode('full');
      setCurrentStep(0);
      return;
    }

    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleInputChange = async (key: string, value: string | string[]) => {
    await Haptics.selectionAsync();
    if (key === 'training_type') {
      setUserData(prev => ({
        ...prev,
        training_type: prev.training_type.includes(value as string)
          ? prev.training_type.filter(type => type !== value)
          : [...prev.training_type, value as string]
      }));
    } else if (key === 'referralCode') {
      // Update the local input state only
      setReferralInput(value as string);
    } else {
      // Update main userData for other fields
      setUserData(prev => ({ ...prev, [key]: value }));
    }
  };

  const handleOAuthSignUp = async (strategy: "oauth_google" | "oauth_apple") => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    analytics.track({ name: 'Signup Attempt', properties: { strategy } });
    try {
      const startOAuthFlow = strategy === "oauth_google" ? startGoogleOAuthFlow : startAppleOAuthFlow;
      const { createdSessionId, setActive } = await startOAuthFlow();

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });

        // Add delay to ensure auth is ready
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Process referral code if valid (read from local input state)
        let referralCodeToStore = '';
        if (referralInput.trim() && validateReferralCode(referralInput)) {
          referralCodeToStore = referralInput.toUpperCase();

          const referralDetails = getReferralDetails(referralInput);
          if (referralDetails?.type === 'paywall') {
            console.log('Applying special paywall from referral code:', referralDetails.paywallId);
          }
        }

        // First store the user
        await store();

        // Then update with additional data, using the validated code
        await updateUser({
          goals: userData.goals,
          sex: userData.sex,
          age: parseInt(userData.age),
          height: parseInt(userData.height),
          weight: parseInt(userData.weight),
          diet: userData.diet,
          dailyProtein: parseInt(proteinResult.dailyProtein),
          training_type: userData.training_type,
          training_frequency: parseInt(userData.training_frequency),
          referralCode: referralCodeToStore,
        });

        // Track successful signup in analytics
        analytics.track({ name: 'Signup Success', properties: { strategy } });

        // Optionally, identify the user by their Clerk session id (or later Convex id)
        if (createdSessionId) {
          analytics.identify(createdSessionId);
        }

        // Track successful signup as a rating action
        trackRatingAction();

        // Track onboarding completion in Adjust
        AdjustEvents.trackOnboardingCompleted();

        // Log Meta (Facebook) standard event -> CompletedOnboarding / CompletedTutorial
        FacebookSDK.logCompletedOnboarding();

        router.replace('/(main)');
      }
    } catch (err) {
      analytics.track({ name: 'Signup Failure', properties: { strategy, error: JSON.stringify(err) } });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error("OAuth error", JSON.stringify(err));
    }
  };

  const handleOAuthSignIn = async (strategy: "oauth_google" | "oauth_apple") => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    analytics.track({ name: 'Signin Attempt', properties: { strategy } });
    
    // Check if user is already signed in
    if (isSignedIn) {
      console.log('User already signed in, redirecting...');
      router.replace('/(main)');
      return;
    }
    
    try {
      const startOAuthFlow = strategy === "oauth_google" ? startGoogleOAuthFlow : startAppleOAuthFlow;
      const { createdSessionId, setActive } = await startOAuthFlow();

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });

        // Add delay to ensure auth is ready
        await new Promise(resolve => setTimeout(resolve, 2000));

        // First, ensure the user exists in Convex by calling store
        // This handles the case where user exists in Clerk but not in Convex
        try {
          await store();
        } catch (error) {
          console.error('Error storing user in Convex:', error);
        }

        // Now check if user exists in Convex database
        const convexUser = await convex.query(api.users.getCurrentUser);

        if (!convexUser) {
          // This should rarely happen now, but keep as failsafe
          // User doesn't exist in Convex, sign out, alert, and reset
          await signOut();
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          // Alert import might be missing, ensure it's imported from 'react-native'
          Alert.alert(
            "Account Not Found",
            "Account not found, please sign up first.",
            [{ text: "OK" }]
          );
          // analytics.track logic from diff would go here
          setMode('full');
          setCurrentStep(0);
          setIsLoading(false);
          return;
        }

        // User exists, proceed with sign in
        analytics.track({ name: 'Signin Success', properties: { strategy } });

        if (createdSessionId) {
          analytics.identify(createdSessionId);
        }

        router.replace('/(main)');
      }
    } catch (err) {
      analytics.track({ name: 'Signin Failure', properties: { strategy, error: JSON.stringify(err) } });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error("OAuth error", JSON.stringify(err));
      // alert('Sign in failed. Please try again.');
      // Avoid generic alert if we handled specific case above
      if (err instanceof Error && !err.message?.includes('User not found')) { // Check if it's an Error and not the specific handled case
        Alert.alert('Sign In Failed', 'Please try again.');
      } else if (!(err instanceof Error)) {
        // Handle cases where err is not an Error object (e.g., a string or other type)
        Alert.alert('Sign In Failed', 'An unknown error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchToSignIn = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMode('signin');
    setCurrentStep(1);
  };

  // Calculate dynamic sizes based on device
  const getCarouselHeight = () => {
    const imageWidth = Math.min(Dimensions.get('window').width - 40, Dimensions.get('window').width * 0.8);
    // Calculate height based on image size plus space for text
    const textHeight = isSmallDevice ? 90 : 110;
    return imageWidth + textHeight;
  };

  const renderCarouselItem = ({ item }: { item: typeof introSlides[0] }) => {
    // Calculate square size based on screen width
    const imageWidth = Math.min(Dimensions.get('window').width - 40, Dimensions.get('window').width * 0.8);

    return (
      <View style={styles.carouselItem}>
        <Image
          source={item.image}
          style={[
            styles.carouselImage,
            {
              width: imageWidth,
              height: imageWidth, // Make it square by setting height equal to width
              borderRadius: 12,
            }
          ]}
          resizeMode="cover"
        />
        <View style={styles.carouselTextContainer}>
          <Text style={[styles.carouselText, isSmallDevice && styles.carouselTextSmall]}>{item.text}</Text>
          <Text style={[styles.carouselSubtext, isSmallDevice && styles.carouselSubtextSmall]}>{item.subtext}</Text>
        </View>
      </View>
    );
  };

  const calculateOptimalProtein = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);

    setTimeout(() => {
      const weight = useMetric ? parseFloat(userData.weight) : parseFloat(userData.weightLbs) * 0.453592;
      const age = parseInt(userData.age);
      const trainingFreq = parseInt(userData.training_frequency);

      // Base multiplier based on activity level and sex
      let proteinMultiplier = userData.sex === 'Female' ? 0.7 : 0.8; // Lower baseline for females

      // Rest of the adjustments...
      if (trainingFreq >= 6) proteinMultiplier += 0.4;
      else if (trainingFreq >= 4) proteinMultiplier += 0.3;
      else if (trainingFreq >= 2) proteinMultiplier += 0.2;

      // Training type adjustments
      let trainingTypeMultiplier = 0;
      userData.training_type.forEach(type => {
        let multiplier = 0;
        // Slightly lower multipliers for females due to different muscle protein synthesis rates
        const genderFactor = userData.sex === 'Female' ? 0.8 : 1;

        if (type === 'Weight Training') multiplier = 0.4 * genderFactor;
        else if (['Calisthenics', 'HIIT'].includes(type)) multiplier = 0.3 * genderFactor;
        else if (['Running', 'Cardio'].includes(type)) multiplier = 0.2 * genderFactor;
        trainingTypeMultiplier = Math.max(trainingTypeMultiplier, multiplier);
      });
      proteinMultiplier += trainingTypeMultiplier;

      // Goals adjustments with sex consideration
      const goalMultiplier = userData.sex === 'Female' ? 0.9 : 1; // Slightly lower multipliers for females
      switch (userData.goals) {
        case 'Bodybuilding':
          proteinMultiplier += 0.8 * goalMultiplier;
          break;
        case 'Bulk up':
          proteinMultiplier += 0.6 * goalMultiplier;
          break;
        case 'Body recomposition [+ muscle - fat]':
          proteinMultiplier += 0.5 * goalMultiplier;
          break;
        case 'Maintain muscle mass':
          proteinMultiplier += 0.3 * goalMultiplier;
          break;
        case 'Lose weight':
          proteinMultiplier += 0.4 * goalMultiplier;
          break;
      }

      // Rest of the code remains the same...
      if (age > 50) proteinMultiplier += 0.1;
      if (age > 65) proteinMultiplier += 0.2;
      if (userData.diet === 'Vegan') proteinMultiplier += 0.1;

      const dailyProtein = Math.round(weight * proteinMultiplier);

      setProteinResult({
        dailyProtein: dailyProtein.toString(),
      });

      // Track this significant user action
      trackRatingAction();

      setIsLoading(false);
      // Find the index of the results step
      const resultsStepIndex = steps.findIndex(step => step.key === 'results');
      setCurrentStep(resultsStepIndex);
    }, 3000);
  };

  const renderStepContent = () => {
    if (mode === 'user_details') {
      if (['intro', 'signup'].includes(steps[currentStep].key)) {
        handleNext();
        return null;
      }
    }

    const step = steps[currentStep];
    return (
      <>
        {step.question && (
          <View style={styles.stepHeader}>
            <Text style={styles.question}>{step.question}</Text>
            <Text style={styles.subtext}>{step.subtext}</Text>
          </View>
        )}
        <View style={[styles.stepContent, currentStep === 0 && { flex: 1 }]}>
          {(() => {
            switch (step.key) {
              case 'intro':
                return (
                  <View style={styles.welcomeContainer}>
                    {/* Star decorations */}
                    <View style={styles.starsContainer}>
                      <View style={[styles.star, { top: '15%', left: '10%', width: 4, height: 4 }]} />
                      <View style={[styles.star, { top: '25%', left: '85%', width: 6, height: 6 }]} />
                      <View style={[styles.star, { top: '35%', left: '15%', width: 3, height: 3 }]} />
                      <View style={[styles.star, { top: '60%', left: '90%', width: 5, height: 5 }]} />
                      <View style={[styles.star, { top: '70%', left: '5%', width: 4, height: 4 }]} />
                      <View style={[styles.star, { top: '80%', left: '80%', width: 3, height: 3 }]} />
                    </View>
                    <View style={styles.welcomeContent}>
                      <Text style={styles.welcomeTitle}>Welcome{'\n'}to Seed</Text>
                      <Text style={styles.welcomeSubtitle}>Unleash your Potential.{'\n'}Leave Porn Behind.</Text>
                    </View>
                  </View>
                );
              case 'signin':
                return (
                  <View style={styles.signupButtonsContainer}>
                    {isSignedIn ? (
                      <>
                        <Text style={styles.alreadySignedInText}>You're already signed in</Text>
                        <TouchableOpacity
                          style={styles.oauthButton}
                          onPress={() => router.replace('/(main)')}
                        >
                          <Ionicons name="home-outline" size={24} color={Colors.light.text} />
                          <Text style={styles.oauthButtonText}>Go to Home</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.oauthButton, { backgroundColor: '#FF3B30' }]}
                          onPress={async () => {
                            await signOut();
                            setMode('full');
                            setCurrentStep(0);
                          }}
                        >
                          <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
                          <Text style={[styles.oauthButtonText, { color: '#FFFFFF' }]}>Sign Out</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                        <TouchableOpacity
                          style={styles.oauthButton}
                          onPress={() => handleOAuthSignIn("oauth_google")}
                        >
                          <Ionicons name="logo-google" size={24} color={Colors.light.text} />
                          <Text style={styles.oauthButtonText}>Sign in with Google</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.oauthButton}
                          onPress={() => handleOAuthSignIn("oauth_apple")}
                        >
                          <Ionicons name="logo-apple" size={24} color={Colors.light.text} />
                          <Text style={styles.oauthButtonText}>Sign in with Apple</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                );
              case 'goals':
                return (
                  <>
                    {goals.map((goal) => (
                      <TouchableOpacity
                        key={goal.text}
                        style={[
                          styles.optionButton,
                          userData.goals === goal.text && styles.optionButtonSelected
                        ]}
                        onPress={() => handleInputChange('goals', goal.text)}
                      >
                        <Text style={styles.optionIcon}>{goal.icon}</Text>
                        <Text style={[styles.optionText, userData.goals === goal.text && styles.optionTextSelected]}>{goal.text}</Text>
                      </TouchableOpacity>
                    ))}
                  </>
                );
              case 'age':
                return (
                  <>
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={userData.age}
                        onValueChange={(itemValue) => handleInputChange('age', itemValue)}
                        style={styles.picker}
                        itemStyle={styles.pickerItem}
                      >
                        {Array.from({ length: 100 }, (_, i) => i + 1).map((age) => (
                          <Picker.Item key={age} label={age.toString()} value={age.toString()} />
                        ))}
                      </Picker>
                    </View>
                  </>
                );
              case 'heightWeight':
                return (
                  <>
                    <View style={styles.unitToggle}>
                      <Text style={[styles.unitText, !useMetric && styles.activeUnitText]}>Imperial</Text>
                      <TouchableOpacity
                        style={[styles.toggleSwitch, useMetric && styles.toggleSwitchOn]}
                        onPress={() => setUseMetric(!useMetric)}
                      >
                        <View style={[styles.toggleButton, useMetric && styles.toggleButtonOn]} />
                      </TouchableOpacity>
                      <Text style={[styles.unitText, useMetric && styles.activeUnitText]}>Metric</Text>
                    </View>
                    <View style={styles.heightWeightContainer}>
                      <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Height</Text>
                        {useMetric ? (
                          <View style={styles.pickerContainer}>
                            <Picker
                              selectedValue={userData.height}
                              onValueChange={(itemValue) => handleInputChange('height', itemValue)}
                              style={styles.picker}
                              itemStyle={styles.pickerItem}
                            >
                              {Array.from({ length: 220 }, (_, i) => i + 100).map((cm) => (
                                <Picker.Item key={cm} label={`${cm} cm`} value={cm.toString()} />
                              ))}
                            </Picker>
                          </View>
                        ) : (
                          <View style={styles.imperialInputs}>
                            <View style={[styles.pickerContainer, styles.imperialInput]}>
                              <Picker
                                selectedValue={userData.heightFt}
                                onValueChange={(itemValue) => handleInputChange('heightFt', itemValue)}
                                style={styles.picker}
                                itemStyle={styles.pickerItem}
                              >
                                {Array.from({ length: 8 }, (_, i) => i + 1).map((ft) => (
                                  <Picker.Item key={ft} label={`${ft} ft`} value={ft.toString()} />
                                ))}
                              </Picker>
                            </View>
                            <View style={[styles.pickerContainer, styles.imperialInput]}>
                              <Picker
                                selectedValue={userData.heightIn}
                                onValueChange={(itemValue) => handleInputChange('heightIn', itemValue)}
                                style={styles.picker}
                                itemStyle={styles.pickerItem}
                              >
                                {Array.from({ length: 12 }, (_, i) => i).map((inch) => (
                                  <Picker.Item key={inch} label={`${inch} in`} value={inch.toString()} />
                                ))}
                              </Picker>
                            </View>
                          </View>
                        )}
                      </View>
                      <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Weight</Text>
                        {useMetric ? (
                          <View style={styles.pickerContainer}>
                            <Picker
                              selectedValue={userData.weight}
                              onValueChange={(itemValue) => handleInputChange('weight', itemValue)}
                              style={styles.picker}
                              itemStyle={styles.pickerItem}
                            >
                              {Array.from({ length: 200 }, (_, i) => i + 30).map((weight) => (
                                <Picker.Item key={weight} label={`${weight} ${useMetric ? 'kg' : 'lb'}`} value={weight.toString()} />
                              ))}
                            </Picker>
                          </View>
                        ) : (
                          <View style={styles.pickerContainer}>
                            <Picker
                              selectedValue={userData.weightLbs}
                              onValueChange={(itemValue) => handleInputChange('weightLbs', itemValue)}
                              style={styles.picker}
                              itemStyle={styles.pickerItem}
                            >
                              {Array.from({ length: 200 }, (_, i) => i + 30).map((weight) => (
                                <Picker.Item key={weight} label={`${weight} lbs`} value={weight.toString()} />
                              ))}
                            </Picker>
                          </View>
                        )}
                      </View>
                    </View>
                  </>
                );
              case 'sex':
                return (
                  <>
                    {sexOptions.map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.optionButton,
                          userData.sex === option && styles.optionButtonSelected
                        ]}
                        onPress={() => handleInputChange('sex', option)}
                      >
                        <Text style={[
                          styles.optionText,
                          userData.sex === option && styles.optionTextSelected
                        ]}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </>
                );
              case 'diet':
                return (
                  <>
                    {dietOptions.map((option) => (
                      <TouchableOpacity
                        key={option.text}
                        style={[
                          styles.optionButton,
                          userData.diet === option.text && styles.optionButtonSelected
                        ]}
                        onPress={() => handleInputChange('diet', option.text)}
                      >
                        <Text style={styles.optionIcon}>{option.icon}</Text>
                        <Text style={[
                          styles.optionText,
                          userData.diet === option.text && styles.optionTextSelected
                        ]}>{option.text}</Text>
                      </TouchableOpacity>
                    ))}
                  </>
                );
              case 'referralCode':
                return (
                  <View style={styles.referralContainer}>
                    <View style={styles.referralInputContainer}>
                      <TextInput
                        style={styles.referralInput}
                        placeholder="Enter referral code (optional)"
                        value={referralInput}
                        onChangeText={setReferralInput}
                        autoCapitalize="characters"
                        autoCorrect={false}
                      />
                    </View>
                    <Text style={styles.referralInfo}>
                      Enter a referral code if you have one. Press Next to validate.
                    </Text>
                  </View>
                );
              case 'training_frequency':
                return (
                  <>
                    {trainingFrequency.map((freq) => (
                      <TouchableOpacity
                        key={freq.text}
                        style={[
                          styles.optionButton,
                          userData.training_frequency === freq.value.toString() && styles.optionButtonSelected
                        ]}
                        onPress={() => handleInputChange('training_frequency', freq.value.toString())}
                      >
                        <Text style={[
                          styles.optionText,
                          userData.training_frequency === freq.value.toString() && styles.optionTextSelected
                        ]}>{freq.text}</Text>
                      </TouchableOpacity>
                    ))}
                  </>
                );
              case 'training_type':
                return (
                  <>
                    {trainingTypes.map((type) => (
                      <TouchableOpacity
                        key={type.text}
                        style={[
                          styles.optionButton,
                          userData.training_type.includes(type.text) && styles.optionButtonSelected
                        ]}
                        onPress={() => handleInputChange('training_type', type.text)}
                      >
                        <Text style={styles.optionIcon}>{type.icon}</Text>
                        <Text style={[
                          styles.optionText,
                          userData.training_type.includes(type.text) && styles.optionTextSelected
                        ]}>{type.text}</Text>
                      </TouchableOpacity>
                    ))}
                  </>
                );
              case 'calculateProtein':
                return isLoading ? (
                  <View style={styles.loadingContainer}>
                    <LottieView
                      source={require('../assets/lottie/cosmos.json')}
                      autoPlay
                      loop
                      style={{ width: 100, height: 100 }}
                    />
                    <Animated.Text
                      style={[
                        styles.loadingText,
                        { transform: [{ scale: pulseAnim }] }
                      ]}
                    >
                      Calculating your optimal intake...
                    </Animated.Text>
                  </View>
                ) : (
                  <View>
                    <View style={styles.allSetContainer}>
                      <Ionicons style={{ marginBottom: 10 }} name="checkmark-circle" size={24} color={Colors.light.tint} />
                      <Text style={[styles.question, { textAlign: 'center', paddingHorizontal: 20 }]}>All set! Let's calculate your optimal intake</Text>
                      <Text style={[styles.subtext, { textAlign: 'center', paddingHorizontal: 20 }]}>We promise to always keep your data private and secure</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.nextButton}
                      onPress={calculateOptimalProtein}
                    >
                      <Text style={styles.nextButtonText}>Calculate optimal intake</Text>
                    </TouchableOpacity>
                  </View>
                );
              case 'results':
                return (
                  <View style={styles.resultsContainer}>
                    <Text style={styles.resultText}>Your recommended daily protein intake:</Text>
                    <Text style={styles.resultValue}>{proteinResult.dailyProtein} g</Text>
                    <View style={styles.infoContainer}>
                      <Text style={styles.infoText}>
                        This recommendation is based on your body composition, activity level, training type, and goals.
                        Aim to spread your protein intake across 4-6 meals throughout the day for optimal absorption.
                      </Text>
                      <View style={styles.sourceLinks}>
                        <Text style={styles.sourcesTitle}>Estimation based on the following sources, among other peer-reviewed medical studies:</Text>
                        <ExternalLink
                          href="https://pubmed.ncbi.nlm.nih.gov/28698222/"
                          style={styles.sourceLink}
                        >
                          • Protein requirements for athletes
                        </ExternalLink>
                        <ExternalLink
                          href="https://pubmed.ncbi.nlm.nih.gov/24257722/"
                          style={styles.sourceLink}
                        >
                          • Timing and distribution of intake
                        </ExternalLink>
                        <ExternalLink
                          href="https://pubmed.ncbi.nlm.nih.gov/22150425/"
                          style={styles.sourceLink}
                        >
                          • Age-related protein needs
                        </ExternalLink>
                      </View>
                    </View>
                  </View>
                );
              case 'rating':
                return (
                  <View style={styles.ratingContainer}>
                    <Text style={styles.ratingText}>
                      So a rating goes a long way 💜
                    </Text>
                    <View style={styles.starsContainer}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                          key={star}
                          name="star"
                          size={40}
                          color={Colors.light.tint}
                          style={styles.starIcon}
                        />
                      ))}
                    </View>
                    <TouchableOpacity
                      style={styles.ratingButton}
                      onPress={() => requestRating(true)}
                    >
                      <Text style={styles.ratingButtonText}>Leave a rating</Text>
                    </TouchableOpacity>
                  </View>
                );
              case 'signup':
                return (
                  <View style={styles.signupButtonsContainer}>
                    <TouchableOpacity
                      style={styles.oauthButton}
                      onPress={() => handleOAuthSignUp("oauth_google")}
                    >
                      <Ionicons name="logo-google" size={24} color={Colors.light.text} />
                      <Text style={styles.oauthButtonText}>Sign in with Google</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.oauthButton}
                      onPress={() => handleOAuthSignUp("oauth_apple")}
                    >
                      <Ionicons name="logo-apple" size={24} color={Colors.light.text} />
                      <Text style={styles.oauthButtonText}>Sign in with Apple</Text>
                    </TouchableOpacity>
                  </View>
                );
            }
          })()}
        </View>
      </>
    );
  };

  return (
    <View style={[styles.container, currentStep === 0 && styles.darkContainer]}>
      <SafeAreaView style={styles.container}>
        {currentStep > 0 && (
          <View style={styles.headerContainer}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
            </TouchableOpacity>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${(currentStep / (steps.length - 1)) * 100}%` }]} />
            </View>
          </View>
        )}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
        >
          <View style={styles.contentContainer}>
            {renderStepContent()}
          </View>

          {(currentStep < steps.length - 1 && !isLoading && steps[currentStep].key !== 'calculateProtein') && (
            <TouchableOpacity
              style={[
                styles.nextButton,
                !isStepComplete() && styles.nextButtonDisabled,
                currentStep === 0 && styles.introButton
              ]}
              onPress={handleNext}
              disabled={!isStepComplete()}
            >
              <Text style={[styles.nextButtonText, currentStep === 0 && styles.introButtonText]}>
                {currentStep === 0 ? "Start my journey" :
                  mode === 'user_details' && currentStep === 10 ? 'Continue' :
                  currentStep === steps.length - 2 ? "Let's get started!" :
                    steps[currentStep].key === 'rating' ? "Ok, I rated 👍" : "Next"}
              </Text>
            </TouchableOpacity>
          )}

          {currentStep === 0 && (
            <>
              <TouchableOpacity
                style={[styles.loginButton, styles.introLoginButton]}
                onPress={handleSwitchToSignIn}
              >
                <Text style={styles.introLoginButtonText}>
                  Login
                </Text>
              </TouchableOpacity>
            </>
          )}
        </KeyboardAvoidingView>
        
        {currentStep === 0 && (
          <View style={styles.gradientOrbContainer}>
            <LinearGradient
              colors={['#5B6FED', '#7B8FFF', '#9BAFFF', 'transparent']}
              style={styles.gradientOrb}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  darkContainer: {
    backgroundColor: '#000000',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    padding: 20,
    paddingBottom: 0,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 0,
  },
  backButton: {
    padding: 5,
  },
  progressBarContainer: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.light.progressBar,
    marginLeft: 20,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.light.progressBarFill,
  },
  stepHeader: {
    marginBottom: 20,
  },
  question: {
    fontSize: 28,
    fontFamily: 'DMSerifDisplay_400Regular',
    marginBottom: 10,
    color: Colors.light.text,
  },
  subtext: {
    fontSize: 16,
    fontFamily: 'DMSans_400Regular',
    color: Colors.light.text,
    marginBottom: 20,
    textAlign: 'left',
  },
  stepContent: {
    flex: 1,
    justifyContent: 'center',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.buttonBackground,
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  optionButtonSelected: {
    backgroundColor: Colors.light.tint,
  },
  optionIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  optionText: {
    fontSize: 16,
    color: Colors.light.buttonText,
  },
  optionTextSelected: {
    color: Colors.light.buttonSelectedText,
  },
  input: {
    backgroundColor: Colors.light.buttonBackground,
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  oauthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.buttonBackground,
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    width: '100%',
    justifyContent: 'center',
  },
  oauthButtonText: {
    fontSize: 16,
    color: Colors.light.buttonText,
    marginLeft: 10,
  },
  alreadySignedInText: {
    fontSize: 18,
    fontFamily: 'DMSans_500Medium',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  nextButton: {
    backgroundColor: Colors.light.tint,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    margin: 20,
  },
  nextButtonDisabled: {
    backgroundColor: Colors.light.buttonBackground,
    opacity: 0.5,
  },
  nextButtonText: {
    color: Colors.light.background,
    fontSize: 18,
    fontFamily: 'DMSans_700Bold',
  },
  loginButton: {
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 10,
  },
  loginButtonText: {
    color: Colors.light.tint,
    fontSize: 16,
    fontWeight: '600',
  },
  introContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    width: '100%',
  },
  carouselItem: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 0,
    paddingBottom: 0,
    marginBottom: 0,
  },
  carouselImage: {
    marginBottom: 15,
  },
  carouselTextContainer: {
    padding: 8,
    alignItems: 'center',
    marginBottom: 10,
    maxWidth: '90%',
  },
  carouselText: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: Colors.light.text,
  },
  carouselTextSmall: {
    fontSize: 18,
    marginBottom: 5,
  },
  carouselSubtext: {
    fontSize: 15,
    textAlign: 'center',
    color: Colors.light.text,
    paddingHorizontal: 20,
  },
  carouselSubtextSmall: {
    fontSize: 13,
    paddingHorizontal: 10,
  },
  pagerView: {
    height: Dimensions.get('window').height < 700 ?
      Math.min(Dimensions.get('window').width * 0.8 + 80, 380) :
      Math.min(Dimensions.get('window').width * 0.8 + 120, 500),
  },
  paginationContainer: {
    width: '100%',
    paddingTop: 0,
    paddingBottom: 5,
    marginTop: 5,
    marginBottom: 5,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  paginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.text,
    opacity: 0.3,
    marginHorizontal: 6,
  },
  paginationDotActive: {
    opacity: 1,
    backgroundColor: Colors.light.tint,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  paginationDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  unitToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  unitText: {
    fontSize: 16,
    color: Colors.light.text,
    opacity: 0.5,
    marginHorizontal: 10,
  },
  activeUnitText: {
    opacity: 1,
  },
  toggleSwitch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.light.buttonBackground,
    justifyContent: 'center',
    padding: 2,
  },
  toggleSwitchOn: {
    backgroundColor: Colors.light.tint,
  },
  toggleButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.light.background,
  },
  toggleButtonOn: {
    alignSelf: 'flex-end',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 5,
    textAlign: 'center',
  },
  imperialInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  imperialInput: {
    width: '58%',
  },
  pickerContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    width: '100%',
  },
  picker: {
    backgroundColor: Colors.light.background,
    height: 150,
  },
  pickerItem: {
    fontSize: 14,
  },
  heightWeightContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputContainer: {
    width: '48%',
    marginBottom: 20,
  },
  signupButtonsContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  allSetContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsContainer: {
    alignItems: 'center',
    padding: 10,
  },
  resultText: {
    fontSize: 18,
    fontFamily: 'DMSans_700Bold',
    marginBottom: 10,
    color: Colors.light.text,
    textAlign: 'center',
  },
  resultValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.light.tint,
    marginBottom: 10,
  },
  resultSubtext: {
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: Colors.light.buttonBackground,
    borderRadius: 12,
    padding: 15,
    marginTop: 20,
  },
  infoText: {
    fontSize: 14,
    color: Colors.light.text,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.light.text,
  },
  sourceLinks: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#ccc"
  },
  sourcesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 8,
  },
  sourceLink: {
    textDecorationLine: 'underline',
    fontSize: 14,
    color: Colors.light.tint,
    marginBottom: 6,
  },
  ratingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 30,
  },
  starsContainer: {
    flexDirection: 'row',
    marginVertical: 10,
  },
  starIcon: {
    marginHorizontal: 5,
  },
  ratingButton: {
    backgroundColor: Colors.light.tint,
    padding: 15,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  ratingButtonText: {
    color: Colors.light.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  ratingText: {
    fontSize: 18,
    color: Colors.light.text,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 10,
  },
  referralContainer: {
    width: '100%',
    marginBottom: 20,
  },
  referralInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  referralInput: {
    backgroundColor: Colors.light.buttonBackground,
    padding: 15,
    borderRadius: 12,
    flex: 1,
    fontSize: 16,
  },
  referralInfo: {
    fontSize: 14,
    color: Colors.light.text,
    opacity: 0.7,
    textAlign: 'center',
    marginTop: 5,
  },
  scrollViewContent: {
    alignItems: 'center',
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  welcomeContent: {
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 52,
    fontFamily: 'DMSerifDisplay_400Regular',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 58,
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    fontSize: 20,
    fontFamily: 'DMSans_400Regular',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 28,
    opacity: 0.85,
  },
  gradientOrbContainer: {
    position: 'absolute',
    bottom: -250,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  gradientOrb: {
    width: 700,
    height: 700,
    borderRadius: 350,
    opacity: 0.4,
  },
  introButton: {
    backgroundColor: '#5B8DFF',
    marginHorizontal: 30,
    marginBottom: 15,
    paddingVertical: 16,
    borderRadius: 25,
  },
  introButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'DMSans_500Medium',
  },
  introLoginButton: {
    backgroundColor: 'transparent',
    marginTop: 0,
    marginBottom: 40,
  },
  introLoginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '400',
    textDecorationLine: 'underline',
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
    opacity: 0.3,
  },
});
