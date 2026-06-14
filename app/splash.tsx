import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import TaskHubLogo from '@/assets/images/taskhub-logo.svg';

// Branded splash shown after the native splash, before onboarding.
const SPLASH_DURATION_MS = 2000;
const LOGO_WIDTH = 174.281;
const LOGO_HEIGHT = 88;

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => router.replace('/onboarding'), SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <TaskHubLogo width={LOGO_WIDTH} height={LOGO_HEIGHT} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6c3bff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
