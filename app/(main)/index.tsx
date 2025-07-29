import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Platform, Alert, TouchableWithoutFeedback, FlatList, ScrollView } from 'react-native';
import { Dimensions } from '@/utils/dimensions';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { LinearGradient } from 'expo-linear-gradient';
import { format, subDays, parseISO, addDays } from 'date-fns';
import { Colors } from '@/constants/Colors';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { Haptics } from '../../utils/haptics';
import { useRevenueCat } from '@/providers/RevenueCatProvider';
// Only import RevenueCat UI on native platforms
let RevenueCatUI: any = {};
let PAYWALL_RESULT: any = {};
if (Platform.OS !== 'web') {
  const rcUI = require("react-native-purchases-ui");
  RevenueCatUI = rcUI.default;
  PAYWALL_RESULT = rcUI.PAYWALL_RESULT;
}
import { Swipeable } from 'react-native-gesture-handler';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import Animated, {
  withSpring,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { WeekView } from '@/components/home/WeekView';
import { NumericInput } from '@/components/home/NumericInput';
import { trackRatingAction, requestRating, shouldShowRating } from '@/utils/ratings';
import { getReferralDetails } from '../utils/referralCodes';

type RouteNames = '/camera' | '/describe' | '/qr';

type ProteinPreset = {
  name: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  weight: number;
  calories: number;
  proteinPercent: number;
};

const PROTEIN_PRESETS: ProteinPreset[] = [
  {
    name: 'Chicken Breast',
    icon: 'food-drumstick-outline',
    weight: 100,        // 100g serving
    calories: 165,      // kcal per 100g
    proteinPercent: 30  // ~31% protein
  },
  {
    name: 'Greek Yogurt',
    icon: 'cup-outline',
    weight: 170,        // ~6oz serving
    calories: 100,      // kcal per serving
    proteinPercent: 9   // ~9% protein
  },
  {
    name: 'Whey Shake',
    icon: 'shaker-outline',
    weight: 30,         // typical scoop
    calories: 120,      // kcal per scoop
    proteinPercent: 83  // ~83% protein
  },
  {
    name: 'Steak',
    icon: 'food-steak',
    weight: 150,        // typical serving
    calories: 375,      // kcal per serving
    proteinPercent: 26.5  // ~27% protein
  },
  {
    name: 'Protein Bar',
    icon: 'rectangle-outline',
    weight: 60,         // typical bar
    calories: 220,      // kcal per bar
    proteinPercent: 33  // ~33% protein
  },
  {
    name: 'Eggs',
    icon: 'egg-outline',
    weight: 50,         // 1 large egg
    calories: 70,       // kcal per egg
    proteinPercent: 12  // ~12% protein
  }
];

export default function HomeScreen() {
  // Add error handling for user query
  const user = useQuery(api.users.getCurrentUser);
  const recentJobs = useQuery(api.analyse.getRecentAnalysisJobs);
  const deleteEntry = useMutation(api.protein.deleteProteinEntry);
  const store = useMutation(api.users.store);
  const today = format(new Date(), 'yyyy-MM-dd');
  const router = useRouter();
  
  // Log authentication state for debugging and ensure user creation
  useEffect(() => {
    const ensureUserExists = async () => {
      if (user === undefined) {
        console.log('User query is loading...');
      } else if (user === null) {
        console.log('User is not authenticated in Convex, attempting to create...');
        try {
          await store();
          console.log('User created successfully in Convex');
        } catch (error) {
          console.error('Failed to create user in Convex:', error);
        }
      } else {
        console.log('User authenticated:', user._id);
      }
    };
    
    ensureUserExists();
  }, [user, store]);
  const [selectedDate, setSelectedDate] = useState(today);
  const multiWeekData = useQuery(api.protein.getMultiWeekProteinData, { date: today });
  const proteinEntries = multiWeekData?.dailyTotals[selectedDate];
  const dailyProtein = proteinEntries?.totalProtein;
  const remainingProtein = (user?.dailyProtein ?? 0) - (dailyProtein ?? 0);
  const [currentPage, setCurrentPage] = useState(1);
  const scrollViewRef = useRef<ScrollView>(null);
  const { user: rcUser } = useRevenueCat();
  const [isExpanded, setIsExpanded] = useState(false);
  const rotation = useSharedValue(0);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['25%', '50%'], []);
  const [shakeProtein, setShakeProtein] = useState('25');
  const mainButtonOpacity = useSharedValue(1);
  const mainButtonDisplay = useSharedValue(true);
  const addProteinEntry = useMutation(api.protein.addProteinEntry);
  const savedFoods = useQuery(api.protein.getSavedFoods);
  const [activeTab, setActiveTab] = useState('quick');
  const savedFoodsBottomSheetRef = useRef<BottomSheet>(null);
  const savedFoodsSnapPoints = useMemo(() => ['75%', '90%'], []);
  const [fixingEntries, setFixingEntries] = useState<Set<string>>(new Set());
  const fixJobs = useQuery(api.analyse.getFixJobs);

  // ----------------- Analytics -----------------
  const analytics = useAnalytics();

  // Track when the home screen is displayed
  useEffect(() => {
    analytics.track({ name: 'Home Viewed' });
    // Track once on mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (fixJobs) {
      const newFixingEntries = new Set<string>();
      fixJobs.forEach(job => {
        if (job.status === 'pending') {
          newFixingEntries.add(job.entryId.toString());
        }
      });
      setFixingEntries(newFixingEntries);
    }
  }, [fixJobs]);

  // Check for rating eligibility when component mounts
  useEffect(() => {
    const checkRating = async () => {
      const canRate = await shouldShowRating();
      if (canRate) {
        requestRating();
      }
    };

    checkRating();
  }, []);

  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const mainButtonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: mainButtonOpacity.value,
    display: mainButtonDisplay.value ? 'flex' : 'none',
    transform: [
      { scale: mainButtonOpacity.value },
      { rotate: `${rotation.value}deg` }
    ]
  }));

  const buttonPositions = [
    { x: useSharedValue(0), y: useSharedValue(0) }, // Saved Foods
    { x: useSharedValue(0), y: useSharedValue(0) }, // Quick Add
    { x: useSharedValue(0), y: useSharedValue(0) }, // Describe
    { x: useSharedValue(0), y: useSharedValue(0) }, // Camera
  ];

  const animatedButtonStyles = buttonPositions.map((position) =>
    useAnimatedStyle(() => {
      const isMoving = Math.abs(position.y.value) > 20 || Math.abs(position.x.value) > 20;
      return {
        transform: [
          { translateX: position.x.value },
          { translateY: position.y.value },
        ],
        opacity: withTiming(isMoving ? 1 : 0, {
          duration: isMoving ? 150 : 10
        }),
        pointerEvents: isMoving ? 'auto' : 'none',
      };
    })
  );


  const RightSwipeActions = ({ onDelete }: { onDelete: () => void }) => {
    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={onDelete}
      >
        <Ionicons name="trash-outline" size={28} color="#FF3B30" />
      </TouchableOpacity>
    );
  }


  const toggleExpand = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);

    // Check for pro access OR free referral code before expanding
    const hasFreeAccess = user?.referralCode && getReferralDetails(user.referralCode)?.type === 'free';

    if (!rcUser.pro && !hasFreeAccess) {
      if (Platform.OS === 'web') {
        alert('Premium feature. Please use the mobile app to access this feature.');
        return;
      }
      
      try {
        const result = await RevenueCatUI.presentPaywall();
        if (result !== PAYWALL_RESULT.PURCHASED && result !== PAYWALL_RESULT.RESTORED) {
          return;
        }
        // Re-check access after potential purchase
        if (!rcUser.pro && !hasFreeAccess) {
          return;
        }
      } catch (error) {
        console.error('Paywall error:', error);
        alert('Something went wrong. Please try again.');
        return;
      }
    }

    // Track when the floating action menu is opened/closed
    analytics.track({
      name: isExpanded ? 'Home Action Menu Closed' : 'Home Action Menu Opened',
    });

    // Original expand logic
    const newValue = !isExpanded;
    setIsExpanded(newValue);

    const expandConfig = {
      damping: 20,
      stiffness: 600,
      mass: 0.3,
    };

    const collapseConfig = {
      damping: 15,
      stiffness: 300,
      mass: 0.5,
    };

    const config = newValue ? expandConfig : collapseConfig;

    rotation.value = withSpring(newValue ? 23 : 0, config);

    const verticalSpacing = 90;
    const screenWidth = 160;

    buttonPositions.forEach((position, index) => {
      const row = 1 - Math.floor(index / 2);
      const col = index % 2;

      position.y.value = withSpring(
        newValue ? -(row * verticalSpacing + verticalSpacing) : 0,
        config
      );
      position.x.value = withSpring(
        newValue ? -(screenWidth - (col * 170) + 20) : 0,
        config
      );
    });
  };

  // Generate dates for all weeks
  const getWeekDates = (offset: number) => {
    const currentDate = new Date();
    const dates: Date[] = [];
    const offsetDate = addDays(currentDate, offset * 7);
    // Get Monday of the week
    const day = offsetDate.getDay() || 7;
    let startDate = subDays(offsetDate, day - 1);

    // Generate 7 days starting from Monday
    for (let i = 0; i < 7; i++) {
      dates.push(addDays(startDate, i));
    }
    return dates;
  };

  // Handle scroll events to update current page
  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const pageWidth = event.nativeEvent.layoutMeasurement.width;
    const newPage = Math.round(offsetX / pageWidth);
    if (newPage !== currentPage) {
      setCurrentPage(newPage);
    }
  };

  // Add loading state when changing dates
  const handleDateSelect = (date: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedDate(date);

    analytics.track({ name: 'Home Date Selected', properties: { date } });
  };
  // Calculate progress for the circle
  const progress = (dailyProtein ?? 0) / (user?.dailyProtein ?? 1);
  const getProgressColor = (progress: number) => {
    if (progress === 0) return '#FF0000'; // Red
    if (progress <= 0.25) return '#FFA500'; // Orange
    if (progress <= 0.75) return '#E6B800'; // Darker yellow for better readability
    if (progress <= 1) return '#4CAF50'; // Green
    return '#006400'; // Dark Green
  };

  const resetAnimations = useCallback(() => {
    setIsExpanded(false);
    rotation.value = withSpring(0, {
      damping: 15,
      stiffness: 300,
      mass: 0.5,
    });

    const config = {
      damping: 15,
      stiffness: 300,
      mass: 0.5,
    };

    buttonPositions.forEach((position) => {
      position.y.value = withSpring(0, config);
      position.x.value = withSpring(0, config);
    });
  }, []);

  const handleAddPress = async (route: RouteNames) => {
    resetAnimations();

    // Track this as a significant action that can trigger a rating prompt
    await trackRatingAction();

    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      analytics.track({
        name: 'Home Action - Navigate',
        properties: { route },
      });

      router.push({
        pathname: route,
        params: { selectedDate }
      });
    }, 100);
  };

  const handleShakePress = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    resetAnimations();

    // Track this as a significant action that can trigger a rating prompt
    await trackRatingAction();

    setTimeout(() => {
      bottomSheetRef.current?.expand();
    }, 100);

    analytics.track({ name: 'Home Action - Quick Protein Opened' });
    mainButtonOpacity.value = withTiming(0, { duration: 200 });
    mainButtonDisplay.value = false;
  }, [resetAnimations]);

  const handleDescribePress = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    resetAnimations();

    // Track this as a significant action that can trigger a rating prompt
    await trackRatingAction();

    setTimeout(() => {
      router.push({
        pathname: '/describe',
        params: { selectedDate }
      });
    }, 100);

    analytics.track({ name: 'Home Action - Describe Meal' });
  }, [resetAnimations, selectedDate]);

  const handleScanQRPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    resetAnimations();
    setTimeout(() => {
      Alert.alert('Coming soon!', 'This feature is coming soon to the app.');
    }, 100);
  }, [resetAnimations]);

  const handleAddShake = async () => {
    try {
      if (!user) {
        Alert.alert('Error', 'Please sign in to add a protein entry');
        return;
      }
      const proteinAmount = parseFloat(shakeProtein);
      if (isNaN(proteinAmount) || proteinAmount <= 0) {
        Alert.alert('Invalid Amount', 'Please enter a valid protein amount');
        return;
      }

      // Create date string without 'Z' suffix
      const localTime = format(new Date(), 'HH:mm:ss.SSS');
      const entryDate = `${selectedDate}T${localTime}`; // Removed 'Z' suffix

      await addProteinEntry({
        userId: user._id,
        date: entryDate,
        name: 'Quick Protein Entry',
        totalProteinEstimate: proteinAmount,
        ingredients: [{
          name: 'Protein',
          weight: proteinAmount * 3.33, // Assuming ~30% protein content
          proteinPercentage: 30,
          calories: proteinAmount * 4, // 4 calories per gram of protein
        }],
        totalCalories: proteinAmount * 4,
        entryMethod: 'quick_add'
      });

      // Track successful protein entry as a significant action
      await trackRatingAction();

      // Check if we should show rating prompt after this action
      const canRate = await shouldShowRating();
      if (canRate) {
        requestRating();
      }

      setShakeProtein('25');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      analytics.track({
        name: 'Quick Protein Added',
        properties: { grams: proteinAmount },
      });
    } catch (error) {
      console.error('Error adding protein:', error);
      Alert.alert('Error', 'Failed to add protein entry');
    }
  };

  const handlePresetPress = async (preset: ProteinPreset) => {
    try {
      if (!user) {
        Alert.alert('Error', 'Please sign in to add a protein entry');
        return;
      }

      // Create date string without 'Z' suffix
      const localTime = format(new Date(), 'HH:mm:ss.SSS');
      const entryDate = `${selectedDate}T${localTime}`; // Removed 'Z' suffix

      await addProteinEntry({
        userId: user._id,
        date: entryDate,
        name: preset.name,
        totalProteinEstimate: preset.weight * preset.proteinPercent / 100,
        ingredients: [{
          name: preset.name,
          weight: preset.weight,
          proteinPercentage: preset.proteinPercent,
          calories: preset.calories
        }],
        totalCalories: preset.calories,
        entryMethod: 'quick_add'
      });

      // Track successful preset entry as a significant action
      await trackRatingAction();

      // Check if we should show rating prompt after this action
      const canRate = await shouldShowRating();
      if (canRate) {
        requestRating();
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      analytics.track({
        name: 'Preset Protein Added',
        properties: { preset: preset.name, grams: (preset.weight * preset.proteinPercent / 100) },
      });
    } catch (error) {
      console.error('Error adding protein:', error);
      Alert.alert('Error', 'Failed to add protein entry');
    }
  };

  const handleSavedFoodsPress = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    resetAnimations();

    // Track this as a significant action that can trigger a rating prompt
    await trackRatingAction();

    setTimeout(() => {
      savedFoodsBottomSheetRef.current?.expand();
    }, 100);

    analytics.track({ name: 'Home Action - Saved Foods Opened' });
    mainButtonOpacity.value = withTiming(0, { duration: 200 });
    mainButtonDisplay.value = false;
  }, [resetAnimations]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LinearGradient
        colors={['#E0E0E0', '#F5F5F5', '#E0E0E0']} // Adjust colors for gradient
        style={styles.container}
      >
        {isExpanded && (
          <TouchableWithoutFeedback onPress={toggleExpand}>
            <View
              style={[
                StyleSheet.absoluteFillObject,
                styles.overlay
              ]}
            />
          </TouchableWithoutFeedback>
        )}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image source={require('@/assets/images/logo.png')} style={styles.logo} />
            <Text style={styles.title}>Protein AI</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/analysis');
              }}
            >
              <Ionicons name="analytics-outline" size={24} color={Colors.light.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/settings');
              }}
            >
              <Ionicons name="settings-outline" size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>
        </View>
        {/* Week View with ScrollView */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.pagerView}
          contentOffset={{ x: 3 * Dimensions.get('window').width, y: 0 }}
        >
          <View style={{ width: Dimensions.get('window').width }}>
            <WeekView dates={getWeekDates(-3)} selectedDate={selectedDate} multiWeekData={multiWeekData} user={user} onDateSelect={handleDateSelect} />
          </View>
          <View style={{ width: Dimensions.get('window').width }}>
            <WeekView dates={getWeekDates(-2)} selectedDate={selectedDate} multiWeekData={multiWeekData} user={user} onDateSelect={handleDateSelect} />
          </View>
          <View style={{ width: Dimensions.get('window').width }}>
            <WeekView dates={getWeekDates(-1)} selectedDate={selectedDate} multiWeekData={multiWeekData} user={user} onDateSelect={handleDateSelect} />
          </View>
          <View style={{ width: Dimensions.get('window').width }}>
            <WeekView dates={getWeekDates(0)} selectedDate={selectedDate} multiWeekData={multiWeekData} user={user} onDateSelect={handleDateSelect} />
          </View>
        </ScrollView>
        {/* Progress Circle */}
        <View style={styles.progressContainer}>
          <AnimatedCircularProgress
            size={200}
            width={10}
            fill={progress * 100}
            tintColor={getProgressColor(progress)}
            backgroundColor="#E0E0E0"
            rotation={0}
          >
            {() => (
              <View style={styles.progressContent}>
                <Text style={styles.progressNumber}>
                  {remainingProtein.toFixed(0)}g
                </Text>
                <Text style={styles.progressLabel}>remaining</Text>
                <View style={styles.proteinStats}>
                  <Text style={styles.statsText}>
                    {dailyProtein?.toFixed(0) || '0'}g / {user?.dailyProtein || '0'}g
                  </Text>
                </View>
              </View>
            )}
          </AnimatedCircularProgress>
        </View>
        {recentJobs?.map((job) => (
          <TouchableOpacity
            key={job._id}
            style={styles.entryCard}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <View style={styles.entryCardContent}>
              <Text style={styles.entryTime}>
                {format(new Date(job._creationTime), 'HH:mm')}
              </Text>

              <View style={styles.entryMainContent}>
                <Text style={styles.entryName} numberOfLines={1}>
                  {job.status === 'completed'
                    ? job.imageUrl
                      ? 'Image Analysis Complete'
                      : 'Description Analysis Complete'
                    : job.status === 'failed'
                      ? 'Analysis Failed'
                      : 'Analyzing...'}
                </Text>
              </View>

              {job.imageUrl ? (
                <View style={styles.jobImageContainer}>
                  <Image
                    source={{ uri: job.imageUrl }}
                    style={styles.entryThumbnail}
                    resizeMode="cover"
                  />
                  <View style={[styles.jobOverlay, { borderRadius: 8 }]}>
                    {job.status === 'completed' ? (
                      <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                    ) : job.status === 'failed' ? (
                      <Ionicons name="close-circle" size={20} color="#FF0000" />
                    ) : (
                      <ActivityIndicator size="small" color={Colors.light.secondaryButtonBackground} />
                    )}
                  </View>
                </View>
              ) : (
                <View style={styles.entryIconContainer}>
                  {job.status === 'completed' ? (
                    <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  ) : job.status === 'failed' ? (
                    <Ionicons name="close-circle" size={20} color="#FF0000" />
                  ) : (
                    < ActivityIndicator size="small" color={Colors.light.secondaryButtonBackground} />
                  )}
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
        <Text style={styles.sectionTitle}>Daily intake</Text>
        <FlatList
          showsVerticalScrollIndicator={false}
          style={styles.recentUploads}
          contentContainerStyle={styles.scrollViewContent}
          data={proteinEntries?.entries || []}
          keyExtractor={(item) => item._id}
          ListEmptyComponent={() => (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="restaurant-outline" size={24} color="#666" />
              <Text style={styles.emptyStateText}>No protein intake recorded for this day</Text>
            </View>
          )}
          renderItem={({ item: entry }) => (
            <Swipeable
              renderRightActions={() => (
                <RightSwipeActions
                  onDelete={() => {
                    Alert.alert(
                      "Delete Entry",
                      "Are you sure you want to delete this entry?",
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Delete",
                          style: "destructive",
                          onPress: async () => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            await deleteEntry({ entryId: entry._id });
                          }
                        }
                      ]
                    );
                  }}
                />
              )}
              enabled={!fixingEntries.has(entry._id.toString())}
            >
              <TouchableOpacity
                style={styles.entryCard}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(`/entry/${entry._id}`);
                }}
                disabled={fixingEntries.has(entry._id.toString())}
              >
                <View style={styles.entryCardContent}>
                  <Text style={styles.entryTime}>
                    {format(new Date(entry.date), 'HH:mm')}
                  </Text>

                  <View style={styles.entryMainContent}>
                    <Text style={[
                      styles.entryName,
                      fixingEntries.has(entry._id.toString()) && styles.fixingText
                    ]} numberOfLines={1}>
                      {fixingEntries.has(entry._id.toString()) ? 'Fixing...' : (entry.name || 'Food Entry')}
                    </Text>

                    <View style={styles.proteinContainer}>
                      {fixingEntries.has(entry._id.toString()) ? (
                        <ActivityIndicator size="small" color={Colors.light.secondaryButtonBackground} />
                      ) : (
                        <>
                          <Ionicons
                            name="barbell-outline"
                            size={14}
                            color={Colors.light.secondaryButtonBackground}
                            style={styles.proteinIcon}
                          />
                          <Text style={styles.proteinValue}>
                            {entry.totalProteinEstimate.toFixed(0)}g
                          </Text>
                        </>
                      )}
                    </View>
                  </View>

                  <View style={styles.thumbnailContainer}>
                    {entry.imageUrl ? (
                      <View style={styles.imageWrapper}>
                        <Image
                          source={{ uri: entry.imageUrl }}
                          style={styles.entryThumbnail}
                          resizeMode="cover"
                        />
                        {fixingEntries.has(entry._id.toString()) && (
                          <View style={styles.fixingOverlay}>
                            <ActivityIndicator color="white" />
                          </View>
                        )}
                      </View>
                    ) : (
                      <View style={styles.entryIconContainer}>
                        {fixingEntries.has(entry._id.toString()) ? (
                          <ActivityIndicator color="#666" />
                        ) : (
                          <Ionicons name="restaurant-outline" size={24} color="#666" />
                        )}
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            </Swipeable>
          )}
        />
        <View style={styles.buttonContainer}>
          <Animated.View style={[styles.buttonWrapper, animatedButtonStyles[0]]}>
            <TouchableOpacity
              style={[styles.button, styles.actionButton]}
              onPress={handleSavedFoodsPress}
            >
              <Ionicons name="bookmark-outline" size={28} color="#000" />
              <Text style={styles.actionButtonText}>Saved Foods</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={[styles.buttonWrapper, animatedButtonStyles[1]]}>
            <TouchableOpacity
              style={[styles.button, styles.actionButton]}
              onPress={handleShakePress}
            >
              <Ionicons name="flash-outline" size={28} color="#000" />
              <Text style={styles.actionButtonText}>Quick protein</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={[styles.buttonWrapper, animatedButtonStyles[2]]}>
            <TouchableOpacity
              style={[styles.button, styles.actionButton]}
              onPress={handleDescribePress}
            >
              <Ionicons name="create-outline" size={28} color="#000" />
              <Text style={styles.actionButtonText}>Describe Meal</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={[styles.buttonWrapper, animatedButtonStyles[3]]}>
            <TouchableOpacity
              style={[styles.button, styles.actionButton]}
              onPress={() => handleAddPress('/camera')}
            >
              <Ionicons name="camera-outline" size={28} color="#000" />
              <Text style={styles.actionButtonText}>Scan Food</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={[styles.button, styles.mainButton, mainButtonAnimatedStyle]}>
            <TouchableOpacity
              style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
              onPress={toggleExpand}
            >
              <Animated.View style={animatedStyles}>
                <Ionicons name="add" size={36} color="white" />
              </Animated.View>
            </TouchableOpacity>
          </Animated.View>
        </View>
        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={snapPoints}
          enablePanDownToClose
          backgroundStyle={styles.bottomSheetBackground}
          onChange={(index) => {
            if (index >= 0) {
              setIsExpanded(false);
              mainButtonOpacity.value = withTiming(0, { duration: 200 });
              mainButtonDisplay.value = false;
            } else {
              mainButtonOpacity.value = withTiming(1, { duration: 200 });
              mainButtonDisplay.value = true;
            }
          }}
        >
          <BottomSheetView style={styles.bottomSheetContent}>
            <Text style={styles.bottomSheetTitle}>Quick Add Protein</Text>
            <View style={styles.shakeInputContainer}>
              <NumericInput
                value={shakeProtein}
                onChangeText={setShakeProtein}
                onIncrement={() => setShakeProtein(prev => (parseInt(prev) + 1).toString())}
                onDecrement={() => setShakeProtein(prev => Math.max(0, parseInt(prev) - 1).toString())}
              />
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddShake}
              >
                <Text style={styles.addButtonText}>Add Protein</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.presetsTitle}>Quick Access</Text>
            <View style={styles.presetsGrid}>
              {PROTEIN_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.name}
                  style={styles.presetButton}
                  onPress={() => handlePresetPress(preset)}
                >
                  <MaterialCommunityIcons name={preset.icon} size={24} color="#000" />
                  <Text style={styles.presetName}>{preset.name}</Text>
                  <Text style={styles.presetGrams}>{(preset.weight * preset.proteinPercent / 100).toFixed(0)}g</Text>
                </TouchableOpacity>
              ))}
            </View>
          </BottomSheetView>
        </BottomSheet>
        <BottomSheet
          ref={savedFoodsBottomSheetRef}
          index={-1}
          snapPoints={savedFoodsSnapPoints}
          enablePanDownToClose
          backgroundStyle={styles.bottomSheetBackground}
          onChange={(index) => {
            if (index >= 0) {
              setIsExpanded(false);
              mainButtonOpacity.value = withTiming(0, { duration: 200 });
              mainButtonDisplay.value = false;
            } else {
              mainButtonOpacity.value = withTiming(1, { duration: 200 });
              mainButtonDisplay.value = true;
            }
          }}
        >
          <BottomSheetView style={styles.bottomSheetContent}>
            <Text style={styles.bottomSheetTitle}>Saved Foods</Text>
            <ScrollView
              style={styles.savedFoodsList}
              contentContainerStyle={styles.savedFoodsContent}
              showsVerticalScrollIndicator={false}
            >
              {!savedFoods || savedFoods.length === 0 ? (
                <View style={styles.emptyStateContainer}>
                  <Ionicons name="bookmark-outline" size={24} color="#666" />
                  <Text style={styles.emptyStateText}>No saved foods yet</Text>
                </View>
              ) : (
                <View style={styles.savedFoodsGrid}>
                  {savedFoods.map((food) => (
                    <TouchableOpacity
                      key={food._id}
                      style={styles.savedFoodGridItem}
                      onPress={async () => {
                        if (!user) return;
                        try {
                          await addProteinEntry({
                            userId: user._id,
                            date: `${selectedDate}T${format(new Date(), 'HH:mm:ss.SSS')}`,
                            name: food.name,
                            totalProteinEstimate: food.totalProteinEstimate,
                            ingredients: food.ingredients,
                            totalCalories: food.totalCalories,
                            aminoRecommendation: food.aminoRecommendation,
                            entryMethod: 'saved_food',
                            imageUrl: food.imageUrl,
                          });
                          savedFoodsBottomSheetRef.current?.close();
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        } catch (error) {
                          Alert.alert('Error', 'Failed to add food entry');
                        }
                      }}
                    >
                      <Text style={styles.savedFoodGridName} numberOfLines={2}>
                        {food.name}
                      </Text>
                      <Text style={styles.savedFoodGridProtein}>
                        {food.totalProteinEstimate}g
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
          </BottomSheetView>
        </BottomSheet>
      </LinearGradient>
    </GestureHandlerRootView >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: 'DMSerifDisplay_400Regular',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  logo: {
    width: 20,
    height: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'DMSans_700Bold',
    marginBottom: 10,
  },
  recentUploads: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 90,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    alignItems: 'flex-end',
    zIndex: 2
  },
  buttonWrapper: {
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  button: {
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  smallButton: {
    width: 50,
    height: 50,
  },
  mainButton: {
    backgroundColor: '#000',
    width: 65,
    height: 65,
    borderRadius: 32.5,
    marginBottom: 10,
    marginRight: 10,
  },
  buttonText: {
    color: Colors.light.secondaryButtonText,
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  dateItem: {
    width: 45,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,

  },
  selectedDateItem: {
    backgroundColor: '#000',
  },
  dayName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectedText: {
    color: '#FFF',
  },
  futureDateText: {
    color: '#CCC',
  },
  progressContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  progressContent: {
    alignItems: 'center',
  },
  progressNumber: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
  },
  weekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  todayText: {
    fontWeight: 'bold',
  },
  pagerView: {
    height: 70, // Adjust based on your needs
  },
  entryCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  entryCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    height: 72,
  },
  entryTime: {
    fontSize: 12,
    color: '#666',
    minWidth: 42,
  },
  entryMainContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  entryName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  proteinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 60, // Ensure consistent width for protein values
    justifyContent: 'flex-end',
  },
  proteinIcon: {
    marginRight: 4,
  },
  proteinValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.secondaryButtonBackground,
  },
  entryThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  entryImageContainer: {
    marginRight: 12,
  },
  entryImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  entryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryCardLeft: {
    flex: 1,
  },
  macroContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  macroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  macroValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  jobImageContainer: {
    position: 'relative',
    width: 40,
    height: 40,
  },
  jobOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proteinStats: {
    alignItems: 'center',
  },
  statsText: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  statsLabel: {
    fontSize: 12,
    color: '#666',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    marginVertical: 10,
  },
  emptyStateText: {
    color: '#666',
    marginTop: 8,
    fontSize: 14,
  },
  deleteAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
    marginBottom: 8,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    marginBottom: 60,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalOptionText: {
    fontSize: 16,
    marginLeft: 16,
    color: Colors.light.text,
  },
  actionButton: {
    width: 160,
    height: 80,
    padding: 8,
  },
  actionButtonText: {
    color: '#000',
    marginTop: 4,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1
  },
  bottomSheetBackground: {
    backgroundColor: '#fff',
    borderRadius: 24,
  },
  bottomSheetContent: {
    flex: 1,
    padding: 16,
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  shakeInputContainer: {
    width: '100%',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '50%',
    marginTop: 20,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  describeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  inputWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#666',
  },
  thumbnailContainer: {
    width: 40,
    height: 40,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  headerButton: {
    padding: 4,
  },
  presetsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  presetButton: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetName: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
  },
  presetGrams: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  savedFoodsList: {
    flex: 1,
    width: '100%',
    minHeight: '100%',
  },
  savedFoodsContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  savedFoodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: 8,
  },
  savedFoodInfo: {
    flex: 1,
    marginRight: 16,
  },
  savedFoodName: {
    fontSize: 16,
    fontWeight: '500',
  },
  savedFoodProtein: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  tab: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  activeTab: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  activeTabText: {
    color: '#fff',
  },
  input: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  savedFoodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  savedFoodGridItem: {
    width: '47%',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  savedFoodGridName: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  savedFoodGridProtein: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.secondaryButtonBackground,
  },
  imageWrapper: {
    position: 'relative',
    width: 40,
    height: 40,
  },
  fixingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fixingText: {
    color: '#666',
    fontStyle: 'italic',
  },
});
