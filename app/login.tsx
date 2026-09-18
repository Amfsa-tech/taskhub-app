import { LinearGradient } from 'expo-linear-gradient';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ArrowLeft } from '@/components/icons/arrow-left';
import { GoogleLogo } from '@/components/icons/google-logo';
import { Headset } from '@/components/icons/headset';
import { useAuth } from '@/lib/auth/auth-context';
import { isAppleSignInAvailable, setPendingAppleSignup } from '@/lib/auth/apple';
import { GoogleSignInUnavailableError, setPendingGoogleSignup } from '@/lib/auth/google';

const COLORS = {
  primary: '#6c3bff',
  surface: '#ffffff',
  border: '#e0e0ea',
  black: '#000000',
  white: '#ffffff',
  googleText: '#404040',
};

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type?: string }>();
  // Set by the purpose screen ("I want to Earn" → tasker). Defaults to user.
  const accountType = type === 'tasker' ? 'tasker' : 'user';
  const { signInWithApple, signInWithGoogle } = useAuth();
  const [googleBusy, setGoogleBusy] = useState(false);
  const [appleBusy, setAppleBusy] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    isAppleSignInAvailable().then(setAppleAvailable).catch(() => setAppleAvailable(false));
  }, []);

  const handleGoogle = async () => {
    if (googleBusy) return;
    setGoogleBusy(true);
    try {
      const outcome = await signInWithGoogle(accountType);
      if (outcome.kind === 'signed-in') {
        if (outcome.roleFallback) {
          Alert.alert('Role not created yet', `Your ${accountType} role is not set up, so Taskhub opened your ${outcome.accountType} role.`);
        }
        router.replace('/home');
      } else if (accountType === 'tasker') {
        setPendingGoogleSignup({ idToken: outcome.idToken, profile: outcome.profile });
        router.push({
          pathname: '/tasker-details' as any,
          params: { social: 'google', firstName: outcome.profile.givenName, lastName: outcome.profile.familyName, email: outcome.profile.email, country: 'Nigeria' },
        });
      } else {
        // No account yet — carry the verified token to the completion screen.
        setPendingGoogleSignup({ idToken: outcome.idToken, profile: outcome.profile });
        router.push('/google-complete-signup');
      }
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === 'SIGN_IN_CANCELLED' || code === '-5') {
        // User dismissed the Google chooser — no-op.
      } else if (err instanceof GoogleSignInUnavailableError) {
        Alert.alert('Development build required', err.message);
      } else {
        Alert.alert('Google sign-in failed', err instanceof Error ? err.message : 'Please try again.');
      }
    } finally {
      setGoogleBusy(false);
    }
  };

  const handleApple = async () => {
    if (appleBusy) return;
    setAppleBusy(true);
    try {
      const outcome = await signInWithApple(accountType);
      if (outcome.kind === 'signed-in') {
        if (outcome.roleFallback) {
          Alert.alert('Role not created yet', `Your ${accountType} role is not set up, so Taskhub opened your ${outcome.accountType} role.`);
        }
        router.replace('/home');
      } else if (accountType === 'tasker') {
        setPendingAppleSignup({ signupToken: outcome.signupToken, profile: outcome.profile });
        router.push({
          pathname: '/tasker-details' as any,
          params: { social: 'apple', firstName: outcome.profile.givenName, lastName: outcome.profile.familyName, email: outcome.profile.email, country: 'Nigeria' },
        });
      } else {
        setPendingAppleSignup({ signupToken: outcome.signupToken, profile: outcome.profile });
        router.push('/google-complete-signup');
      }
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Apple sign-in failed', err instanceof Error ? err.message : 'Please try again.');
      }
    } finally {
      setAppleBusy(false);
    }
  };

  return (
    <ImageBackground
      source={require('@/assets/images/login-bg.jpg')}
      resizeMode="cover"
      style={styles.container}>
      <StatusBar style="light" />

      {/* Bottom purple wash that fades up into the photo */}
      <LinearGradient
        colors={['transparent', 'rgba(108, 59, 255, 0.15)', 'rgba(108, 59, 255, 0.5)']}
        locations={[0, 0.5, 1]}
        style={styles.overlay}
        pointerEvents="none"
      />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.tabButton} hitSlop={8} onPress={() => router.back()}>
          <ArrowLeft size={18} color={COLORS.white} />
          <Text style={styles.tabLabel}>Back</Text>
        </Pressable>
        <Pressable style={styles.tabButton} hitSlop={8} onPress={() => router.push('/help-support')}>
          <Headset size={18} color={COLORS.white} />
        </Pressable>
      </View>

      {/* Bottom content */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 16 }]}>
        <Text style={styles.title}>Sign up or Log in</Text>

        <View style={styles.buttons}>
          <Pressable
            style={({ pressed }) => [styles.button, styles.emailButton, pressed && styles.pressed]}
            onPress={() => router.push({ pathname: '/create-account', params: { type: accountType } })}>
            <Text style={styles.emailLabel}>Continue with Email</Text>
          </Pressable>

          {appleAvailable ? (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={12}
              style={styles.appleButton}
              onPress={handleApple}
              accessibilityLabel={appleBusy ? 'Signing in with Apple' : 'Continue with Apple'}
            />
          ) : null}

          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.googleButton,
              pressed && styles.pressed,
              googleBusy && styles.pressed,
            ]}
            onPress={handleGoogle}
            disabled={googleBusy}>
            {googleBusy ? (
              <ActivityIndicator color={COLORS.googleText} />
            ) : (
              <>
                <GoogleLogo size={20} />
                <Text style={styles.googleLabel}>Continue with Google</Text>
              </>
            )}
          </Pressable>

        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  appleButton: { width: '100%', height: 48 },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  tabLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.white,
  },
  bottom: {
    marginTop: 'auto',
    paddingHorizontal: 16,
  },
  title: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 24,
    lineHeight: 30.5,
    letterSpacing: -0.26,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 16,
  },
  buttons: {
    gap: 8,
  },
  button: {
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  pressed: {
    opacity: 0.9,
  },
  emailButton: {
    backgroundColor: COLORS.primary,
  },
  emailLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.white,
  },
  googleButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  googleLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.googleText,
  },
});
