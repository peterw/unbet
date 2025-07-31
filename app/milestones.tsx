import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Haptics } from '../utils/haptics';
import { LinearGradient } from 'expo-linear-gradient';

export default function MilestonesScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'Milestones' | 'Rewards'>('Milestones');

  const milestones = [
    {
      id: 3,
      title: 'The Resilient',
      description: 'One week down! Your mind, body and aura are beginning to be set ablaze.',
      days: 7,
      status: 'up_next',
      planet: 'fire' // Fire planet
    },
    {
      id: 4,
      title: 'The Challenger',
      description: 'Two weeks in. You\'re in the 5th percentile of all users.',
      days: 14,
      status: 'locked',
      planet: 'rock' // Rocky/asteroid planet
    },
    {
      id: 5,
      title: 'The Warrior',
      description: 'One month strong. You\'ve conquered the hardest phase.',
      days: 30,
      status: 'locked',
      planet: 'ice' // Ice planet
    },
    {
      id: 6,
      title: 'The Master',
      description: 'Three months clean. You\'ve mastered self-control.',
      days: 90,
      status: 'locked',
      planet: 'gas' // Gas giant
    }
  ];

  const handleTabChange = (tab: 'Milestones' | 'Rewards') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  };

  const renderPlanet = (type: string) => {
    switch (type) {
      case 'fire':
        return (
          <LinearGradient
            colors={['#FF4500', '#FF6347', '#FFA500', '#FFD700']}
            style={styles.planet}
            start={{ x: 0.2, y: 0.2 }}
            end={{ x: 0.8, y: 0.8 }}
          >
            <View style={styles.planetHighlight} />
            <View style={[styles.fireGlow, { top: 30, left: 35, width: 25, height: 25 }]} />
            <View style={[styles.fireGlow, { top: 60, left: 45, width: 15, height: 15 }]} />
          </LinearGradient>
        );
      case 'rock':
        return (
          <LinearGradient
            colors={['#654321', '#8B7355', '#A0522D', '#D2B48C']}
            style={styles.planet}
            start={{ x: 0.1, y: 0.1 }}
            end={{ x: 0.9, y: 0.9 }}
          >
            <View style={styles.planetHighlight} />
            <View style={styles.planetCrater} />
            <View style={[styles.planetCrater, { top: 70, left: 50, width: 18, height: 18 }]} />
            <View style={[styles.planetCrater, { top: 45, left: 80, width: 12, height: 12 }]} />
            <View style={[styles.rockTexture, { top: 25, left: 60, width: 20, height: 8 }]} />
            <View style={[styles.rockTexture, { top: 85, left: 30, width: 15, height: 6 }]} />
          </LinearGradient>
        );
      case 'ice':
        return (
          <LinearGradient
            colors={['#87CEEB', '#B0E0E6', '#F0F8FF']}
            style={styles.planet}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.planetHighlight} />
          </LinearGradient>
        );
      case 'gas':
        return (
          <LinearGradient
            colors={['#4B0082', '#8A2BE2', '#9370DB']}
            style={styles.planet}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.planetHighlight} />
            <View style={styles.planetRing} />
          </LinearGradient>
        );
      default:
        return <View style={styles.planet} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Stars background */}
      <View style={styles.starsContainer}>
        {[...Array(200)].map((_, i) => {
          const x = ((i * 137.5) % 100);
          const y = ((i * 23.7) % 100);
          const size = 0.3 + (i % 5) * 0.3;
          const opacity = 0.1 + (i % 10) * 0.05;
          
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

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'Milestones' && styles.activeTab]}
            onPress={() => handleTabChange('Milestones')}
          >
            <Text style={[styles.tabText, activeTab === 'Milestones' && styles.activeTabText]}>
              Milestones
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'Rewards' && styles.activeTab]}
            onPress={() => handleTabChange('Rewards')}
          >
            <Text style={[styles.tabText, activeTab === 'Rewards' && styles.activeTabText]}>
              Rewards
            </Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <Ionicons name="close" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {activeTab === 'Milestones' && (
          <View style={styles.milestonesContainer}>
            {milestones.map((milestone) => (
              <View key={milestone.id} style={styles.milestoneCard}>
                <View style={styles.milestoneHeader}>
                  <Text style={styles.milestoneNumber}>Milestone {milestone.id}</Text>
                  {milestone.status === 'up_next' && (
                    <View style={styles.upNextBadge}>
                      <Text style={styles.upNextText}>Up Next</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.planetContainer}>
                  {renderPlanet(milestone.planet)}
                </View>
                
                <Text style={styles.milestoneTitle}>{milestone.title}</Text>
                <Text style={styles.milestoneDescription}>{milestone.description}</Text>
              </View>
            ))}
          </View>
        )}
        
        {activeTab === 'Rewards' && (
          <View style={styles.rewardsContainer}>
            <Text style={styles.comingSoonText}>Rewards coming soon...</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
    backgroundColor: '#FFF',
    borderRadius: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 32,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  activeTab: {
    // No visual difference as per reference
  },
  tabText: {
    fontSize: 30,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255, 255, 255, 0.3)',
    letterSpacing: -0.5,
  },
  activeTabText: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  milestonesContainer: {
    gap: 20,
  },
  milestoneCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 32,
  },
  milestoneNumber: {
    fontSize: 20,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  upNextBadge: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  upNextText: {
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
    color: '#000',
  },
  planetContainer: {
    marginBottom: 32,
  },
  planet: {
    width: 140,
    height: 140,
    borderRadius: 70,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  planetHighlight: {
    position: 'absolute',
    top: 20,
    left: 25,
    width: 35,
    height: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 17.5,
    transform: [{ skewX: '-15deg' }],
  },
  fireGlow: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 0, 0.3)',
    borderRadius: 12.5,
  },
  rockTexture: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 2,
  },
  planetCrater: {
    position: 'absolute',
    top: 55,
    left: 35,
    width: 24,
    height: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 12,
  },
  planetRing: {
    position: 'absolute',
    top: -10,
    left: -10,
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    transform: [{ rotateX: '75deg' }],
  },
  milestoneTitle: {
    fontSize: 28,
    fontFamily: 'DMSans_500Medium',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  milestoneDescription: {
    fontSize: 17,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 300,
    paddingHorizontal: 8,
  },
  rewardsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  comingSoonText: {
    fontSize: 18,
    fontFamily: 'DMSans_400Regular',
    color: '#666',
  },
});