import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/taskhub/screen-header';

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  border: '#e2e2ec',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  brand: '#6c3bff',
};

export default function SelectVerificationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const methods = [
    { label: 'NIN Verification', route: '/nin-verification' },
    { label: 'International Passport', route: null },
    { label: 'Drivers License', route: null },
    { label: 'NIN Slip Verification', route: null },
  ];

  const handlePress = (method: typeof methods[0]) => {
    if (method.route) {
      router.push(method.route as any);
    } else {
      Alert.alert('Coming Soon', `${method.label} is currently not available in this demo.`);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Select Verification" />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}>
        
        <Text style={styles.sectionHeader}>SELECT A VERIFICATION METHOD</Text>

        <View style={styles.groupCard}>
          {methods.map((method, index) => (
            <View key={method.label}>
              {index > 0 && <View style={styles.divider} />}
              <Pressable
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                onPress={() => handlePress(method)}>
                <Text style={styles.rowLabel}>{method.label}</Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
              </Pressable>
            </View>
          ))}
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
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionHeader: {
    fontFamily: 'Geist_700Bold',
    fontSize: 11,
    letterSpacing: 0.8,
    color: COLORS.textSecondary,
    marginBottom: 8,
    paddingHorizontal: 4,
    textTransform: 'uppercase',
  },
  groupCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  rowPressed: {
    backgroundColor: '#f2f2f7',
  },
  rowLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
    marginLeft: 16,
  },
});
