import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CheckCircle } from '@/components/icons/check-circle';
import { MagnifyingGlass } from '@/components/icons/magnifying-glass';
import { PrimaryButton } from '@/components/taskhub/primary-button';
import { StepsHeader } from '@/components/taskhub/steps-header';

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  sunken: '#f2f2f7',
  brand: '#6c3bff',
  brandSubtle: '#f3eeff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  iconSecondary: '#78788c',
  placeholder: '#a0a0ba',
};

const SERVICES = [
  'Printing & Photocopy',
  'Assignment',
  'Project Binding',
  'Past Question',
  'Research Assistance',
  'Data Entry',
  'File Conversion',
  'Document Editing',
  'Spreadsheet Work',
];

export default function PostServiceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(['Printing & Photocopy', 'Assignment']);

  const toggle = (service: string) =>
    setSelected((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service],
    );

  const count = selected.length;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <StepsHeader step={2} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Select a service</Text>
          <Text style={styles.subtitle}>Choose a specific area you need</Text>
        </View>

        <View style={styles.search}>
          <MagnifyingGlass size={20} color={COLORS.iconSecondary} />
          <Text style={styles.searchText}>Search service...</Text>
        </View>

        <View style={styles.list}>
          {SERVICES.map((service) => {
            const active = selected.includes(service);
            return (
              <Pressable
                key={service}
                style={[styles.row, active && styles.rowActive]}
                onPress={() => toggle(service)}>
                <Text style={styles.rowText}>{service}</Text>
                {active && <CheckCircle size={22} color={COLORS.brand} />}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <PrimaryButton
          label={count > 0 ? `Continue with ${count} selected` : 'Continue'}
          disabled={count === 0}
          onPress={() => router.push('/post-details')}
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
  search: {
    backgroundColor: COLORS.sunken,
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  searchText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.placeholder,
  },
  list: {
    gap: 8,
  },
  row: {
    minHeight: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rowActive: {
    backgroundColor: COLORS.surface,
  },
  rowText: {
    flex: 1,
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.textPrimary,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
});
