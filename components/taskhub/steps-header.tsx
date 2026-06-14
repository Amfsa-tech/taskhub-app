import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ArrowLeft from '@/assets/icons/arrow-left.svg';

const COLORS = {
  surface: '#ffffff',
  brand: '#6c3bff',
  border: '#e0e0ea',
  textSecondary: '#5a5a70',
};

// Top "Steps" bar: back arrow + "Step X of N" + a continuous progress bar.
export function StepsHeader({ step, total = 4 }: { step: number; total?: number }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <View style={styles.row}>
        <Pressable style={styles.back} hitSlop={8} onPress={() => router.back()}>
          <ArrowLeft width={22} height={22} />
        </Pressable>
        <Text style={styles.stepLabel}>{`Step ${step} of ${total}`}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${(step / total) * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  back: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.textSecondary,
  },
  track: {
    height: 8,
    borderRadius: 9,
    backgroundColor: COLORS.border,
    overflow: 'hidden',
  },
  fill: {
    height: 8,
    borderRadius: 9,
    backgroundColor: COLORS.brand,
  },
});
