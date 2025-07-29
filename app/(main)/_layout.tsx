import { Redirect, SplashScreen, Stack, Tabs } from 'expo-router';
import { useSession } from "@clerk/clerk-expo";
import { Ionicons } from '@expo/vector-icons';
import { View, Text, ActivityIndicator } from 'react-native';
import { useConvexAuth } from '@/providers/ConvexAuthProvider';

export default function MainLayout() {
  const { isSignedIn, session, isLoaded } = useSession();
  const { isAuthenticated, isLoading: convexLoading } = useConvexAuth();

  // Add timestamp to logs to track timing issues
  const logWithTime = (message: string) => {
    console.log(`[${new Date().toISOString()}] MainLayout - ${message}`);
  };

  logWithTime(`Auth state: isSignedIn=${isSignedIn}, isLoaded=${isLoaded}, hasSession=${!!session}, isAuthenticated=${isAuthenticated}`);

  if (!isLoaded || convexLoading) {
    logWithTime('Auth not fully loaded yet, showing loading screen');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ marginTop: 10, color: '#fff' }}>Loading...</Text>
      </View>
    );
  }

  if (!isSignedIn) {
    logWithTime('Not signed in, redirecting to onboarding');
    return <Redirect href="/onboarding" />;
  }

  if (!isAuthenticated) {
    logWithTime('Not authenticated in Convex, showing loading');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ marginTop: 10, color: '#fff' }}>Setting up your account...</Text>
      </View>
    );
  }

  logWithTime('User is fully authenticated, rendering main content');

  return (
    <Stack>
      <Stack.Screen 
        name="(tabs)" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen name="qr" options={{
        presentation: 'modal',
        headerShown: false,
      }} />
      <Stack.Screen name="settings" options={{
        headerShown: false,
        animation: 'slide_from_right'
      }} />
      <Stack.Screen name="chat" options={{
        headerShown: false,
        presentation: 'modal'
      }} />
      <Stack.Screen name="relapse" options={{
        headerShown: false,
        presentation: 'modal'
      }} />
      <Stack.Screen name="reflect" options={{
        headerShown: false,
        presentation: 'modal'
      }} />
      <Stack.Screen name="lockdown" options={{
        headerShown: false,
        presentation: 'modal'
      }} />
      <Stack.Screen name="tape-player" options={{
        headerShown: false,
        presentation: 'modal'
      }} />
      <Stack.Screen name="settings/lockdown" options={{
        headerShown: false,
        animation: 'slide_from_right'
      }} />
    </Stack>
  );
}