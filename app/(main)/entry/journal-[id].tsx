import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView,
  Dimensions
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Haptics } from '@/utils/haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Starfield background component
function StarfieldBackground() {
  const stars = Array.from({ length: 150 }, (_, i) => ({
    key: i,
    x: Math.random() * SCREEN_WIDTH,
    y: Math.random() * SCREEN_HEIGHT,
    size: Math.random() * 1.5 + 0.3,
    opacity: Math.random() * 0.6 + 0.1,
  }));

  return (
    <View style={StyleSheet.absoluteFillObject}>
      {stars.map((star) => (
        <View
          key={star.key}
          style={[
            styles.star,
            {
              left: star.x,
              top: star.y,
              width: star.size * 2,
              height: star.size * 2,
              borderRadius: star.size,
              opacity: star.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
}

export default function JournalEntryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  // Mock data - in a real app, this would be fetched based on the ID
  const entry = {
    id: id as string,
    date: new Date(2024, 6, 23, 15, 7),
    content: 'Bekebensnne\n\nToday was challenging but I managed to stay strong. Had some difficult moments when I felt triggered, but I used the breathing exercises from the app and it really helped.\n\nFeeling grateful for:\n- My support system\n- The progress I\'ve made\n- This app for being there when I need it\n\nTomorrow I want to focus on staying present and taking things one moment at a time.',
    category: 'Thoughts',
    mood: 'reflective',
  };

  const formatDate = (date: Date) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    
    return {
      dayOfWeek: days[date.getDay()],
      fullDate: `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`,
      time: `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`,
    };
  };

  const dateInfo = formatDate(entry.date);

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
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <Ionicons name="close" size={24} color="#FFF" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.moreButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            // Handle more options
          }}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.dateContainer}>
          <Text style={styles.dayOfWeek}>{dateInfo.dayOfWeek}</Text>
          <Text style={styles.fullDate}>{dateInfo.fullDate}</Text>
          <Text style={styles.time}>{dateInfo.time}</Text>
        </View>

        <View style={styles.categoryContainer}>
          <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(entry.category) }]}>
            <Text style={styles.categoryText}>{entry.category}</Text>
          </View>
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.content}>{entry.content}</Text>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            // Handle edit
          }}
        >
          <Ionicons name="pencil" size={20} color="#5B7FDE" />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            // Handle share
          }}
        >
          <Ionicons name="share-outline" size={20} color="#5B7FDE" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            // Handle delete
          }}
        >
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
        </TouchableOpacity>
      </View>
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
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  dateContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  dayOfWeek: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
  },
  fullDate: {
    fontSize: 24,
    color: '#FFF',
    fontWeight: '500',
    marginBottom: 4,
  },
  time: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  categoryContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  categoryBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  contentContainer: {
    backgroundColor: 'rgba(40, 40, 40, 0.6)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  content: {
    fontSize: 17,
    color: '#FFF',
    lineHeight: 26,
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionText: {
    fontSize: 16,
    color: '#5B7FDE',
    fontWeight: '500',
  },
  deleteButton: {
    // Additional delete button styles if needed
  },
  deleteText: {
    color: '#FF3B30',
  },
});