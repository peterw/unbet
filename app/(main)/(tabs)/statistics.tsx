import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Modal,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Haptics } from '../../../utils/haptics';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useConvexAuth } from '@/providers/SimpleConvexAuth';

const DAYS_SHORT = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DAYS_FULL = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function StatisticsScreen() {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [selectedStreakOption, setSelectedStreakOption] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  // Get user data from Convex
  const user = useQuery(api.users.getCurrentUser, isAuthenticated ? {} : 'skip');
  const updateUser = useMutation(api.users.updateCurrentUser);
  const isLoading = isAuthenticated && user === undefined;
  
  // Calculate real data from user recovery data
  const calculateDaysSinceStart = () => {
    if (!user?.recoveryStartDate) return 0;
    const startDate = new Date(user.recoveryStartDate);
    const now = new Date();
    const diff = now.getTime() - startDate.getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  const calculateCurrentStreak = () => {
    if (!user?.lastRelapseDate && !user?.recoveryStartDate) {
      return 0;
    }
    
    if (!user?.lastRelapseDate && user?.recoveryStartDate) {
      return calculateDaysSinceStart();
    }
    
    const lastRelapse = new Date(user.lastRelapseDate);
    const now = new Date();
    const diff = now.getTime() - lastRelapse.getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  const generateWeekDays = () => {
    const today = new Date();
    const currentStreak = calculateCurrentStreak();
    const days = [];
    
    // Get start of current week (Monday)
    const startOfWeek = new Date(today);
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(startOfWeek);
      currentDay.setDate(startOfWeek.getDate() + i);
      
      const isStreakDay = currentDay <= today && currentStreak > 0;
      const daysSinceStart = user?.recoveryStartDate ? Math.floor((currentDay.getTime() - new Date(user.recoveryStartDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;
      
      days.push({
        day: DAYS_SHORT[i],
        color: isStreakDay && daysSinceStart >= 0 ? '#4CAF50' : null,
        active: isStreakDay && daysSinceStart >= 0
      });
    }
    
    return days;
  };

  const generateCalendarDays = () => {
    if (!user?.recoveryStartDate) return [];
    
    const recoveryStart = new Date(user.recoveryStartDate);
    const currentDate = new Date(currentYear, currentMonth + 1, 0); // Last day of current month
    const streakDays = [];
    
    // If user has no relapses, mark all days since recovery start
    if (!user.lastRelapseDate) {
      const startDay = Math.max(1, recoveryStart.getMonth() === currentMonth && recoveryStart.getFullYear() === currentYear ? recoveryStart.getDate() : 1);
      const endDay = currentDate.getDate();
      
      for (let day = startDay; day <= endDay; day++) {
        const dayDate = new Date(currentYear, currentMonth, day);
        if (dayDate >= recoveryStart && dayDate <= new Date()) {
          streakDays.push(day);
        }
      }
    } else {
      // Mark days since last relapse
      const lastRelapse = new Date(user.lastRelapseDate);
      const streakStart = new Date(lastRelapse);
      streakStart.setDate(lastRelapse.getDate() + 1); // Start streak day after relapse
      
      const startDay = Math.max(1, streakStart.getMonth() === currentMonth && streakStart.getFullYear() === currentYear ? streakStart.getDate() : 1);
      const endDay = currentDate.getDate();
      
      for (let day = startDay; day <= endDay; day++) {
        const dayDate = new Date(currentYear, currentMonth, day);
        if (dayDate >= streakStart && dayDate <= new Date()) {
          streakDays.push(day);
        }
      }
    }
    
    return streakDays;
  };
  
  const weekDays = generateWeekDays();
  const calendarDaysWithCircles = generateCalendarDays();

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const changeMonth = (direction: number) => {
    if (direction === -1) {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];
    
    // Add day headers
    const dayHeaders = (
      <View style={styles.weekDaysRow} key="headers">
        {DAYS_FULL.map((day, index) => (
          <Text key={index} style={styles.weekDayHeader}>{day}</Text>
        ))}
      </View>
    );
    
    days.push(dayHeaders);
    
    // Create weeks
    let week = [];
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) {
      week.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const hasCircle = calendarDaysWithCircles.includes(day);
      
      week.push(
        <TouchableOpacity 
          key={day} 
          style={styles.calendarDay}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          {hasCircle && <View style={styles.calendarDayCircle} />}
          <Text style={[
            styles.calendarDayText,
            hasCircle && styles.calendarDayTextActive
          ]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
      
      // Start new week
      if ((firstDay + day - 1) % 7 === 6 || day === daysInMonth) {
        days.push(
          <View key={`week-${day}`} style={styles.weekRow}>
            {week}
          </View>
        );
        week = [];
      }
    }
    
    return days;
  };

  const streakOptions = [
    { label: 'Today', days: 0 },
    { label: '1 day ago', days: 1 },
    { label: '2 days ago', days: 2 },
    { label: '3 days ago', days: 3 },
    { label: '4 days ago', days: 4 },
    { label: '5 days ago', days: 5 },
    { label: '6 days ago', days: 6 },
    { label: '1 week ago', days: 7 },
    { label: '2 weeks ago', days: 14 },
    { label: '1 month ago', days: 30 },
  ];

  const handleUpdateStreak = async () => {
    if (!selectedStreakOption || !user) return;
    
    try {
      const selectedOption = streakOptions.find(opt => opt.label === selectedStreakOption);
      if (!selectedOption) return;
      
      // Calculate the new recovery start date based on selected option
      const newStartDate = new Date();
      newStartDate.setDate(newStartDate.getDate() - selectedOption.days);
      
      // Update user's recovery start date and clear any previous relapse date
      await updateUser({
        recoveryStartDate: newStartDate.toISOString(),
        lastRelapseDate: undefined, // Clear relapse date when setting new streak
      });
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setShowStreakModal(false);
      setSelectedStreakOption('');
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  };

  // Handle loading state
  if (!isAuthenticated || isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5B7FDE" />
          <Text style={styles.loadingText}>
            {!isAuthenticated ? 'Authenticating...' : 'Loading statistics...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
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
          <Ionicons name="pencil" size={20} color="#5B7FDE" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* This Week Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>This Week</Text>
            <View style={styles.navigationButtons}>
              <TouchableOpacity
                style={styles.navButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Ionicons name="chevron-back" size={18} color="#999" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.navButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Ionicons name="chevron-forward" size={18} color="#999" />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.weekDaysContainer}>
            {weekDays.map((day, index) => (
              <View key={index} style={styles.dayContainer}>
                <View style={[
                  styles.dayCircle,
                  day.active && { backgroundColor: day.color }
                ]}>
                  <Text style={[
                    styles.dayText,
                    day.active && styles.dayTextActive
                  ]}>
                    {day.day}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Victory Calendar Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Victory Calendar</Text>
            <View style={styles.navigationButtons}>
              <TouchableOpacity
                style={styles.navButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  changeMonth(-1);
                }}
              >
                <Ionicons name="chevron-back" size={18} color="#999" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.navButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  changeMonth(1);
                }}
              >
                <Ionicons name="chevron-forward" size={18} color="#999" />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.monthYearContainer}>
            <Text style={styles.monthYearText}>
              {MONTHS[currentMonth]} {currentYear}
            </Text>
          </View>
          
          <View style={styles.calendar}>
            {renderCalendarDays()}
          </View>
        </View>
      </ScrollView>

      {/* Streak Selection Modal */}
      <Modal
        visible={showStreakModal}
        transparent
        animationType="slide"
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={() => setShowStreakModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>When did you start your streak?</Text>
              <TouchableOpacity
                onPress={() => setShowStreakModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.optionsContainer}>
              {streakOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionItem,
                    selectedStreakOption === option.label && styles.optionItemSelected
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedStreakOption(option.label);
                  }}
                >
                  <Text style={[
                    styles.optionText,
                    selectedStreakOption === option.label && styles.optionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                  {selectedStreakOption === option.label && (
                    <Ionicons name="checkmark" size={20} color="#5B7FDE" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity
              style={[
                styles.updateButton,
                !selectedStreakOption && styles.updateButtonDisabled
              ]}
              onPress={handleUpdateStreak}
              disabled={!selectedStreakOption}
            >
              <Text style={[
                styles.updateButtonText,
                !selectedStreakOption && styles.updateButtonTextDisabled
              ]}>Update Streak</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 34,
    fontFamily: 'DMSans_500Medium',
    color: '#FFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
    fontFamily: 'DMSans_400Regular',
    marginTop: 16,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(91, 127, 222, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: 'DMSans_500Medium',
    color: '#FFF',
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  navButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  dayContainer: {
    alignItems: 'center',
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 16,
    fontFamily: 'DMSans_500Medium',
    color: '#666',
  },
  dayTextActive: {
    color: '#FFF',
  },
  monthYearContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  monthYearText: {
    fontSize: 18,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  calendar: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  weekDayHeader: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'DMSans_400Regular',
    width: 40,
    textAlign: 'center',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  calendarDay: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  calendarDayCircle: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#5B7FDE',
  },
  calendarDayText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'DMSans_400Regular',
  },
  calendarDayTextActive: {
    color: '#FFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'DMSans_500Medium',
    color: '#FFF',
    flex: 1,
  },
  modalCloseButton: {
    padding: 4,
  },
  optionsContainer: {
    marginBottom: 24,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  optionItemSelected: {
    backgroundColor: 'rgba(91, 127, 222, 0.1)',
    borderWidth: 1,
    borderColor: '#5B7FDE',
  },
  optionText: {
    fontSize: 16,
    fontFamily: 'DMSans_400Regular',
    color: '#FFF',
  },
  optionTextSelected: {
    color: '#5B7FDE',
    fontFamily: 'DMSans_500Medium',
  },
  updateButton: {
    backgroundColor: '#5B7FDE',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  updateButtonDisabled: {
    backgroundColor: '#333',
    opacity: 0.5,
  },
  updateButtonText: {
    fontSize: 16,
    fontFamily: 'DMSans_500Medium',
    color: '#FFF',
  },
  updateButtonTextDisabled: {
    color: '#666',
  },
});