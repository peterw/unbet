import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOAuth, useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function AuthScreen() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: 'oauth_google' });
  const { startOAuthFlow: startAppleOAuth } = useOAuth({ strategy: 'oauth_apple' });

  useEffect(() => {
    // If already signed in, redirect to main app
    // The main layout will handle onboarding check
    if (isLoaded && isSignedIn) {
      router.replace('/(main)');
    }
  }, [isLoaded, isSignedIn]);

  const handleOAuthSignIn = React.useCallback(async (strategy: 'oauth_google' | 'oauth_apple') => {
    try {
      const startOAuthFlow = strategy === 'oauth_google' ? startGoogleOAuth : startAppleOAuth;
      const { createdSessionId, setActive } = await startOAuthFlow();
      
      if (createdSessionId) {
        await setActive!({ session: createdSessionId });
        // Navigation will happen automatically via useEffect
      }
    } catch (err: any) {
      console.error('OAuth error:', err);
      Alert.alert('Sign In Error', err.message || 'Failed to sign in. Please try again.');
    }
  }, [startGoogleOAuth, startAppleOAuth]);

  if (!isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5B8DFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Background stars */}
      <View style={styles.starsContainer}>
        {[...Array(50)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.star,
              {
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.8 + 0.2,
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue your journey</Text>

        {/* Auth buttons */}
        <View style={styles.authButtons}>
          <TouchableOpacity
            style={styles.authButton}
            onPress={() => handleOAuthSignIn('oauth_google')}
            activeOpacity={0.8}
          >
            <Ionicons name="logo-google" size={24} color="#FFFFFF" />
            <Text style={styles.authButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.authButton, styles.appleButton]}
            onPress={() => handleOAuthSignIn('oauth_apple')}
            activeOpacity={0.8}
          >
            <Ionicons name="logo-apple" size={24} color="#000000" />
            <Text style={[styles.authButtonText, styles.appleButtonText]}>Continue with Apple</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => router.push('/onboarding')}>
            <Text style={styles.signupLink}>Start your journey</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.termsText}>
          By continuing, you agree to our Terms & Privacy Policy
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  starsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  star: {
    position: 'absolute',
    width: 2,
    height: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 42,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 40,
  },
  authButtons: {
    width: '100%',
    gap: 16,
    marginBottom: 40,
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5B8DFF',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 12,
  },
  appleButton: {
    backgroundColor: '#FFFFFF',
  },
  authButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  appleButtonText: {
    color: '#000000',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  signupLink: {
    fontSize: 16,
    color: '#5B8DFF',
    fontWeight: '600',
  },
  termsText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});