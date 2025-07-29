import { Redirect, SplashScreen, Stack, Tabs } from 'expo-router';
import { useSession } from "@clerk/clerk-expo";
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

export default function MainLayout() {
  const { isSignedIn, session, isLoaded } = useSession();

  if (!isLoaded) {
    return null;
  }
  
  // Hide splash screen once Clerk is loaded
  SplashScreen.hideAsync();

  if (!isSignedIn) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Stack>
      <Stack.Screen 
        name="(tabs)" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen
        name="camera"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="describe"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="analysis"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen name="qr" options={{
        presentation: 'modal',
        headerShown: false,
      }} />
      <Stack.Screen name="entry/[id]" options={{ headerShown: false }} />
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
      <Stack.Screen name="entry/journal-[id]" options={{
        headerShown: false,
        animation: 'slide_from_right'
      }} />
      <Stack.Screen name="settings/lockdown" options={{
        headerShown: false,
        animation: 'slide_from_right'
      }} />
    </Stack>
  );
}