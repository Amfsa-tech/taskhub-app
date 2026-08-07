import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
  useFonts,
} from '@expo-google-fonts/geist';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { useAppStateFocus } from '@/hooks/use-app-state-focus';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/lib/auth/auth-context';
import { initPush } from '@/lib/push';
import { queryClient } from '@/lib/query-client';

import { LocationProvider } from '@/context/LocationContext';
import { PostTaskProvider } from '@/context/PostTaskContext';

// The app shell is the anchor, so popping back from a pushed screen lands in
// the tabs — not on a stray intro route.
export const unstable_settings = {
  anchor: '(main)',
};

SplashScreen.preventAutoHideAsync();

// Catches render-time errors anywhere in the tree; without it a single bad
// screen takes the whole release app down.
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  console.error(error);
  return (
    <View style={errorStyles.container}>
      <Text style={errorStyles.title}>Something went wrong</Text>
      <Text style={errorStyles.message}>
        An unexpected error occurred. Please try again.
      </Text>
      <Pressable
        style={({ pressed }) => [errorStyles.button, pressed && errorStyles.buttonPressed]}
        onPress={retry}>
        <Text style={errorStyles.buttonLabel}>Try again</Text>
      </Pressable>
    </View>
  );
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9fb',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111122',
  },
  message: {
    fontSize: 15,
    color: '#5a5a70',
    textAlign: 'center',
  },
  button: {
    marginTop: 12,
    height: 52,
    paddingHorizontal: 32,
    borderRadius: 16,
    backgroundColor: '#6c3bff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

// Product decision: ask for notification permission right at launch. The id
// only reaches the backend after login (auth-context owns that half).
initPush();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SafeAreaProvider>
          <LocationProvider>
            <PostTaskProvider>
              <RootNavigator />
            </PostTaskProvider>
          </LocationProvider>
        </SafeAreaProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function RootNavigator() {
  const colorScheme = useColorScheme();
  const { isBootstrapping } = useAuth();

  // Refetch stale queries when the app returns to the foreground.
  useAppStateFocus();

  // Hold the native splash until the persisted session has been read, so
  // `app/index.tsx` can redirect straight to the right route with no flash of
  // the wrong one.
  useEffect(() => {
    if (!isBootstrapping) {
      SplashScreen.hideAsync();
    }
  }, [isBootstrapping]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="index" options={{ headerShown: false }} />
                    <Stack.Screen name="splash" options={{ headerShown: false }} />
                    <Stack.Screen name="onboarding" options={{ headerShown: false }} />
                    <Stack.Screen name="purpose" options={{ headerShown: false }} />
                    <Stack.Screen name="login" options={{ headerShown: false }} />
                    <Stack.Screen name="create-account" options={{ headerShown: false }} />
                    <Stack.Screen name="tasker-details" options={{ headerShown: false }} />
                    <Stack.Screen name="country-selection" options={{ headerShown: false }} />
                    <Stack.Screen name="google-complete-signup" options={{ headerShown: false }} />
                    <Stack.Screen name="otp" options={{ headerShown: false }} />
                    <Stack.Screen name="purpose-selection" options={{ headerShown: false }} />
                    <Stack.Screen name="location-university" options={{ headerShown: false }} />
                    <Stack.Screen name="location-permission" options={{ headerShown: false }} />
                    <Stack.Screen name="location-confirm" options={{ headerShown: false }} />
                    <Stack.Screen name="location-map" options={{ headerShown: false }} />
                    <Stack.Screen name="success" options={{ headerShown: false }} />
                    <Stack.Screen name="login-form" options={{ headerShown: false }} />
                    <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
                    <Stack.Screen name="create-new-password" options={{ headerShown: false }} />
                    <Stack.Screen name="reset-success" options={{ headerShown: false }} />
                    <Stack.Screen name="task-agreement" options={{ headerShown: false }} />
                    <Stack.Screen name="edit-task" options={{ headerShown: false }} />
                    <Stack.Screen name="track-task" options={{ headerShown: false }} />
                    <Stack.Screen name="my-reviews" options={{ headerShown: false }} />
                    <Stack.Screen name="settings" options={{ headerShown: false }} />
                    <Stack.Screen name="change-password" options={{ headerShown: false }} />
                    <Stack.Screen name="change-password-success" options={{ headerShown: false }} />
                    <Stack.Screen name="saved-taskers" options={{ headerShown: false }} />
                    <Stack.Screen name="receipt" options={{ headerShown: false }} />
                    <Stack.Screen name="help-support" options={{ headerShown: false }} />
                    <Stack.Screen name="blocked-users" options={{ headerShown: false }} />
                    <Stack.Screen name="select-verification" options={{ headerShown: false }} />
                    <Stack.Screen name="nin-verification" options={{ headerShown: false }} />
                    <Stack.Screen name="phone-number" options={{ headerShown: false }} />
                    <Stack.Screen name="wallet" options={{ headerShown: false }} />
                    <Stack.Screen name="withdraw" options={{ headerShown: false }} />
                    <Stack.Screen name="transaction-history" options={{ headerShown: false }} />
                    <Stack.Screen name="performance" options={{ headerShown: false }} />
                    <Stack.Screen name="tasker-services" options={{ headerShown: false }} />
                    <Stack.Screen name="tasker-portfolio" options={{ headerShown: false }} />
                    <Stack.Screen name="bank-account" options={{ headerShown: false }} />
                    <Stack.Screen name="(main)" options={{ headerShown: false }} />
                    <Stack.Screen name="location-selector-modal" options={{ presentation: 'modal', headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
