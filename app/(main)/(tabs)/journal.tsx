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
import { LinearGradient } from 'expo-linear-gradient';
import { Haptics } from '@/utils/haptics';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useConvexAuth } from '@/providers/ConvexAuthProvider';
import * as Linking from 'expo-linking';
// import { BlurView } from 'expo-blur'; // Requires rebuild
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
  const { isAuthenticated } = useConvexAuth();

  // Fetch journal entries from Convex only if authenticated
  const journalEntriesData = useQuery(
    api.journalEntries.list,
    isAuthenticated ? {} : 'skip'
  );
  const isLoading = isAuthenticated && journalEntriesData === undefined;
  
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
        
        {/* <TouchableOpacity 
          style={styles.infoButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <View style={styles.infoButtonInner}>
            <Ionicons name="information" size={20} color="#FFF" />
          </View>
        </TouchableOpacity> */}
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
                <View style={styles.entryCard}>
                  <View style={styles.entryCardGlass} />
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
                </View>
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
              <LinearGradient
                colors={['rgba(91, 127, 222, 0.15)', 'rgba(91, 127, 222, 0.05)']}
                style={styles.communityGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.communityHeader}>
                  <View style={styles.communityIconContainer}>
                    <Ionicons name="logo-discord" size={32} color="#5B7FDE" />
                  </View>
                  <View style={styles.communityTitleContainer}>
                    <Text style={styles.communityTitle}>You're not alone</Text>
                    <Text style={styles.communityDescription}>
                      Connect with others on the same journey
                    </Text>
                  </View>
                </View>
                
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
                          <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                        </View>
                        <Text style={styles.postTime}>Yesterday</Text>
                      </View>
                    </View>
                    <Text style={styles.postContent}>
                      new record: 14 days thanks Unbet 💪
                    </Text>
                  </View>
                  
                  <View style={styles.postCard}>
                    <View style={styles.postHeader}>
                      <View style={[styles.userAvatar, { backgroundColor: '#8B5FDE' }]}>
                        <Text style={styles.avatarText}>B</Text>
                      </View>
                      <View style={styles.postInfo}>
                        <Text style={styles.postUsername}>Bruce</Text>
                        <Text style={styles.postTime}>Today</Text>
                      </View>
                    </View>
                    <Text style={styles.postContent}>
                      Looking for accountability partner
                    </Text>
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={styles.joinButton}
                  onPress={async () => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    try {
                      await Linking.openURL('https://discord.gg/Ax8KGcFZ');
                    } catch (error) {
                      console.error('Failed to open Discord link:', error);
                    }
                  }}
                >
                  <Ionicons name="logo-discord" size={20} color="#FFF" />
                  <Text style={styles.joinButtonText}>Join Community</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFF" />
                </TouchableOpacity>
              </LinearGradient>
            </View>
            
            {/* Recovery Tapes Section */}
            <View style={styles.tapesSection}>
              <Text style={styles.tapesSectionTitle}>Recovery Tapes</Text>
              <Text style={styles.tapesSectionSubtitle}>
                Audio sessions designed to rewire your mind and break gambling habits.
              </Text>
              
              {/* Main Featured Tape */}
              <View style={styles.mainTapeCard}>
                <LinearGradient
                  colors={['#1a1a2e', '#16213e', '#0f3460']}
                  style={styles.mainTapeBackground}
                  start={{ x: 0.1, y: 0.1 }}
                  end={{ x: 0.9, y: 0.9 }}
                >
                  {/* Noise texture overlay */}
                  <View style={styles.noiseContainer}>
                    {[...Array(50)].map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.noiseDot,
                          {
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            opacity: 0.1 + Math.random() * 0.3,
                            transform: [{ scale: 0.5 + Math.random() * 1.2 }],
                          },
                        ]}
                      />
                    ))}
                  </View>
                  
                  <View style={styles.mainTapeContent}>
                    <View style={styles.mainTapeInfo}>
                      <Text style={styles.mainTapeTitle}>Mindful Recovery</Text>
                      <Text style={styles.mainTapeArtist}>Dr. Sarah Chen • 230 plays • 8:45</Text>
                      <Text style={styles.mainTapeDescription}>
                        A guided meditation to help you recognize triggers and build resilience against gambling urges.
                      </Text>
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.mainPlayButton}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        router.push('/tape-player?id=1');
                      }}
                    >
                      <Ionicons name="play" size={28} color="#000" />
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </View>
              
              {/* Preview Tapes */}
              <View style={styles.previewTapesContainer}>
                {[
                  { id: "2", title: "Breaking Free", artist: "Recovery Plus", plays: "187", duration: "12:30", icon: "link-outline", color: "#FF6B6B" },
                  { id: "3", title: "New Beginnings", artist: "Mark Thompson", plays: "143", duration: "6:15", icon: "leaf-outline", color: "#4ECDC4" },
                  { id: "4", title: "Daily Affirmations", artist: "Wellness Audio", plays: "256", duration: "4:22", icon: "heart-outline", color: "#95E1D3" },
                  { id: "5", title: "Financial Freedom", artist: "Success Mindset", plays: "98", duration: "9:18", icon: "trending-up-outline", color: "#FFD93D" }
                ].map((tape, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.previewTapeCard}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push(`/tape-player?id=${tape.id}`);
                    }}
                  >
                    <View style={styles.previewTapeAvatar}>
                      <LinearGradient
                        colors={['#2a2a4a', '#1a1a3a']}
                        style={styles.previewTapeAvatarBg}
                      >
                        <Ionicons name={tape.icon as any} size={18} color={tape.color} />
                      </LinearGradient>
                    </View>
                    
                    <View style={styles.previewTapeInfo}>
                      <Text style={styles.previewTapeTitle}>{tape.title}</Text>
                      <Text style={styles.previewTapeArtist}>
                        {tape.artist} • {tape.plays} plays • {tape.duration}
                      </Text>
                    </View>
                    
                    <Ionicons name="play-outline" size={20} color="#666" />
                  </TouchableOpacity>
                ))}
              </View>
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
    fontFamily: 'DMSans_400Regular',
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
    backgroundColor: 'rgba(30, 30, 35, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  entryCardGlass: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  entryCardInner: {
    paddingVertical: 20,
    paddingHorizontal: 24,
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
    fontFamily: 'DMSans_500Medium',
  },
  categoryBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 15,
    fontFamily: 'DMSans_500Medium',
    color: '#FFF',
  },
  entryContent: {
    fontSize: 20,
    color: '#FFF',
    lineHeight: 28,
    fontFamily: 'DMSans_400Regular',
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
    fontFamily: 'DMSans_400Regular',
    color: '#666',
  },
  // Community styles
  communityCard: {
    borderRadius: 24,
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(91, 127, 222, 0.2)',
  },
  communityGradient: {
    padding: 20,
  },
  communityHeader: {
    marginBottom: 16,
  },
  communityTextContainer: {
    alignItems: 'center',
  },
  communityTitle: {
    fontSize: 22,
    fontFamily: 'DMSans_500Medium',
    color: '#FFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  communityDescription: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  postsContainer: {
    gap: 10,
    marginBottom: 16,
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
    fontFamily: 'DMSans_500Medium',
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
    fontFamily: 'DMSans_500Medium',
    color: '#FFF',
  },
  postTime: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  postContent: {
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
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
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  joinButton: {
    backgroundColor: '#5865F2',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#5865F2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  joinButtonText: {
    fontSize: 16,
    fontFamily: 'DMSans_500Medium',
    color: '#FFF',
  },
  // Tapes styles
  tapesSection: {
    marginTop: 16,
  },
  tapesSectionTitle: {
    fontSize: 32,
    fontFamily: 'DMSans_500Medium',
    color: '#FFF',
    marginBottom: 8,
  },
  tapesSectionSubtitle: {
    fontSize: 16,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 22,
    marginBottom: 24,
  },
  mainTapeCard: {
    borderRadius: 24,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#5B7FDE',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 16,
    borderWidth: 1,
    borderColor: 'rgba(91, 127, 222, 0.2)',
  },
  mainTapeBackground: {
    padding: 24,
    position: 'relative',
    minHeight: 140,
  },
  mainTapeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mainTapeInfo: {
    flex: 1,
    marginRight: 16,
  },
  mainTapeTitle: {
    fontSize: 22,
    fontFamily: 'DMSans_500Medium',
    color: '#FFF',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  mainTapeArtist: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 10,
  },
  mainTapeDescription: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 22,
    maxWidth: '85%',
  },
  mainPlayButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  previewTapesContainer: {
    gap: 10,
    marginTop: 8,
  },
  previewTapeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(40, 40, 55, 0.8)',
    borderRadius: 16,
    padding: 14,
    opacity: 0.75,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  previewTapeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 14,
    shadowColor: '#5B7FDE',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  previewTapeAvatarBg: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewTapeInfo: {
    flex: 1,
  },
  previewTapeTitle: {
    fontSize: 15,
    fontFamily: 'DMSans_500Medium',
    color: '#FFF',
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  previewTapeArtist: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  tapeCard: {
    backgroundColor: 'rgba(30, 30, 40, 0.9)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tapeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tapeTitle: {
    fontSize: 20,
    fontFamily: 'DMSans_500Medium',
    color: '#5B7FDE',
    flex: 1,
  },
  tapeStatusBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  tapeStatusText: {
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    color: '#4CAF50',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tapeImageContainer: {
    width: '100%',
    height: 180,
    borderRadius: 20,
    marginVertical: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  tapeImageBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  noiseContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  noiseDot: {
    position: 'absolute',
    width: 2,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 1,
  },
  tapeDescription: {
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
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
    fontFamily: 'DMSans_500Medium',
    color: '#FFF',
  },
  completionText: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
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
    fontFamily: 'DMSans_400Regular',
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
    fontFamily: 'DMSans_500Medium',
    color: '#FFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'DMSans_400Regular',
    color: '#666',
    textAlign: 'center',
    maxWidth: 250,
  },
});