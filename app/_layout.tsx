import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
  useFonts,
} from '@expo-google-fonts/geist';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/lib/auth/auth-context';
import { queryClient } from '@/lib/query-client';

import { LocationProvider } from '@/context/LocationContext';
import { TaskProvider } from '@/context/TaskContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SafeAreaProvider>
          <LocationProvider>
            <TaskProvider>
              <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="splash" options={{ headerShown: false }} />
                  <Stack.Screen name="onboarding" options={{ headerShown: false }} />
                  <Stack.Screen name="purpose" options={{ headerShown: false }} />
                  <Stack.Screen name="login" options={{ headerShown: false }} />
                  <Stack.Screen name="create-account" options={{ headerShown: false }} />
                  <Stack.Screen name="otp" options={{ headerShown: false }} />
                  <Stack.Screen name="purpose-selection" options={{ headerShown: false }} />
                  <Stack.Screen name="location-university" options={{ headerShown: false }} />
                  <Stack.Screen name="location-permission" options={{ headerShown: false }} />
                  <Stack.Screen name="location-confirm" options={{ headerShown: false }} />
                  <Stack.Screen name="location-map" options={{ headerShown: false }} />
                  <Stack.Screen name="success" options={{ headerShown: false }} />
                  <Stack.Screen name="login-form" options={{ headerShown: false }} />
                  <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
                  <Stack.Screen name="forgot-password-sent" options={{ headerShown: false }} />
                  <Stack.Screen name="create-new-password" options={{ headerShown: false }} />
                  <Stack.Screen name="reset-success" options={{ headerShown: false }} />
                  <Stack.Screen name="task-agreement" options={{ headerShown: false }} />
                  <Stack.Screen name="track-task" options={{ headerShown: false }} />
                  <Stack.Screen name="my-reviews" options={{ headerShown: false }} />
                  <Stack.Screen name="settings" options={{ headerShown: false }} />
                  <Stack.Screen name="change-password" options={{ headerShown: false }} />
                  <Stack.Screen name="change-password-success" options={{ headerShown: false }} />
                  <Stack.Screen name="saved-taskers" options={{ headerShown: false }} />
                  <Stack.Screen name="notification-details" options={{ headerShown: false }} />
                  <Stack.Screen name="receipt" options={{ headerShown: false }} />
                  <Stack.Screen name="help-support" options={{ headerShown: false }} />
                  <Stack.Screen name="blocked-users" options={{ headerShown: false }} />
                  <Stack.Screen name="device-sessions" options={{ headerShown: false }} />
                  <Stack.Screen name="select-verification" options={{ headerShown: false }} />
                  <Stack.Screen name="nin-verification" options={{ headerShown: false }} />
                  <Stack.Screen name="phone-number" options={{ headerShown: false }} />
                  <Stack.Screen name="wallet" options={{ headerShown: false }} />
                  <Stack.Screen name="transaction-history" options={{ headerShown: false }} />
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="screens" options={{ headerShown: false }} />
                  <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
                  <Stack.Screen name="location-selector-modal" options={{ presentation: 'modal', headerShown: false }} />
                </Stack>
                <StatusBar style="auto" />
              </ThemeProvider>
            </TaskProvider>
          </LocationProvider>
        </SafeAreaProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
