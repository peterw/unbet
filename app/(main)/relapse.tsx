import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Haptics } from '@/utils/haptics';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useConvexAuth } from '@/providers/ConvexAuthProvider';

export default function RelapseScreen() {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const updateUser = useMutation(api.users.updateCurrentUser);
  const user = useQuery(api.users.getCurrentUser, isAuthenticated ? {} : 'skip');

  const getTimeSinceLastRelapse = () => {
    if (!user) return '0 hours';
    
    const startDate = user.lastRelapseDate 
      ? new Date(user.lastRelapseDate) 
      : (user.recoveryStartDate ? new Date(user.recoveryStartDate) : new Date());
    
    const now = new Date();
    const diff = now.getTime() - startDate.getTime();
    const totalSeconds = Math.floor(diff / 1000);
    
    const days = Math.floor(totalSeconds / (24 * 60 * 60));
    const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} and ${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
  };

  const handleRestartMilestone = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    try {
      // Update the user's lastRelapseDate to now
      await updateUser({
        lastRelapseDate: new Date().toISOString(),
      });
      
      // Navigate back to home
      router.replace('/');
    } catch (error) {
      console.error('Error updating relapse date:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity 
        style={styles.closeButton}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.back();
        }}
      >
        <Ionicons name="close" size={28} color="#FFF" />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.brainContainer}>
          <View style={styles.coinOuter}>
            <LinearGradient
              colors={['#E8E8E8', '#C0C0C0', '#A8A8A8']}
              style={styles.coinInner}
              start={{ x: 0.2, y: 0.2 }}
              end={{ x: 0.8, y: 0.8 }}
            >
              <View style={styles.coinHighlight} />
              <View style={styles.coinShadow} />
            </LinearGradient>
          </View>
        </View>

        <Text style={styles.title}>Hey, It's completely okay.</Text>
        
        <Text style={styles.subtitle}>
          {user ? `You made it ${getTimeSinceLastRelapse()}. ` : ''}Don't let one bad moment wash away the hard work you've put in.
        </Text>

        <Text style={styles.stats}>
          358 people have restarted their journey today. Join them and come back stronger. You got this.
        </Text>
      </View>

      <TouchableOpacity style={styles.restartButton} onPress={handleRestartMilestone}>
        <Text style={styles.restartButtonText}>Restart Milestone</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 1,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brainContainer: {
    width: 180,
    height: 180,
    marginBottom: 40,
  },
  coinOuter: {
    width: '100%',
    height: '100%',
    borderRadius: 90,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 32,
    elevation: 24,
  },
  coinInner: {
    width: '94%',
    height: '94%',
    borderRadius: 85,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  coinHighlight: {
    position: 'absolute',
    top: 20,
    left: 25,
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 20,
    transform: [{ skewX: '-15deg' }],
  },
  coinShadow: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 30,
    transform: [{ skewX: '15deg' }],
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    color: '#AAA',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 30,
  },
  stats: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  restartButton: {
    backgroundColor: '#8B5FDE',
    paddingVertical: 18,
    paddingHorizontal: 60,
    borderRadius: 30,
    marginBottom: 40,
    marginHorizontal: 30,
  },
  restartButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});