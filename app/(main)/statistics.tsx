import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Modal,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Haptics } from '../../utils/haptics';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function StatisticsScreen() {
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState('This Week');
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [selectedStreakOption, setSelectedStreakOption] = useState('');
  const [currentMonth, setCurrentMonth] = useState(6); // July (0-indexed)
  const [currentYear, setCurrentYear] = useState(2025);
  
  // Mock data for demonstration
  const activeDays = ['green', 'blue', null, null, null, null, null]; // M is green, T is blue
  const calendarDaysWithCircles = [1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 15, 16, 17, 18, 19, 22, 23, 24, 25, 26, 29, 30, 31];

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const hasCircle = calendarDaysWithCircles.includes(day);
      days.push(
        <View key={day} style={styles.calendarDay}>
          {hasCircle && <View style={styles.calendarDayCircle} />}
          <Text style={styles.calendarDayText}>{day}</Text>
        </View>
      );
    }
    
    return days;
  };

  const handlePreviousMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleUpdateStreak = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Handle streak update logic here
    setShowStreakModal(false);
  };

  const streakOptions = [
    '1 day ago',
    '2 days ago',
    '3 days ago',
    '4 days ago',
    '5 days ago',
    '6 days ago',
    '1 week ago',
    '2 weeks ago',
    '3 weeks ago',
    '1 month ago',
    '2 months ago',
    '3 months ago',
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* Stars background */}
      <View style={styles.starsContainer}>
        {[...Array(30)].map((_, i) => (
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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Statistics</Text>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowStreakModal(true);
            }}
          >
            <Ionicons name="pencil" size={24} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <TouchableOpacity 
            style={styles.arrowButton}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            <Ionicons name="chevron-back" size={24} color="#999" />
          </TouchableOpacity>
          <Text style={styles.periodText}>{selectedPeriod}</Text>
          <TouchableOpacity 
            style={styles.arrowButton}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Last 7 Days */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Last 7 DAYS AT A GLANCE</Text>
          <View style={styles.daysContainer}>
            {DAYS.map((day, index) => (
              <View key={index} style={styles.dayWrapper}>
                <View style={[
                  styles.dayCircle,
                  activeDays[index] === 'green' && styles.dayCircleGreen,
                  activeDays[index] === 'blue' && styles.dayCircleBlue,
                  !activeDays[index] && styles.dayCircleInactive
                ]}>
                  <Text style={[
                    styles.dayText,
                    activeDays[index] ? styles.dayTextActive : styles.dayTextInactive
                  ]}>{day}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Victory Calendar */}
        <View style={styles.section}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity 
              style={styles.arrowButton}
              onPress={handlePreviousMonth}
            >
              <Ionicons name="chevron-back" size={24} color="#999" />
            </TouchableOpacity>
            <Text style={styles.calendarTitle}>Victory Calendar</Text>
            <TouchableOpacity 
              style={styles.arrowButton}
              onPress={handleNextMonth}
            >
              <Ionicons name="chevron-forward" size={24} color="#999" />
            </TouchableOpacity>
          </View>

          <Text style={styles.monthYear}>{MONTHS[currentMonth]} {currentYear}</Text>

          {/* Calendar Week Days */}
          <View style={styles.calendarWeekDays}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
              <Text key={index} style={styles.calendarWeekDay}>{day}</Text>
            ))}
          </View>

          {/* Calendar Days */}
          <View style={styles.calendarDays}>
            {renderCalendarDays()}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <Ionicons name="time-outline" size={24} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/journal');
          }}
        >
          <Ionicons name="book-outline" size={24} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="bar-chart-outline" size={24} color="#5B7FDE" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/settings');
          }}
        >
          <Ionicons name="person-outline" size={24} color="#999" />
        </TouchableOpacity>
      </View>

      {/* Streak Update Modal */}
      <Modal
        visible={showStreakModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStreakModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Stars background */}
            <View style={styles.starsContainer}>
              {[...Array(30)].map((_, i) => (
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
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                style={styles.modalBackButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowStreakModal(false);
                }}
              >
                <Ionicons name="chevron-back" size={24} color="#999" />
              </TouchableOpacity>
              <Text style={styles.modalHeaderTitle}>Statistics</Text>
              <TouchableOpacity style={styles.modalEditButton}>
                <Ionicons name="pencil" size={24} color="#999" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalPeriodSelector}>
              <TouchableOpacity style={styles.arrowButton}>
                <Ionicons name="chevron-back" size={24} color="#999" />
              </TouchableOpacity>
              <Text style={styles.periodText}>This Week</Text>
              <TouchableOpacity style={styles.arrowButton}>
                <Ionicons name="chevron-forward" size={24} color="#999" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalTitle}>When did you start your streak?</Text>
              <Text style={styles.modalSubtitle}>Please give your best approximation</Text>

              <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
                {streakOptions.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionItem,
                      selectedStreakOption === option && styles.optionItemSelected
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedStreakOption(option);
                    }}
                  >
                    <Text style={[
                      styles.optionText,
                      selectedStreakOption === option && styles.optionTextSelected
                    ]}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={styles.updateButton}
                onPress={handleUpdateStreak}
              >
                <Text style={styles.updateButtonText}>Update Streak</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    width: 2,
    height: 2,
    backgroundColor: '#FFF',
    borderRadius: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 20,
  },
  arrowButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#FFF',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    letterSpacing: 1,
    marginBottom: 20,
    textTransform: 'uppercase',
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayWrapper: {
    alignItems: 'center',
  },
  dayCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleGreen: {
    backgroundColor: '#4CD964',
  },
  dayCircleBlue: {
    backgroundColor: '#5B7FDE',
  },
  dayCircleInactive: {
    borderWidth: 2,
    borderColor: '#333',
    borderStyle: 'dashed',
  },
  dayText: {
    fontSize: 18,
    fontWeight: '500',
  },
  dayTextActive: {
    color: '#FFF',
  },
  dayTextInactive: {
    color: '#666',
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  calendarTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFF',
  },
  monthYear: {
    fontSize: 20,
    fontWeight: '500',
    color: '#FFF',
    marginBottom: 20,
  },
  calendarWeekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  calendarWeekDay: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    width: 40,
    textAlign: 'center',
  },
  calendarDays: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 5,
  },
  calendarDayCircle: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#444',
    borderStyle: 'dashed',
  },
  calendarDayText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#FFF',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: '#0A0A0A',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
  },
  navItem: {
    padding: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 10,
  },
  modalBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalEditButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderTitle: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: -1,
  },
  modalPeriodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 20,
    opacity: 0.3,
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  modalTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 12,
    lineHeight: 42,
  },
  modalSubtitle: {
    fontSize: 18,
    fontWeight: '400',
    color: '#999',
    marginBottom: 40,
  },
  optionsList: {
    flex: 1,
    marginBottom: 20,
  },
  optionItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  optionItemSelected: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    marginVertical: 2,
    paddingHorizontal: 16,
  },
  optionText: {
    fontSize: 22,
    fontWeight: '400',
    color: '#666',
  },
  optionTextSelected: {
    color: '#FFF',
  },
  updateButton: {
    backgroundColor: '#5B7FDE',
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 40,
  },
  updateButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
});