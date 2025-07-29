import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { LineChart, BarChart } from 'react-native-gifted-charts';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import React, { useState, useEffect } from 'react';
import { format, eachDayOfInterval } from 'date-fns';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Haptics } from '@/utils/haptics';
import { useAnalytics } from '@/providers/AnalyticsProvider';

const screenWidth = Dimensions.get('window').width;

type TimeRange = '7d' | '4w' | '1y';

type ChartDataPoint = {
  label: string;
  value: number;
  frontColor?: string;
  dataPointText?: string;
};

type TooltipItem = {
  value: number;
  label: string;
  dataPointText?: string;
};

export default function AnalysisScreen() {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [prevData, setPrevData] = useState<any>(null);
  const router = useRouter();
  const today = new Date();

  // Analytics
  const analytics = useAnalytics();

  useEffect(() => {
    analytics.track({ name: 'Analysis Viewed' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getDateRange = () => {
    switch (timeRange) {
      case '7d':
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 6);
        weekStart.setHours(0, 0, 0, 0);
        return {
          startDate: format(weekStart, 'yyyy-MM-dd') + 'T00:00:00.000Z',
          endDate: format(today, 'yyyy-MM-dd') + 'T23:59:59.999Z',
          displayRange: `${format(weekStart, 'd MMM')} - ${format(today, 'd')}`
        };
      case '4w':
        const monthStart = new Date();
        monthStart.setDate(monthStart.getDate() - 27);
        monthStart.setHours(0, 0, 0, 0);
        return {
          startDate: format(monthStart, 'yyyy-MM-dd') + 'T00:00:00.000Z',
          endDate: format(today, 'yyyy-MM-dd') + 'T23:59:59.999Z',
          displayRange: `${format(monthStart, 'd MMM')} - ${format(today, 'd MMM')}`
        };
      case '1y':
        const yearStart = new Date();
        yearStart.setFullYear(yearStart.getFullYear() - 1);
        return {
          startDate: format(yearStart, 'yyyy-MM-dd') + 'T00:00:00.000Z',
          endDate: format(today, 'yyyy-MM-dd') + 'T23:59:59.999Z',
          displayRange: `${format(yearStart, 'MMM yyyy')} - ${format(today, 'MMM yyyy')}`
        };
    }
  };

  const { startDate, endDate, displayRange } = getDateRange();
  const proteinData = useQuery(api.protein.getProteinEntries, {
    startDate,
    endDate
  });
  const user = useQuery(api.users.getCurrentUser);

  useEffect(() => {
    if (proteinData) {
      setPrevData(proteinData);
    }
  }, [proteinData]);

  if (!user) return null;
  if (!proteinData && !prevData) return null;

  const processData = (): ChartDataPoint[] => {
    const data = proteinData || prevData;
    const endDate = new Date();
    let startDate = new Date();

    switch (timeRange) {
      case '7d':
        startDate.setDate(startDate.getDate() - 6);
        break;
      case '4w':
        startDate.setDate(startDate.getDate() - 27);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const dateRange = eachDayOfInterval({
      start: startDate,
      end: endDate
    });

    if (timeRange === '1y') {
      const monthlyData = Array(12).fill(0).map((_, index) => {
        const month = new Date(today.getFullYear(), today.getMonth() - (11 - index));
        const monthStr = format(month, 'yyyy-MM');
        const monthEntries = data.filter((entry: { date: string }) =>
          entry.date.startsWith(monthStr)
        );

        const total = monthEntries.reduce((sum: number, entry: { totalProteinEstimate: number }) =>
          sum + entry.totalProteinEstimate, 0
        );
        const daysInMonth = monthEntries.length || 1;

        return {
          label: format(month, 'MMM'),
          value: Math.round(total / daysInMonth),
          frontColor: '#5A5AFF',
        };
      });

      return monthlyData;
    } else {
      return dateRange.map((date, index) => {
        const dateStr = format(date, 'yyyy-MM-dd');

        const entries = data.filter((entry: { date: string }) => {
          const entryDate = entry.date.split('T')[0];
          return entryDate === dateStr;
        });

        const value = entries.reduce((sum: number, entry: { totalProteinEstimate: number }) =>
          sum + entry.totalProteinEstimate, 0
        );

        return {
          label: index === 0 || index === dateRange.length - 1
            ? format(date, timeRange === '7d' ? 'd/MM' : 'd MMM')
            : '',
          value,
          dataPointText: timeRange === '7d' ? `${value}` : '',
          frontColor: '#5A5AFF',
        };
      });
    }
  };

  const chartData = processData();
  const maxValue = Math.max(...chartData.map(d => d.value), user.dailyProtein || 0);
  const yAxisMax = Math.ceil(maxValue / 25) * 25;

  const average = Math.round(chartData.reduce((sum, item) => sum + item.value, 0) / chartData.length);
  const highest = Math.max(...chartData.map(item => item.value));
  const lowest = Math.min(...chartData.map(item => item.value));

  const renderChart = () => {
    const chartWidth = screenWidth - 80;
    const commonProps = {
      width: chartWidth,
      height: 180,
      color: '#000',
      curved: false,
      hideRules: false,
      rulesColor: '#E5E5E5',
      xAxisThickness: 0,
      yAxisThickness: 0,
      hideOrigin: true,
      noOfSections: 5,
      maxValue: yAxisMax,
      yAxisLabelTexts: Array.from({ length: 6 }, (_, i) =>
        Math.round(yAxisMax * i / 5).toString()
      ),
      initialSpacing: 20,
      endSpacing: 20,
      spacing: timeRange === '7d' ? 45 : timeRange === '4w' ? 9 : 25,
      xAxisLabelWidth: 35,
      bottomLabelMargin: 8,
      yAxisTextStyle: { color: '#666', fontSize: 12 },
      xAxisLabelTextStyle: {
        color: '#666',
        fontSize: 10,
        width: 35,
      },
      dataPointsRadius: 3,
      dataPointsColor: '#000',
      thickness: 2,
      showVerticalLines: false,
      rulesLength: chartWidth - 10,
    };

    return (
      <View style={{ position: 'relative' }}>
        <LineChart
          {...commonProps}
          data={chartData}
          hideDataPoints={true}
        />
        {user.dailyProtein && (
          <>
            <View
              style={[
                styles.goalLine,
                {
                  top: 180 * (1 - user.dailyProtein / yAxisMax)
                }
              ]}
            />
            <Text
              style={[
                styles.goalText,
                {
                  top: 180 * (1 - user.dailyProtein / yAxisMax) - 8
                }
              ]}
            >
              Goal: {user.dailyProtein}g
            </Text>
          </>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Intake Analysis</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.timeRangeContainer}>
        {(['7d', '4w', '1y'] as TimeRange[]).map((period) => (
          <TouchableOpacity
            key={period}
            style={[styles.timeRangeButton, timeRange === period && styles.activeTimeRange]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setTimeRange(period);
              analytics.track({ name: 'Analysis TimeRange Selected', properties: { range: period } });
            }}
          >
            <Text style={[styles.timeRangeText, timeRange === period && styles.activeTimeRangeText]}>
              {period}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.dateRangeText}>{displayRange}</Text>

      <View style={styles.chartContainer}>
        {renderChart()}
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>
            {average}g
          </Text>
          <Text style={styles.statLabel}>Average</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>
            {highest}g
          </Text>
          <Text style={styles.statLabel}>Highest</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>
            {lowest}g
          </Text>
          <Text style={styles.statLabel}>Lowest</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 4,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTimeRange: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  timeRangeText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTimeRangeText: {
    color: '#000',
  },
  chartContainer: {
    backgroundColor: '#fff',
    padding: 8,
    marginBottom: 12,
    height: 200,
    justifyContent: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  goalLine: {
    position: 'absolute',
    left: 30,
    right: 0,
    height: 1,
    borderWidth: 1,
    borderColor: 'orange',
    zIndex: -1,
  },
  goalText: {
    position: 'absolute',
    right: 8,
    fontSize: 11,
    color: Colors.light.tint,
    fontWeight: '500',
    backgroundColor: 'white',
    paddingHorizontal: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  dateRangeText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 16,
  },
  tooltip: {
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  tooltipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },
}); 