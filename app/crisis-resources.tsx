import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Linking,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Haptics } from '@/utils/haptics';

const CRISIS_RESOURCES = [
  {
    title: 'National Crisis Hotline',
    subtitle: '988 Suicide & Crisis Lifeline',
    phone: '988',
    description: '24/7 free and confidential support for people in distress',
    urgent: true,
  },
  {
    title: 'National Problem Gambling Helpline',
    subtitle: '1-800-522-4700',
    phone: '18005224700',
    description: '24/7 confidential support for gambling problems',
    urgent: true,
  },
  {
    title: 'Crisis Text Line',
    subtitle: 'Text HOME to 741741',
    phone: '741741',
    description: '24/7 crisis support via text message',
    isText: true,
  },
  {
    title: 'Gamblers Anonymous',
    subtitle: 'Find local meetings',
    url: 'https://www.gamblersanonymous.org/',
    description: 'Peer support groups for gambling addiction recovery',
  },
  {
    title: 'National Council on Problem Gambling',
    subtitle: 'Resources and information',
    url: 'https://www.ncpgambling.org/',
    description: 'Educational resources and treatment referrals',
  },
];

export default function CrisisResourcesScreen() {
  const router = useRouter();

  const handleCall = async (phone: string, isText?: boolean) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const url = isText ? `sms:${phone}` : `tel:${phone}`;
      const canOpen = await Linking.canOpenURL(url);
      
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          'Unable to open',
          isText ? 'Please text HOME to 741741 manually' : `Please call ${phone} manually`
        );
      }
    } catch (error) {
      console.error('Error opening contact:', error);
      Alert.alert('Error', 'Unable to open contact method');
    }
  };

  const handleWebsite = async (url: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const canOpen = await Linking.canOpenURL(url);
      
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Unable to open', 'Please visit the website manually');
      }
    } catch (error) {
      console.error('Error opening website:', error);
      Alert.alert('Error', 'Unable to open website');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Crisis Resources</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.emergencyBanner}>
          <Ionicons name="warning" size={24} color="#FF4444" />
          <Text style={styles.emergencyText}>
            If you're having thoughts of self-harm or suicide, please call 988 immediately
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Immediate Help</Text>
        
        {CRISIS_RESOURCES.map((resource, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.resourceCard,
              resource.urgent && styles.urgentCard
            ]}
            onPress={() => {
              if (resource.phone) {
                handleCall(resource.phone, resource.isText);
              } else if (resource.url) {
                handleWebsite(resource.url);
              }
            }}
          >
            <View style={styles.resourceContent}>
              <View style={styles.resourceInfo}>
                <Text style={[
                  styles.resourceTitle,
                  resource.urgent && styles.urgentTitle
                ]}>
                  {resource.title}
                </Text>
                <Text style={styles.resourceSubtitle}>{resource.subtitle}</Text>
                <Text style={styles.resourceDescription}>{resource.description}</Text>
              </View>
              <View style={[
                styles.resourceIcon,
                resource.urgent && styles.urgentIcon
              ]}>
                <Ionicons 
                  name={resource.phone ? (resource.isText ? "chatbubble" : "call") : "globe"} 
                  size={24} 
                  color={resource.urgent ? "#FF4444" : "#5B7FDE"} 
                />
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.disclaimerSection}>
          <Text style={styles.disclaimerTitle}>Important Disclaimer</Text>
          <Text style={styles.disclaimerText}>
            Unbet is not a substitute for professional medical or psychological treatment. 
            If you are experiencing severe gambling addiction, depression, or suicidal thoughts, 
            please seek immediate professional help.
          </Text>
          <Text style={styles.disclaimerText}>
            The resources provided are for informational purposes only. Unbet does not 
            guarantee the availability or quality of these external services.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginRight: 44, // Compensate for back button
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderColor: '#FF4444',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  emergencyText: {
    flex: 1,
    color: '#FF4444',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  resourceCard: {
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222222',
  },
  urgentCard: {
    borderColor: '#FF4444',
    backgroundColor: 'rgba(255, 68, 68, 0.05)',
  },
  resourceContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resourceInfo: {
    flex: 1,
    marginRight: 16,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  urgentTitle: {
    color: '#FF4444',
  },
  resourceSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5B7FDE',
    marginBottom: 6,
  },
  resourceDescription: {
    fontSize: 12,
    color: '#999999',
    lineHeight: 16,
  },
  resourceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(91, 127, 222, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  urgentIcon: {
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
  },
  disclaimerSection: {
    marginTop: 32,
    padding: 20,
    backgroundColor: '#111111',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222222',
  },
  disclaimerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#999999',
    lineHeight: 18,
    marginBottom: 12,
  },
});