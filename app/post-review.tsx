import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/taskhub/primary-button';
import { StepsHeader } from '@/components/taskhub/steps-header';

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
};

const SUMMARY: { label: string; value: string; emphasized?: boolean }[] = [
  { label: 'Service', value: 'Printing & Photocopy, Assignment' },
  { label: 'Location', value: 'UI, Ibadan' },
  { label: 'Budget', value: '₦4,000', emphasized: true },
  { label: 'Title', value: 'Printing & Photocopy, Assignment' },
];

export default function PostReviewScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <StepsHeader step={4} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Review & Post</Text>
          <Text style={styles.subtitle}>Make sure everything looks good.</Text>
        </View>

        <View style={styles.card}>
          {SUMMARY.map((row) => (
            <View key={row.label} style={styles.row}>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Text style={[styles.rowValue, row.emphasized && styles.rowValueEmphasized]}>
                {row.value}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.buttonWrap}>
          <PrimaryButton label="Post Task" onPress={() => router.replace('/post-success')} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 24,
  },
  header: {
    gap: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Geist_700Bold',
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.26,
    color: COLORS.textPrimary,
    width: '100%',
  },
  subtitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.24,
    color: COLORS.textSecondary,
    width: '100%',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  rowLabel: {
    fontFamily: 'Geist_400Regular',
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: -0.32,
    color: COLORS.textSecondary,
  },
  rowValue: {
    flex: 1,
    fontFamily: 'Geist_400Regular',
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: -0.32,
    color: COLORS.textPrimary,
    textAlign: 'right',
  },
  rowValueEmphasized: {
    fontFamily: 'Geist_600SemiBold',
  },
  buttonWrap: {
    marginTop: 40,
  },
});
