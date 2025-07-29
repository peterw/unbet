import { Redirect } from 'expo-router';
import { EnvDebug } from '@/components/EnvDebug';
import { useEffect } from 'react';

// Set to false to proceed with normal app flow
const DEBUG_ENV = false;
// Set to false to proceed with normal app flow
const TEST_ROUTING = false;

export default function Index() {
  useEffect(() => {
    console.log('Index component mounted');
  }, []);

  if (DEBUG_ENV) {
    return <EnvDebug />;
  }
  
  if (TEST_ROUTING) {
    console.log('Index route - redirecting to /test');
    return <Redirect href="/test" />;
  }
  
  console.log('Index route - redirecting to /(main)');
  // Redirect to the main layout which will handle auth
  return <Redirect href="/(main)" />;
}