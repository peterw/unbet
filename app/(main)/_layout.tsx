import { Redirect, SplashScreen, Stack, Tabs } from 'expo-router';
import { useSession } from "@clerk/clerk-expo";
import { Ionicons } from '@expo/vector-icons';
import { View, Text, ActivityIndicator } from 'react-native';

export default function MainLayout() {
  const { isSignedIn, session, isLoaded } = useSession();

  // Add timestamp to logs to track timing issues
  const logWithTime = (message: string) => {
    console.log(`[${new Date().toISOString()}] MainLayout - ${message}`);
  };

  logWithTime(`Auth state: isSignedIn=${isSignedIn}, isLoaded=${isLoaded}, hasSession=${!!session}`);

  if (!isLoaded) {
    logWithTime('Clerk not loaded yet, showing loading screen');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ marginTop: 10, color: '#fff' }}>Loading authentication...</Text>
      </View>
    );
  }

  if (!isSignedIn) {
    logWithTime('Not signed in, redirecting to onboarding');
    return <Redirect href="/onboarding" />;
  }

  logWithTime('User is signed in, rendering main content - tabs layout');

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