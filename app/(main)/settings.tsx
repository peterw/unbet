import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, ActivityIndicator, Alert, Linking, Modal, TextInput, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { Haptics } from '@/utils/haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRevenueCat } from '@/providers/RevenueCatProvider';
import { NumericInput } from '@/components/home/NumericInput';
import { ExternalLink } from '@/components/ExternalLink';
import { getReferralDetails } from '@/utils/referralCodes';
import { useSimpleAuth } from '@/providers/SimpleAuthProvider';
import * as Clipboard from 'expo-clipboard';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, isLoading } = useSimpleAuth();
  const updateUser = useMutation(api.users.updateCurrentUser);
  const { signOut } = useAuth();
  const { user: revenueUser } = useRevenueCat();

  // Determine effective pro status
  const hasFreeReferral = user?.referralCode && getReferralDetails(user.referralCode)?.type === 'free';
  const isEffectivelyPro = revenueUser.pro || hasFreeReferral;

  const [showSettings, setShowSettings] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [selectedReligion, setSelectedReligion] = useState('Christian');
  const [blockedTimer, setBlockedTimer] = useState('3 mins');
  const [referralCode] = useState('X3QELD');
  const [copiedCode, setCopiedCode] = useState(false);

  // Mock data for profile - replace with actual user data
  const profileData = {
    name: 'Nicole',
    isPro: true,
    totalDays: 6,
    streak: 0,
    notes: 1,
    challenges: [
      {
        id: 1,
        name: 'Blooming Spring Challenge',
        participants: 38754,
        completed: true,
        color: ['#6B46C1', '#4C1D95'],
        icon: '🌸'
      },
      {
        id: 2,
        name: 'Winter Arc Challenge',
        participants: 22094,
        completed: true,
        color: ['#2563EB', '#1E40AF'],
        icon: '❄️'
      },
      {
        id: 3,
        name: 'No Nut November',
        participants: 21093,
        completed: true,
        color: ['#7C3AED', '#5B21B6'],
        icon: '🥜'
      }
    ],
    history: [
      {
        id: 1,
        date: 'Jul 29, 2025',
        status: 'IN PROGRESS',
        duration: '11 Hours',
        type: 'streak'
      },
      {
        id: 2,
        date: 'Jul 23, 2025',
        status: 'IN PROGRESS',
        duration: '6 Days',
        type: 'challenge'
      }
    ]
  };

  const handleDeleteAccount = async () => {
    Alert.alert('Delete my Account', 'Are you sure you want to delete your account? This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const copyReferralCode = async () => {
    await Clipboard.setStringAsync(referralCode);
    setCopiedCode(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleInviteFriend = async () => {
    try {
      await Share.share({
        message: `Join me on the anti-gambling journey! Use my referral code: ${referralCode}`,
        url: 'https://app.antigambling.com',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Simple loading state
  if (isLoading || !user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFF" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="flag" size={24} color="#999" />
          </TouchableOpacity>
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
            <Text style={styles.userName}>{profileData.name}</Text>
            {profileData.isPro && (
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>Seed+ Pro</Text>
              </View>
            )}
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{profileData.totalDays}</Text>
              <Text style={styles.statLabel}>total days</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{profileData.streak}</Text>
              <Text style={styles.statLabel}>streak</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{profileData.notes}</Text>
              <Text style={styles.statLabel}>notes</Text>
            </View>
          </View>
        </View>

        {/* Challenges Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Challenges</Text>
          {profileData.challenges.map((challenge) => (
            <LinearGradient
              key={challenge.id}
              colors={challenge.color}
              style={styles.challengeCard}
            >
              <View style={styles.challengeContent}>
                <View>
                  <Text style={styles.challengeName}>{challenge.name}</Text>
                  <Text style={styles.challengeParticipants}>
                    {challenge.participants.toLocaleString()} participants
                  </Text>
                  <Text style={styles.challengeParticipants}>finished</Text>
                </View>
                <View style={styles.challengeIconContainer}>
                  <Text style={styles.challengeIcon}>{challenge.icon}</Text>
                </View>
              </View>
              {challenge.completed && (
                <View style={styles.challengeCompleted}>
                  <Text style={styles.challengeCompletedText}>challenge completed</Text>
                </View>
              )}
            </LinearGradient>
          ))}
        </View>

        {/* History Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>History</Text>
          {profileData.history.map((item) => (
            <View key={item.id} style={styles.historyCard}>
              {/* Stars background for history cards */}
              <View style={styles.starsContainer}>
                {[...Array(15)].map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.star,
                      {
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        opacity: Math.random() * 0.6 + 0.2,
                      },
                    ]}
                  />
                ))}
              </View>
              <View style={styles.historyCardContent}>
                {/* History item visualization */}
                <View style={styles.historyVisual}>
                  <LinearGradient
                    colors={['#E0E0E0', '#A0A0A0', '#606060']}
                    style={styles.historyRock}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.rockHighlight} />
                  </LinearGradient>
                  {item.type === 'challenge' && (
                    <LinearGradient
                      colors={['#60A5FA', '#3B82F6', '#2563EB']}
                      style={styles.historyOrb}
                    />
                  )}
                </View>
                <View style={styles.historyInfo}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyDate}>{item.date} – {item.status}</Text>
                    <View style={styles.progressBadge}>
                      <Text style={styles.progressBadgeText}>In Progress</Text>
                    </View>
                  </View>
                  <View style={styles.historyDuration}>
                    <Ionicons name="flame" size={16} color="#FF6B6B" />
                    <Text style={styles.historyDurationText}>{item.duration}</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
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
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingItemContent}>
                <View style={styles.settingIcon}>
                  <Ionicons name="star" size={24} color="#FFD700" />
                </View>
                <Text style={styles.settingText}>Rate the App</Text>
              </View>
            </TouchableOpacity>

            {/* Religion */}
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingItemContent}>
                <View style={styles.settingIcon}>
                  <Ionicons name="book" size={24} color="#6366F1" />
                </View>
                <Text style={styles.settingText}>Religion: {selectedReligion}</Text>
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

            {/* Referral Code */}
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingItemContent}>
                <View style={styles.settingIcon}>
                  <Ionicons name="ticket" size={24} color="#F59E0B" />
                </View>
                <Text style={styles.settingText}>Referral Code</Text>
              </View>
            </TouchableOpacity>

            {/* Your Referral Code */}
            <TouchableOpacity style={styles.settingItem} onPress={copyReferralCode}>
              <View style={styles.settingItemContent}>
                <View style={styles.settingIcon}>
                  <Ionicons name="people" size={24} color="#3B82F6" />
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
                  thumbColor="#FFF"
                />
              </View>
            </View>

            {/* Invite a friend */}
            <TouchableOpacity style={styles.settingItem} onPress={handleInviteFriend}>
              <View style={styles.settingItemContent}>
                <View style={styles.settingIcon}>
                  <Ionicons name="gift" size={24} color="#10B981" />
                </View>
                <Text style={styles.settingText}>Invite a friend</Text>
              </View>
            </TouchableOpacity>

            {/* Customer Support */}
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => Linking.openURL('mailto:support@antigambling.app')}
            >
              <View style={styles.settingItemContent}>
                <View style={styles.settingIcon}>
                  <Ionicons name="help-circle" size={24} color="#6B7280" />
                </View>
                <Text style={styles.settingText}>Customer Support Center</Text>
              </View>
            </TouchableOpacity>

            {/* Resync cloud data */}
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingItemContent}>
                <View style={styles.settingIcon}>
                  <Ionicons name="cloud-upload" size={24} color="#9CA3AF" />
                </View>
                <Text style={styles.settingText}>Resync cloud data</Text>
              </View>
            </TouchableOpacity>

            {/* Sign Out */}
            <TouchableOpacity style={styles.settingItem} onPress={handleSignOut}>
              <View style={styles.settingItemContent}>
                <View style={styles.settingIcon}>
                  <Ionicons name="log-out" size={24} color="#EF4444" />
                </View>
                <Text style={[styles.settingText, { color: '#EF4444' }]}>Sign Out</Text>
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

            {/* Email and Device ID */}
            <View style={styles.settingsFooter}>
              <Text style={styles.footerText}>2wvzyfxx8j@privaterelay.appleid.com</Text>
              <Text style={styles.footerText}>9EBB410B-E057-4D36-8B0B-FEDE49C6883D</Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FFF',
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
    fontSize: 48,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: -1,
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
  },
  profileCard: {
    backgroundColor: '#1A1A1A',
    marginHorizontal: 20,
    marginBottom: 32,
    borderRadius: 20,
    padding: 24,
    overflow: 'hidden',
  },
  starsContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
  },
  star: {
    position: 'absolute',
    width: 2,
    height: 2,
    backgroundColor: '#FFF',
    borderRadius: 1,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    backgroundColor: '#666',
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  avatarHighlight: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarShadow: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 8,
  },
  userName: {
    fontSize: 32,
    fontWeight: '600',
    color: '#FFF',
  },
  proBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  proBadgeText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 48,
    fontWeight: '300',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 16,
    color: '#999',
    marginTop: 4,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 20,
    marginBottom: 16,
  },
  challengeCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20,
    padding: 20,
    minHeight: 120,
  },
  challengeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  challengeName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  challengeParticipants: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  challengeIconContainer: {
    position: 'relative',
  },
  challengeIcon: {
    fontSize: 60,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  challengeCompleted: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  challengeCompletedText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  historyCard: {
    backgroundColor: '#1A1A1A',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden',
  },
  historyCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyVisual: {
    width: 80,
    height: 80,
    marginRight: 16,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyRock: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    position: 'relative',
  },
  rockHighlight: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  historyOrb: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#1A1A1A',
    overflow: 'hidden',
  },
  historyInfo: {
    flex: 1,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: '500',
  },
  progressBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressBadgeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '600',
  },
  historyDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyDurationText: {
    color: '#999',
    fontSize: 16,
  },
  // Settings Modal Styles
  settingsContainer: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  settingsTitle: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: -1,
  },
  settingsContent: {
    flex: 1,
  },
  settingsSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 20,
    marginBottom: 16,
    marginTop: 8,
  },
  settingItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  settingItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    width: 40,
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: {
    fontSize: 18,
    color: '#FFF',
    flex: 1,
  },
  referralCodeContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  referralCodeText: {
    fontSize: 18,
    color: '#3B82F6',
    fontWeight: '600',
  },
  copiedText: {
    fontSize: 14,
    color: '#34D399',
    marginLeft: 72,
    marginTop: -8,
    marginBottom: 8,
  },
  settingsFooter: {
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
});
