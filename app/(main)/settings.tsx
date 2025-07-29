import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, ActivityIndicator, Alert, Linking } from 'react-native';
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
import { getReferralDetails } from '../utils/referralCodes';

export default function SettingsScreen() {
  const router = useRouter();
  const user = useQuery(api.users.getCurrentUser);
  const updateUser = useMutation(api.users.updateCurrentUser);
  const { signOut } = useAuth();
  const { user: revenueUser } = useRevenueCat();

  // Determine effective pro status
  const hasFreeReferral = user?.referralCode && getReferralDetails(user.referralCode)?.type === 'free';
  const isEffectivelyPro = revenueUser.pro || hasFreeReferral;

  const [goal, setGoal] = useState(user?.dailyProtein?.toString() || '75');
  const [originalGoal, setOriginalGoal] = useState(user?.dailyProtein?.toString() || '75');

  useEffect(() => {
    if (user?.dailyProtein) {
      setGoal(user.dailyProtein.toString());
      setOriginalGoal(user.dailyProtein.toString());
    }
  }, [user]);

  const handleDeleteAccount = async () => {
    Alert.alert('Delete account', 'Are you sure you want to delete your account? This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const handleGoalChange = (newValue: string) => {
    setGoal(newValue);
  };

  const handleDismiss = async () => {
    if (goal !== originalGoal) {
      Alert.alert(
        'Save Changes?',
        'Would you like to save your new daily protein goal?',
        [
          {
            text: 'Discard',
            onPress: () => setGoal(originalGoal),
            style: 'cancel',
          },
          {
            text: 'Save',
            onPress: async () => {
              try {
                await updateUser({ dailyProtein: parseInt(goal) });
                setOriginalGoal(goal);
              } catch (error) {
                console.error('Error updating protein goal:', error);
                Alert.alert('Error', 'Failed to update protein goal');
                setGoal(originalGoal);
              }
            },
          },
        ]
      );
    }
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#E0E0E0', '#F5F5F5', '#E0E0E0']}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.unlimitedBadge}>
          <Text style={styles.unlimitedText}>{isEffectivelyPro ? 'UNLIMITED' : 'FREE'}</Text>
        </View>
      </View>

      <View style={styles.goalSection}>
        <Text style={styles.label}>Daily Protein Goal (g)</Text>
        <View style={styles.goalInputContainer}>
          <NumericInput
            value={goal}
            onChangeText={handleGoalChange}
            onIncrement={() => {
              const newValue = (parseInt(goal) + 1).toString();
              handleGoalChange(newValue);
            }}
            onDecrement={() => {
              const newValue = (parseInt(goal) - 1).toString();
              handleGoalChange(newValue);
            }}
          />
          {goal !== originalGoal && (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={async () => {
                try {
                  await updateUser({ dailyProtein: parseInt(goal) });
                  setOriginalGoal(goal);
                } catch (error) {
                  console.error('Error updating protein goal:', error);
                  Alert.alert('Error', 'Failed to update protein goal');
                  setGoal(originalGoal);
                }
              }}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.sectionGroup}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity
          style={styles.section}
          onPress={() => router.push({
            pathname: '/onboarding',
            params: { mode: 'user_details' }
          })}
        >
          <View style={styles.sectionContent}>
            <Text style={styles.optionText}>Adjust personal details</Text>
            <Ionicons name="person-outline" size={24} color={Colors.light.text} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.section}
          onPress={() => router.push('/onboarding-2')}
        >
          <View style={styles.sectionContent}>
            <Text style={styles.optionText}>Test New Onboarding</Text>
            <Ionicons name="flask-outline" size={24} color={Colors.light.text} />
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.section}
          onPress={handlePrivacyPolicy}
        >
          <View style={styles.sectionContent}>
            <Text style={styles.optionText}>Privacy Policy</Text>
            <Ionicons name="lock-closed-outline" size={24} color={Colors.light.text} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionGroup}>
        <Text style={styles.sectionTitle}>Legal</Text>
        <View style={styles.section}>
          <ExternalLink href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/">
            <View style={styles.sectionContent}>
              <Text style={styles.optionText}>Terms and Conditions</Text>
              <Ionicons name="chevron-forward" size={24} color={Colors.light.text} />
            </View>
          </ExternalLink>
        </View>

        <View style={styles.section}>
          <ExternalLink href="https://protai.app/privacy">
            <View style={styles.sectionContent}>
              <Text style={styles.optionText}>Privacy Policy</Text>
              <Ionicons name="chevron-forward" size={24} color={Colors.light.text} />
            </View>
          </ExternalLink>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            onPress={() => Linking.openURL('mailto:support@protai.app')}
          >
            <View style={styles.sectionContent}>
              <Text style={styles.optionText}>Support</Text>
              <Ionicons name="chevron-forward" size={24} color={Colors.light.text} />
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.section, styles.dangerSection]} onPress={handleDeleteAccount}>
          <View style={styles.sectionContent}>
            <Text style={[styles.optionText, { color: Colors.light.text }]}>Delete account</Text>
            <Ionicons name="trash-outline" size={24} color={Colors.light.text} />
          </View>
        </TouchableOpacity>
      </View>

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  unlimitedBadge: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  unlimitedText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  optionText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  goalSection: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  label: {
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 8,
  },
  goalInputContainer: {
    alignItems: 'center',
    gap: 12,
  },
  saveButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionGroup: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.text,
    marginLeft: 16,
    marginBottom: 8,
  },
  dangerSection: {
    marginTop: 8,
  },
  sectionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
});
