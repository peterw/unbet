import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  Dimensions,
  Animated,
  Image,
  Platform,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Haptics } from '@/utils/haptics';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { BlurView } from 'expo-blur';
// Remove Canvas import as we're using View-based stars

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Starfield background component with static particles
function StarfieldBackground() {
  return (
    <View style={StyleSheet.absoluteFillObject}>
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
  );
}

interface JournalEntry {
  id: string;
  date: Date;
  content: string;
  category: 'Thoughts' | 'Feelings' | 'Gratitude' | 'Progress';
  preview: string;
}

export default function JournalScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'Tapes' | 'Reflections'>('Reflections');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Fetch journal entries from Convex
  const journalEntriesData = useQuery(api.journalEntries.list);
  const isLoading = journalEntriesData === undefined;
  
  // Remove debug logging that could cause re-renders
  // useEffect(() => {
  //   console.log('[Journal] Query result:', { 
  //     entriesCount: journalEntriesData?.length,
  //     isLoading,
  //     data: journalEntriesData 
  //   });
  // }, [journalEntriesData, isLoading]);

  // Transform Convex data to match our interface
  const journalEntries: JournalEntry[] = journalEntriesData?.map(entry => ({
    id: entry._id,
    date: new Date(entry.createdAt),
    content: entry.content,
    category: entry.category,
    preview: entry.content.substring(0, 100) + (entry.content.length > 100 ? '...' : '')
  })) || [];

  const handleTabChange = (tab: 'Tapes' | 'Reflections') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    setActiveTab(tab);
  };

  const formatDate = (date: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${months[date.getMonth()]}, ${date.getDate()} ${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Thoughts': return '#5B7FDE';
      case 'Feelings': return '#FF6B6B';
      case 'Gratitude': return '#4ECDC4';
      case 'Progress': return '#95E1D3';
      default: return '#5B7FDE';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StarfieldBackground />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'Tapes' && styles.activeTab]}
            onPress={() => handleTabChange('Tapes')}
          >
            <Text style={[styles.tabText, activeTab === 'Tapes' && styles.activeTabText]}>
              Tapes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'Reflections' && styles.activeTab]}
            onPress={() => handleTabChange('Reflections')}
          >
            <Text style={[styles.tabText, activeTab === 'Reflections' && styles.activeTabText]}>
              Reflections
            </Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.infoButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <View style={styles.infoButtonInner}>
            <Ionicons name="information" size={20} color="#FFF" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {activeTab === 'Reflections' ? (
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#5B7FDE" />
                <Text style={styles.loadingText}>Loading reflections...</Text>
              </View>
            ) : journalEntries.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="book-outline" size={64} color="#444" />
                <Text style={styles.emptyTitle}>No reflections yet</Text>
                <Text style={styles.emptyText}>Start your journey by writing your first reflection</Text>
              </View>
            ) : (
              journalEntries.map((entry) => (
              <View key={entry.id} style={styles.entryCardContainer}>
                <BlurView
                  intensity={30}
                  tint="dark"
                  style={styles.entryCard}
                >
                  <View style={styles.entryCardInner}>
                    <View style={styles.entryHeader}>
                      <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
                      <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(entry.category) }]}>
                        <Text style={styles.categoryText}>{entry.category}</Text>
                      </View>
                    </View>
                    <Text style={styles.entryContent} numberOfLines={3}>
                      {entry.content}
                    </Text>
                  </View>
                </BlurView>
              </View>
              ))
            )}
            
            {/* Add new reflection button - always show */}
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/reflect');
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle" size={56} color="#5B7FDE" />
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Community Section */}
            <View style={styles.communityCard}>
              <View style={styles.communityIcon}>
                <Ionicons name="logo-discord" size={60} color="#5B7FDE" />
              </View>
              <Text style={styles.communityTitle}>You're not alone</Text>
              <Text style={styles.communityDescription}>
                Find an accountability partner & share your wins with other pro users
              </Text>
              
              {/* Recent posts */}
              <View style={styles.postsContainer}>
                <View style={styles.postCard}>
                  <View style={styles.postHeader}>
                    <View style={styles.userAvatar}>
                      <Text style={styles.avatarText}>R</Text>
                    </View>
                    <View style={styles.postInfo}>
                      <View style={styles.postUserRow}>
                        <Text style={styles.postUsername}>Ronak</Text>
                        <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                      </View>
                      <Text style={styles.postTime}>Yesterday at 2:30 PM</Text>
                    </View>
                  </View>
                  <Text style={styles.postContent}>
                    new record: 14 days thanks Seed 💪🔥
                  </Text>
                  <View style={styles.postReactions}>
                    <Text style={styles.reactionEmoji}>🔥 1</Text>
                    <Ionicons name="chatbubble-outline" size={16} color="#666" />
                  </View>
                </View>
                
                <View style={styles.postCard}>
                  <View style={styles.postHeader}>
                    <View style={[styles.userAvatar, { backgroundColor: '#8B5FDE' }]}>
                      <Text style={styles.avatarText}>B</Text>
                    </View>
                    <View style={styles.postInfo}>
                      <Text style={styles.postUsername}>Bruce</Text>
                      <Text style={styles.postTime}>Today at 3:31 PM</Text>
                    </View>
                  </View>
                  <Text style={styles.postContent}>
                    25M US - looking for someone around similar age to stay accountable, also exercising 5 days a week!
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity style={styles.joinButton}>
                <Text style={styles.joinButtonText}>Join the Community</Text>
              </TouchableOpacity>
            </View>
            
            {/* Rewire Tapes Section */}
            <View style={styles.tapesSection}>
              <Text style={styles.tapesSectionTitle}>Rewire Tapes</Text>
              <Text style={styles.tapesSectionSubtitle}>
                The 5 day audio course to help train your subconscious mind.
              </Text>
              
              {/* Tape Cards */}
              <View style={styles.tapeCard}>
                <Text style={styles.tapeTitle}>The Introduction</Text>
                <Text style={styles.tapeStatus}>Unlocked</Text>
                {Platform.OS === 'web' ? (
                  <View style={styles.tapeImage}>
                    <img 
                      src="https://via.placeholder.com/300x200"
                      alt="Tape cover"
                      style={{ width: '100%', height: '100%', borderRadius: 12, objectFit: 'cover' }}
                    />
                  </View>
                ) : (
                  <Image 
                    source={{ uri: 'https://via.placeholder.com/300x200' }}
                    style={styles.tapeImage}
                  />
                )}
                <Text style={styles.tapeDescription}>
                  This introduction equips you with the proper mental frameworks and strategies for using and implementing the SEED rewiring tapes collection. You will understand how the collection has been engineered. And you will learn how to use the tapes in the most effective way.
                </Text>
                <TouchableOpacity 
                  style={styles.playButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push('/tape-player?id=1');
                  }}
                >
                  <Ionicons name="play" size={20} color="#FFF" />
                  <Text style={styles.playButtonText}>Play Tape 1</Text>
                </TouchableOpacity>
                <Text style={styles.completionText}>32421 users completed</Text>
              </View>
              
              {/* Add more tape cards here */}
            </View>
          </ScrollView>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  star: {
    position: 'absolute',
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'center',
    gap: 32,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  activeTab: {
    // No underline in the screenshot
  },
  tabText: {
    fontSize: 30,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.3)',
    letterSpacing: -0.5,
  },
  activeTabText: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  infoButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#5B7FDE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoButtonInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#5B7FDE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  entryCardContainer: {
    marginBottom: 16,
  },
  entryCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  entryCardInner: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryDate: {
    fontSize: 18,
    color: '#5B7FDE',
    fontWeight: '500',
  },
  categoryBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  entryContent: {
    fontSize: 20,
    color: '#FFF',
    lineHeight: 28,
    fontWeight: '400',
    marginTop: 4,
  },
  addButton: {
    alignSelf: 'center',
    marginTop: 24,
  },
  tapesContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  comingSoonText: {
    fontSize: 18,
    color: '#666',
  },
  // Community styles
  communityCard: {
    backgroundColor: 'rgba(40, 40, 60, 0.8)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(91, 127, 222, 0.3)',
  },
  communityIcon: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  communityTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  communityDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  postsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  postCard: {
    backgroundColor: 'rgba(30, 30, 40, 0.8)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  postHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#5B7FDE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  postInfo: {
    flex: 1,
  },
  postUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postUsername: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFF',
  },
  postTime: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  postContent: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 22,
    marginBottom: 12,
  },
  postReactions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  reactionEmoji: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  joinButton: {
    backgroundColor: '#5B7FDE',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  joinButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  // Tapes styles
  tapesSection: {
    marginTop: 16,
  },
  tapesSectionTitle: {
    fontSize: 32,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 8,
  },
  tapesSectionSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 22,
    marginBottom: 24,
  },
  tapeCard: {
    backgroundColor: 'rgba(30, 30, 40, 0.9)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tapeTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#5B7FDE',
    marginBottom: 8,
  },
  tapeStatus: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  tapeImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  tapeDescription: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 22,
    marginBottom: 20,
  },
  playButton: {
    backgroundColor: '#5B7FDE',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  playButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  completionText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    maxWidth: 250,
  },
});