import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import PencilLine from '@/assets/icons/pencil-line.svg';
import { PrimaryButton } from '@/components/taskhub/primary-button';
import { ScreenHeader } from '@/components/taskhub/screen-header';

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
};

const DETAILS = [
  { label: 'Category', value: 'Local Service' },
  { label: 'Location', value: 'UI, Ibadan' },
  { label: 'Suggested Budget', value: '₦4,000', emphasized: true },
  { label: 'Service', value: 'Plumber' },
];

export default function ReviewTaskScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Review Task" />

      <View style={styles.body}>
        <Text style={styles.title}>Need a plumber in Yaba</Text>

        <View style={styles.summary}>
          {DETAILS.map((d) => (
            <View key={d.label} style={styles.row}>
              <Text style={styles.rowLabel}>{d.label}</Text>
              <Text style={[styles.rowValue, d.emphasized && styles.rowValueEmphasized]}>
                {d.value}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <PrimaryButton label="Post Task Now" onPress={() => router.push('/post-success')} />
        <PrimaryButton
          label="Edit Details"
          variant="secondary"
          leftIcon={<PencilLine width={18} height={18} />}
          onPress={() => router.back()}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 28,
    gap: 16,
  },
  title: {
    fontFamily: 'Geist_700Bold',
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.26,
    color: COLORS.textPrimary,
  },
  summary: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  rowLabel: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.24,
    color: COLORS.textSecondary,
  },
  rowValue: {
    flex: 1,
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.textPrimary,
    textAlign: 'right',
  },
  rowValueEmphasized: {
    fontFamily: 'Geist_600SemiBold',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 14,
  },
});
