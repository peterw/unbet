import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { format, isSameDay, isAfter, parseISO } from 'date-fns';
import { Haptics } from '@/utils/haptics';

type WeekViewProps = {
  dates: Date[];
  selectedDate: string;
  multiWeekData: any;
  user: any;
  onDateSelect: (date: string) => void;
};

export const WeekView = ({ dates, selectedDate, multiWeekData, user, onDateSelect }: WeekViewProps) => {
  const getProgressColor = (progress: number) => {
    if (progress === 0) return '#FF0000';
    if (progress <= 0.25) return '#FFA500';
    if (progress <= 0.75) return '#E6B800';
    return '#4CAF50';
  };

  return (
    <View style={styles.weekContainer}>
      {dates.map((date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const isSelected = isSameDay(parseISO(selectedDate), date);
        const isToday = isSameDay(new Date(), date);
        const isFuture = isAfter(date, new Date());
        const dailyData = multiWeekData?.dailyTotals[dateStr];

        const dailyProgress = dailyData ?
          dailyData.totalProtein / (user?.dailyProtein ?? 1) : 0;
        const progressColor = !isFuture ? getProgressColor(dailyProgress) : '#CCC';

        return (
          <TouchableOpacity
            key={date.toISOString()}
            style={[styles.dateItem]}
            onPress={() => {
              if (!isFuture) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onDateSelect(dateStr);
              }
            }}
            disabled={isFuture}
          >
            <View style={[
              styles.letterContainer,
              isSelected && styles.selectedLetterContainer,
              !isSelected && !isFuture && dailyProgress > 0.75 && {
                borderColor: progressColor,
                borderWidth: 2
              },
              !isSelected && !isFuture && dailyProgress <= 0.75 && {
                borderStyle: 'dotted',
                borderWidth: 2,
                borderColor: progressColor
              }
            ]}>
              <Text style={[
                styles.dayName,
                isSelected && styles.selectedText,
                isFuture && styles.futureDateText,
                isToday && styles.todayText
              ]}>
                {format(date, 'EEEEE')}
              </Text>
            </View>
            <Text style={[
              styles.dayNumber,
              isSelected && styles.selectedDayNumber,
              isFuture && styles.futureDateText
            ]}>
              {format(date, 'd')}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  weekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  dateItem: {
    width: 45,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  letterContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#CCC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedLetterContainer: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  dayName: {
    fontSize: 14,
    color: '#666',
  },
  dayNumber: {
    fontSize: 16,
    color: '#000',
  },
  selectedDayNumber: {
    fontWeight: 'bold',
  },
  selectedText: {
    color: '#FFF',
  },
  futureDateText: {
    color: '#CCC',
  },
  todayText: {
    fontWeight: 'bold',
  },
}); 