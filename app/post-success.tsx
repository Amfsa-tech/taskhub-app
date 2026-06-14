import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ArrowRightThin from '@/assets/icons/arrow-right-thin.svg';
import Eye from '@/assets/icons/eye.svg';
import HouseGrey from '@/assets/icons/house-grey.svg';
import SuccessCheck from '@/assets/icons/success-check.svg';
import { PrimaryButton } from '@/components/taskhub/primary-button';

const COLORS = {
  canvas: '#f9f9fb',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
};

export default function PostSuccessScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}>
      <StatusBar style="dark" />

      <View style={styles.message}>
        <SuccessCheck width={103} height={103} />
        <View style={styles.confirmation}>
          <View style={styles.textBlock}>
            <Text style={styles.title}>Your task is live</Text>
            <Text style={styles.subtitle}>
              We found taskers who may be a great fit. You&apos;ll start receiving bids shortly.
            </Text>
          </View>

          <View style={styles.buttons}>
            <PrimaryButton
              label="View Matches"
              rightIcon={<Eye width={18} height={18} />}
              onPress={() => router.replace('/home')}
            />
            <PrimaryButton
              label="Go To my Tasks"
              variant="secondary"
              rightIcon={<ArrowRightThin width={18} height={18} />}
              onPress={() => router.replace('/home')}
            />
          </View>

          <Pressable style={styles.backHome} onPress={() => router.replace('/home')}>
            <HouseGrey width={18} height={18} />
            <Text style={styles.backHomeText}>Back to Home</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.canvas,
    paddingHorizontal: 16,
  },
  message: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  confirmation: {
    alignItems: 'center',
    gap: 24,
    width: '100%',
  },
  textBlock: {
    alignItems: 'center',
    gap: 6,
    width: 304,
  },
  title: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 24,
    lineHeight: 30.5,
    letterSpacing: -0.26,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.41,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  buttons: {
    width: '100%',
    gap: 8,
  },
  backHome: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  backHomeText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.textSecondary,
  },
});
