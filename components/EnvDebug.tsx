import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

export function EnvDebug() {
  const envVars = {
    EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
    EXPO_PUBLIC_CONVEX_URL: process.env.EXPO_PUBLIC_CONVEX_URL,
    EXPO_PUBLIC_MIXPANEL_TOKEN: process.env.EXPO_PUBLIC_MIXPANEL_TOKEN,
    EXPO_PUBLIC_ADJUST_APP_TOKEN: process.env.EXPO_PUBLIC_ADJUST_APP_TOKEN,
    EXPO_PUBLIC_FACEBOOK_APP_ID: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID,
    NODE_ENV: process.env.NODE_ENV,
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Environment Variables Debug</Text>
      {Object.entries(envVars).map(([key, value]) => (
        <View key={key} style={styles.row}>
          <Text style={styles.key}>{key}:</Text>
          <Text style={styles.value}>
            {value ? (value.length > 20 ? value.substring(0, 20) + '...' : value) : 'NOT SET'}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 50,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 10,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 5,
  },
  key: {
    fontWeight: 'bold',
    flex: 1,
  },
  value: {
    flex: 2,
    color: '#666',
  },
});