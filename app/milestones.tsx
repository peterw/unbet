import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Haptics } from '@/utils/haptics';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useConvexAuth } from '@/providers/ConvexAuthProvider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Milestone {
  id: number;
  days: number;
  title: string;
  subtitle: string;
  colors: string[];
  size: number;
  isUnlocked: boolean;
  isCompleted: boolean;
}

const milestones: Milestone[] = [
  {
    id: 1,
    days: 1,
    title: "First Step",
    subtitle: "The journey begins",
    colors: ['#4ECDC4', '#44A08D'],
    size: 80,
    isUnlocked: true,
    isCompleted: true,
  },
  {
    id: 2,
    days: 3,
    title: "Building Momentum",
    subtitle: "Consistency matters",
    colors: ['#667eea', '#764ba2'],
    size: 90,
    isUnlocked: true,
    isCompleted: true,
  },
  {
    id: 3,
    days: 7,
    title: "One Week Strong",
    subtitle: "A solid foundation",
    colors: ['#f093fb', '#f5576c'],
    size: 100,
    isUnlocked: true,
    isCompleted: true,
  },
  {
    id: 4,
    days: 14,
    title: "Two Week Champion",
    subtitle: "Habits are forming",
    colors: ['#4facfe', '#00f2fe'],
    size: 110,
    isUnlocked: true,
    isCompleted: false,
  },
  {
    id: 5,
    days: 30,
    title: "Monthly Master",
    subtitle: "True transformation",
    colors: ['#43e97b', '#38f9d7'],
    size: 120,
    isUnlocked: false,
    isCompleted: false,
  },
  {
    id: 6,
    days: 60,
    title: "Two Month Titan",
    subtitle: "Unstoppable force",
    colors: ['#fa709a', '#fee140'],
    size: 130,
    isUnlocked: false,
    isCompleted: false,
  },
  {
    id: 7,
    days: 90,
    title: "Quarterly Conqueror",
    subtitle: "Life changed forever",
    colors: ['#a8edea', '#fed6e3'],
    size: 140,
    isUnlocked: false,
    isCompleted: false,
  },
  {
    id: 8,
    days: 180,
    title: "Half Year Hero",
    subtitle: "New person emerged",
    colors: ['#d299c2', '#fef9d7'],
    size: 150,
    isUnlocked: false,
    isCompleted: false,
  },
  {
    id: 9,
    days: 365,
    title: "Annual Legend",
    subtitle: "Complete transformation",
    colors: ['#89f7fe', '#66a6ff'],
    size: 160,
    isUnlocked: false,
    isCompleted: false,
  }
];

export default function MilestonesScreen() {
  const router = useRouter();
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const { isAuthenticated } = useConvexAuth();

  // Get user's recovery start date and calculate current streak
  const userData = useQuery(
    api.users.getCurrentUser,
    isAuthenticated ? {} : 'skip'
  );

  const calculateCurrentStreak = () => {
    if (!userData?.recoveryStartDate) return 0;
    
    const startDate = new Date(userData.recoveryStartDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const currentStreak = calculateCurrentStreak();

  const renderPlanet = (milestone: Milestone, index: number) => {
    const isLocked = !milestone.isUnlocked && currentStreak < milestone.days;
    const opacity = isLocked ? 0.3 : 1;
    
    return (
      <TouchableOpacity
        key={milestone.id}
        style={[styles.planetContainer, { opacity }]}
        onPress={() => {
          if (!isLocked) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setSelectedMilestone(milestone);
          }
        }}
        disabled={isLocked}
      >
        <View style={styles.planetWrapper}>
          <LinearGradient
            colors={milestone.colors}
            style={[
              styles.planet,
              {
                width: milestone.size,
                height: milestone.size,
                borderRadius: milestone.size / 2,
              }
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          {milestone.isCompleted && (
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark" size={16} color="#FFF" />
            </View>
          )}
          {isLocked && (
            <View style={styles.lockedBadge}>
              <Ionicons name="lock-closed" size={16} color="#666" />
            </View>
          )}
        </View>
        <View style={styles.milestoneInfo}>
          <Text style={styles.milestoneTitle}>{milestone.title}</Text>
          <Text style={styles.milestoneSubtitle}>{milestone.subtitle}</Text>
          <Text style={styles.milestoneDays}>{milestone.days} days</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Milestones</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Current Progress */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressTitle}>Current Streak</Text>
        <Text style={styles.progressDays}>{currentStreak} days</Text>
        <Text style={styles.progressSubtitle}>Keep going strong!</Text>
      </View>

      {/* Milestones Grid */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.milestonesGrid}>
          {milestones.map((milestone, index) => renderPlanet(milestone, index))}
        </View>
      </ScrollView>

      {/* Milestone Detail Modal */}
      {selectedMilestone && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackground}
            onPress={() => setSelectedMilestone(null)}
          />
          <View style={styles.modalContent}>
            <LinearGradient
              colors={selectedMilestone.colors}
              style={[
                styles.modalPlanet,
                {
                  width: selectedMilestone.size * 1.5,
                  height: selectedMilestone.size * 1.5,
                  borderRadius: (selectedMilestone.size * 1.5) / 2,
                }
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Text style={styles.modalTitle}>{selectedMilestone.title}</Text>
            <Text style={styles.modalSubtitle}>{selectedMilestone.subtitle}</Text>
            <Text style={styles.modalDays}>{selectedMilestone.days} days milestone</Text>
            
            {selectedMilestone.isCompleted ? (
              <View style={styles.completedStatus}>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                <Text style={styles.completedText}>Completed!</Text>
              </View>
            ) : currentStreak >= selectedMilestone.days ? (
              <View style={styles.unlockedStatus}>
                <Ionicons name="star" size={24} color="#FFD700" />
                <Text style={styles.unlockedText}>Unlocked!</Text>
              </View>
            ) : (
              <View style={styles.lockedStatus}>
                <Text style={styles.lockedText}>
                  {selectedMilestone.days - currentStreak} days to go
                </Text>
              </View>
            )}
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedMilestone(null)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
    marginLeft: -40, // Offset back button width
  },
  headerSpacer: {
    width: 40,
  },
  progressContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 30,
  },
  progressTitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  progressDays: {
    fontSize: 48,
    fontWeight: '700',
    color: '#5B7FDE',
    marginBottom: 4,
  },
  progressSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  milestonesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 20,
  },
  planetContainer: {
    width: (SCREEN_WIDTH - 60) / 2,
    alignItems: 'center',
    marginBottom: 30,
  },
  planetWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  planet: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  completedBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#000',
  },
  lockedBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#000',
  },
  milestoneInfo: {
    alignItems: 'center',
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  milestoneSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 4,
  },
  milestoneDays: {
    fontSize: 14,
    color: '#5B7FDE',
    fontWeight: '500',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalPlanet: {
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalDays: {
    fontSize: 18,
    color: '#5B7FDE',
    fontWeight: '500',
    marginBottom: 24,
  },
  completedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  completedText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '500',
    marginLeft: 8,
  },
  unlockedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  unlockedText: {
    fontSize: 16,
    color: '#FFD700',
    fontWeight: '500',
    marginLeft: 8,
  },
  lockedStatus: {
    marginBottom: 24,
  },
  lockedText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#5B7FDE',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 16,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});