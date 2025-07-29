import React from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, Dimensions } from 'react-native';

interface OnboardingScreenWrapperProps {
  children: React.ReactNode;
  scrollable?: boolean;
  hasTextInput?: boolean;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function OnboardingScreenWrapper({ 
  children, 
  scrollable = false,
  hasTextInput = false 
}: OnboardingScreenWrapperProps) {
  const content = (
    <View style={styles.container}>
      {children}
    </View>
  );

  if (hasTextInput) {
    return (
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        {scrollable ? (
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {content}
          </ScrollView>
        ) : (
          content
        )}
      </KeyboardAvoidingView>
    );
  }

  if (scrollable) {
    return (
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {content}
      </ScrollView>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: SCREEN_HEIGHT - 150, // Account for header and safe areas
  },
});