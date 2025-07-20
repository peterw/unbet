import { Redirect, SplashScreen, Stack, Tabs } from 'expo-router';
import { useSession } from "@clerk/clerk-expo";

export default function TabLayout() {
  const { isSignedIn, session, isLoaded } = useSession();

  if (!isLoaded) {
    return null;
  }
  SplashScreen.hideAsync();

  if (!isSignedIn) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
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
        presentation: 'modal',
        headerShown: false
      }} />
    </Stack>
  );
}
