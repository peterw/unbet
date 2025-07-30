import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Switch,
  ActivityIndicator,
  Alert,
  Modal,
  Share,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Haptics } from '@/utils/haptics';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
// import { useRevenueCat } from '@/providers/RevenueCatProvider'; // Disabled temporarily
import { getReferralDetails } from '@/utils/referralCodes';
import { useConvexAuth } from '@/providers/ConvexAuthProvider';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';

export default function ProfileScreen() {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const { signOut } = useAuth();
  // Temporary fallback since RevenueCat provider is disabled
  const revenueUser = null;
  const packages = null;
  const purchasePackage = async () => ({ success: false });
  const { isAuthenticated } = useConvexAuth();
  
  // Use Convex to get user data - only query if authenticated
  const user = useQuery(api.users.getCurrentUser, isAuthenticated ? {} : 'skip');
  const updateUser = useMutation(api.users.updateCurrentUser);
  const isLoading = isAuthenticated && user === undefined;

  // Determine effective pro status
  const hasFreeReferral = user?.referralCode && getReferralDetails(user.referralCode)?.type === 'free';
  const isEffectivelyPro = revenueUser?.pro || hasFreeReferral;

  const [showSettings, setShowSettings] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [selectedReligion, setSelectedReligion] = useState('Christian');
  const [blockedTimer, setBlockedTimer] = useState('3 mins');
  const [referralCode] = useState('X3QELD');
  const [copiedCode, setCopiedCode] = useState(false);
  const [hasJoinedMonthlyChallenge, setHasJoinedMonthlyChallenge] = useState(false);
  
  // Get current month name
  const getCurrentMonthName = () => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[new Date().getMonth()];
  };
  
  const currentMonth = getCurrentMonthName();

  // Calculate actual stats from user data
  const calculateDaysSinceStart = () => {
    // If no recovery start date, use account creation date or today
    const startDate = user?.recoveryStartDate ? new Date(user.recoveryStartDate) : new Date();
    const now = new Date();
    const diff = now.getTime() - startDate.getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  const calculateCurrentStreak = () => {
    if (!user?.lastRelapseDate && !user?.recoveryStartDate) {
      // New user, start with day 0
      return 0;
    }
    
    if (!user?.lastRelapseDate && user?.recoveryStartDate) {
      // No relapse recorded, streak since recovery start
      return calculateDaysSinceStart();
    }
    
    const lastRelapse = new Date(user.lastRelapseDate);
    const now = new Date();
    const diff = now.getTime() - lastRelapse.getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  const totalDays = user?.recoveryStartDate ? calculateDaysSinceStart() : 1;
  const currentStreak = calculateCurrentStreak();
  const notes = 1; // Starting with 1 to show engagement

  const copyReferralCode = async () => {
    await Clipboard.setStringAsync(referralCode);
    setCopiedCode(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleInviteFriend = async () => {
    try {
      await Share.share({
        message: `Join me on the recovery journey! Use my referral code: ${referralCode}`,
        url: 'https://app.unbet.com',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const handleDeleteAccount = async () => {
    Alert.alert('Delete my Account', 'Are you sure you want to delete your account? This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  // Handle loading and authentication states
  if (!isAuthenticated || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFF" />
        <Text style={styles.loadingText}>
          {!isAuthenticated ? 'Authenticating...' : 'Loading profile...'}
        </Text>
      </View>
    );
  }
  
  // If authenticated but no user data yet
  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFF" />
        <Text style={styles.loadingText}>Setting up profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setShowSettings(true)}
          >
            <Ionicons name="settings" size={24} color="#999" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          {/* Starry background */}
          <View style={styles.starsContainer}>
            {[...Array(30)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.star,
                  {
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    opacity: Math.random() * 0.8 + 0.2,
                  },
                ]}
              />
            ))}
          </View>

          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              {/* 3D Rock/Asteroid appearance */}
              <LinearGradient
                colors={['#E0E0E0', '#A0A0A0', '#808080']}
                style={styles.avatarGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.avatarHighlight} />
                <View style={styles.avatarShadow} />
              </LinearGradient>
            </View>
          </View>

          {/* Name and Pro Badge */}
          <View style={styles.nameContainer}>
            <Text style={styles.userName}>{clerkUser?.firstName || clerkUser?.emailAddresses[0].emailAddress.split('@')[0] || 'User'}</Text>
            {isEffectivelyPro && (
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>Unbet+ Pro</Text>
              </View>
            )}
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{totalDays}</Text>
              <Text style={styles.statLabel}>total days</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{currentStreak}</Text>
              <Text style={styles.statLabel}>streak</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{notes}</Text>
              <Text style={styles.statLabel}>notes</Text>
            </View>
          </View>
        </View>

        {/* Milestones Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Milestones</Text>
            <TouchableOpacity 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/milestones');
              }}
              style={styles.viewAllButton}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="chevron-forward" size={16} color="#5B7FDE" />
            </TouchableOpacity>
          </View>
          
          {/* Next Milestone Preview */}
          <LinearGradient
            colors={['#1A1A2E', '#16213E']}
            style={styles.milestonePreviewCard}
          >
            <View style={styles.milestonePreviewContent}>
              <View style={styles.milestonePreviewPlanet}>
                <LinearGradient
                  colors={['#FF4500', '#FF6347', '#FFA500']}
                  style={styles.previewPlanet}
                  start={{ x: 0.2, y: 0.2 }}
                  end={{ x: 0.8, y: 0.8 }}
                >
                  <View style={styles.previewPlanetHighlight} />
                </LinearGradient>
              </View>
              <View style={styles.milestonePreviewInfo}>
                <Text style={styles.milestonePreviewTitle}>The Resilient</Text>
                <Text style={styles.milestonePreviewDescription}>7 days • Up Next</Text>
                <Text style={styles.milestonePreviewSubtext}>One week down! Your mind, body and aura are beginning to be set ablaze.</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Challenges Section */}
        <View style={styles.section}>
          
          {/* Monthly Challenge - Active challenges first */}
          <LinearGradient
            colors={hasJoinedMonthlyChallenge ? ['#10B981', '#059669'] : ['#333333', '#222222']}
            style={styles.challengeCard}
          >
            <View style={styles.challengeContent}>
              <View style={{ flex: 1 }}>
                <Text style={styles.challengeName}>{currentMonth} Challenge</Text>
                <Text style={styles.challengeParticipants}>
                  {hasJoinedMonthlyChallenge 
                    ? `Day ${Math.min(currentStreak, 30)} of 30`
                    : '30 days gambling-free'
                  }
                </Text>
                <Text style={styles.challengeParticipants}>
                  {hasJoinedMonthlyChallenge 
                    ? '12,847 participants'
                    : 'Join 12,847 others'
                  }
                </Text>
              </View>
              <View style={styles.challengeIconContainer}>
                <Text style={styles.challengeIcon}>📅</Text>
              </View>
            </View>
            {!hasJoinedMonthlyChallenge ? (
              <TouchableOpacity 
                style={styles.challengeJoinButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setHasJoinedMonthlyChallenge(true);
                  // TODO: Save to database
                }}
              >
                <Text style={styles.challengeJoinButtonText}>Join Challenge</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.challengeProgress}>
                <View style={styles.challengeProgressBar}>
                  <View 
                    style={[
                      styles.challengeProgressFill,
                      { width: `${Math.min((currentStreak / 30) * 100, 100)}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.challengeProgressText}>
                  {currentStreak >= 30 ? 'completed' : `${Math.round((currentStreak / 30) * 100)}% complete`}
                </Text>
              </View>
            )}
          </LinearGradient>
          
          {/* Completed Challenges */}
          <View style={styles.completedSectionHeader}>
            <Text style={styles.completedSectionTitle}>Completed</Text>
          </View>
          
          {/* First Step Challenge - Completed */}
          <LinearGradient
            colors={['#6B46C1', '#4C1D95']}
            style={[styles.challengeCard, styles.completedChallenge]}
          >
            <View style={styles.challengeContent}>
              <View style={{ flex: 1 }}>
                <Text style={styles.challengeName}>Taking the First Step ✓</Text>
                <Text style={styles.challengeParticipants}>
                  Successfully started your journey
                </Text>
                <Text style={styles.challengeParticipants}>Completed Day 1</Text>
              </View>
              <View style={styles.challengeIconContainer}>
                <Text style={styles.challengeIcon}>🚀</Text>
              </View>
            </View>
            <View style={styles.challengeProgress}>
              <Text style={styles.challengeProgressText}>completed</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Add bottom padding to account for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.settingsContainer}>
          {/* Settings Header */}
          <View style={styles.settingsHeader}>
            <Text style={styles.settingsTitle}>Settings</Text>
            <TouchableOpacity onPress={() => setShowSettings(false)}>
              <Ionicons name="close-circle" size={32} color="#999" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.settingsContent}>
            <Text style={styles.settingsSectionTitle}>YOUR SETTINGS</Text>

            {/* Rate the App */}
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={async () => {
                try {
                  const storeUrl = Platform.OS === 'ios' 
                    ? 'https://apps.apple.com/app/id6737904397?action=write-review'
                    : 'market://details?id=com.tryunbet.app';
                  
                  const canOpen = await Linking.canOpenURL(storeUrl);
                  if (canOpen) {
                    await Linking.openURL(storeUrl);
                  } else {
                    // Fallback to web browser if native app store isn't available
                    const fallbackUrl = Platform.OS === 'ios'
                      ? 'https://apps.apple.com/app/id6737904397'
                      : 'https://play.google.com/store/apps/details?id=com.tryunbet.app';
                    await Linking.openURL(fallbackUrl);
                  }
                } catch (error) {
                  console.error('Error opening app store:', error);
                  Alert.alert(
                    'Unable to open store',
                    'Please visit the app store manually to rate the app.',
                    [{ text: 'OK', style: 'default' }]
                  );
                }
              }}
            >
              <View style={styles.settingItemContent}>
                <View style={styles.settingIcon}>
                  <Ionicons name="star" size={24} color="#FFD700" />
                </View>
                <Text style={styles.settingText}>Rate the App</Text>
              </View>
            </TouchableOpacity>


            {/* Blocked Timer */}
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingItemContent}>
                <View style={styles.settingIcon}>
                  <Ionicons name="time" size={24} color="#EF4444" />
                </View>
                <Text style={styles.settingText}>Blocked Timer: {blockedTimer}</Text>
              </View>
            </TouchableOpacity>

            {/* Your Referral Code */}
            <TouchableOpacity style={styles.settingItem} onPress={copyReferralCode}>
              <View style={styles.settingItemContent}>
                <View style={styles.settingIcon}>
                  <Ionicons name="ticket" size={24} color="#F59E0B" />
                </View>
                <View style={styles.referralCodeContainer}>
                  <Text style={styles.settingText}>Your Referral Code: </Text>
                  <Text style={styles.referralCodeText}>{referralCode}</Text>
                </View>
                <TouchableOpacity onPress={copyReferralCode}>
                  <Ionicons name="copy-outline" size={20} color="#999" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
            {copiedCode && <Text style={styles.copiedText}>Copied!</Text>}

            {/* Notifications */}
            <View style={styles.settingItem}>
              <View style={styles.settingItemContent}>
                <View style={styles.settingIcon}>
                  <Ionicons name="notifications" size={24} color="#8B5CF6" />
                </View>
                <Text style={styles.settingText}>Notifications</Text>
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: '#767577', true: '#34D399' }}
                  thumbColor={'#FFFFFF'}
                />
              </View>
            </View>

            {/* Invite a Friend */}
            <TouchableOpacity style={styles.settingItem} onPress={handleInviteFriend}>
              <View style={styles.settingItemContent}>
                <View style={styles.settingIcon}>
                  <Ionicons name="share-social" size={24} color="#34D399" />
                </View>
                <Text style={styles.settingText}>Invite a Friend</Text>
              </View>
            </TouchableOpacity>

            <Text style={styles.settingsSectionTitle}>ABOUT</Text>

            {/* Privacy Policy */}
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => Linking.openURL('https://tryunbet.com/privacy.html')}
            >
              <View style={styles.settingItemContent}>
                <View style={styles.settingIcon}>
                  <Ionicons name="shield-checkmark" size={24} color="#6B7280" />
                </View>
                <Text style={styles.settingText}>Privacy Policy</Text>
              </View>
            </TouchableOpacity>

            {/* Reset Progress */}
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingItemContent}>
                <View style={styles.settingIcon}>
                  <Ionicons name="refresh" size={24} color="#10B981" />
                </View>
                <Text style={[styles.settingText, { color: '#10B981' }]}>Reset Progress</Text>
              </View>
            </TouchableOpacity>

            {/* Delete Account */}
            <TouchableOpacity style={styles.settingItem} onPress={handleDeleteAccount}>
              <View style={styles.settingItemContent}>
                <View style={styles.settingIcon}>
                  <Ionicons name="trash" size={24} color="#EF4444" />
                </View>
                <Text style={[styles.settingText, { color: '#EF4444' }]}>Delete my Account</Text>
              </View>
            </TouchableOpacity>

            {/* Sign Out */}
            <TouchableOpacity style={styles.settingItem} onPress={handleSignOut}>
              <View style={styles.settingItemContent}>
                <View style={styles.settingIcon}>
                  <Ionicons name="log-out" size={24} color="#F59E0B" />
                </View>
                <Text style={[styles.settingText, { color: '#F59E0B' }]}>Sign Out</Text>
              </View>
            </TouchableOpacity>

            {/* App Version */}
            <View style={styles.versionContainer}>
              <Text style={styles.versionText}>
                Version {Constants.expoConfig?.version || Constants.manifest?.version || '1.3.0'}
              </Text>
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#999',
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'DMSans_400Regular',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'DMSans_500Medium',
    color: '#FFFFFF',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  headerButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileCard: {
    backgroundColor: '#111111',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
    overflow: 'hidden',
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
    width: 2,
    height: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  avatarContainer: {
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    position: 'relative',
    overflow: 'hidden',
  },
  avatarGradient: {
    flex: 1,
    position: 'relative',
  },
  avatarHighlight: {
    position: 'absolute',
    top: 8,
    left: 12,
    width: 20,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 10,
    transform: [{ skewX: '-15deg' }],
  },
  avatarShadow: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 40,
    height: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    transform: [{ skewX: '15deg' }],
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  userName: {
    fontSize: 20,
    fontFamily: 'DMSans_500Medium',
    color: '#FFFFFF',
  },
  proBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  proBadgeText: {
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 40,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'DMSans_500Medium',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: '#999999',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'DMSans_500Medium',
    color: '#FFFFFF',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: '#5B7FDE',
  },
  milestonePreviewCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
  },
  milestonePreviewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  milestonePreviewPlanet: {
    shadowColor: '#FF4500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  previewPlanet: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  previewPlanetHighlight: {
    position: 'absolute',
    top: 8,
    left: 10,
    width: 12,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 6,
    transform: [{ skewX: '-15deg' }],
  },
  milestonePreviewInfo: {
    flex: 1,
  },
  milestonePreviewTitle: {
    fontSize: 16,
    fontFamily: 'DMSans_500Medium',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  milestonePreviewDescription: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: '#D4AF37',
    marginBottom: 4,
  },
  milestonePreviewSubtext: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 16,
  },
  challengeCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    overflow: 'hidden',
  },
  challengeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  challengeName: {
    fontSize: 18,
    fontFamily: 'DMSans_500Medium',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  challengeParticipants: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  challengeIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  challengeIcon: {
    fontSize: 32,
  },
  challengeProgress: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  challengeProgressText: {
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  challengeJoinButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  challengeJoinButtonText: {
    fontSize: 16,
    fontFamily: 'DMSans_500Medium',
    color: '#FFFFFF',
  },
  challengeProgressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  challengeProgressFill: {
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 3,
  },
  completedSectionHeader: {
    marginTop: 24,
    marginBottom: 16,
  },
  completedSectionTitle: {
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: 20,
  },
  completedChallenge: {
    opacity: 0.7,
  },
  settingsContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  settingsTitle: {
    fontSize: 24,
    fontFamily: 'DMSans_500Medium',
    color: '#FFFFFF',
  },
  settingsContent: {
    flex: 1,
    paddingTop: 20,
  },
  settingsSectionTitle: {
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    color: '#999',
    marginLeft: 20,
    marginBottom: 16,
    marginTop: 32,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#111',
  },
  settingItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingText: {
    fontSize: 16,
    fontFamily: 'DMSans_400Regular',
    color: '#FFFFFF',
    flex: 1,
  },
  referralCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  referralCodeText: {
    fontSize: 16,
    fontFamily: 'DMSans_500Medium',
    color: '#3B82F6',
  },
  copiedText: {
    color: '#34D399',
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    marginLeft: 76,
    marginTop: -8,
    marginBottom: 8,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 10,
  },
  versionText: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: '#666',
  },
});