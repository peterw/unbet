import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Haptics } from '@/utils/haptics';
import { useUser } from '@clerk/clerk-expo';

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useUser();

  const menuItems = [
    {
      icon: 'person-outline',
      title: 'Account Information',
      subtitle: 'Manage your personal details',
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // Navigate to account info
      },
    },
    {
      icon: 'shield-checkmark-outline',
      title: 'Privacy & Security',
      subtitle: 'Control your data and privacy',
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // Navigate to privacy settings
      },
    },
    {
      icon: 'notifications-outline',
      title: 'Notifications',
      subtitle: 'Manage your notification preferences',
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // Navigate to notification settings
      },
    },
    {
      icon: 'heart-outline',
      title: 'Support & Help',
      subtitle: 'Get help and contact support',
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // Navigate to support
      },
    },
    {
      icon: 'settings-outline',
      title: 'Settings',
      subtitle: 'App preferences and configuration',
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/settings');
      },
    },
  ];

  const statsItems = [
    { label: 'Days Clean', value: '47' },
    { label: 'Entries', value: '152' },
    { label: 'Streak', value: '12' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={['#5B7FDE', '#4A6BC5']}
            style={styles.avatarContainer}
          >
            {user?.imageUrl ? (
              <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
            ) : (
              <Text style={styles.avatarText}>
                {user?.firstName?.[0] || user?.emailAddresses[0].emailAddress[0].toUpperCase() || 'U'}
              </Text>
            )}
          </LinearGradient>
          
          <Text style={styles.userName}>
            {user?.firstName || 'User'}
          </Text>
          <Text style={styles.userEmail}>
            {user?.emailAddresses[0].emailAddress || 'email@example.com'}
          </Text>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          {statsItems.map((stat, index) => (
            <View key={index} style={styles.statItem}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name={item.icon as any} size={22} color="#5B7FDE" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            // Handle sign out
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '600',
    color: '#FFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    paddingVertical: 24,
    marginHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#5B7FDE',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  menuContainer: {
    paddingHorizontal: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(91, 127, 222, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    marginHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    gap: 8,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
});