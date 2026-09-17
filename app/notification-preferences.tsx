import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/taskhub/screen-header';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
} from '@/lib/api/notifications';

const COLORS = { canvas: '#f9f9fb', surface: '#ffffff', brand: '#6c3bff', text: '#111122', secondary: '#5a5a70', border: '#e0e0ea' };
const LABELS: Record<keyof NotificationPreferences, { title: string; description: string }> = {
  emailNotifications: { title: 'Email notifications', description: 'Receive important updates by email.' },
  pushNotifications: { title: 'Push notifications', description: 'Receive alerts on this device.' },
  taskUpdates: { title: 'Task updates', description: 'Status and completion changes.' },
  messages: { title: 'Messages', description: 'New chat message alerts.' },
  bids: { title: 'Bids and offers', description: 'Applications, invitations, and bid decisions.' },
  paymentAlerts: { title: 'Payment alerts', description: 'Wallet, escrow, and payout updates.' },
  promotions: { title: 'Promotions', description: 'Product news and optional offers.' },
};

export default function NotificationPreferencesScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['notifications', 'preferences'], queryFn: ({ signal }) => getNotificationPreferences(signal) });
  const mutation = useMutation({
    mutationFn: updateNotificationPreferences,
    onSuccess: (response) => queryClient.setQueryData(['notifications', 'preferences'], response),
    onError: (error) => Alert.alert('Could not save preference', error instanceof Error ? error.message : 'Please try again.'),
  });
  const preferences = query.data?.data.notificationPreferences;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Notifications" />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        {query.isLoading ? <Text style={styles.state}>Loading preferences…</Text> : query.isError || !preferences ? (
          <Text style={styles.state}>Could not load notification preferences. Pull back and try again.</Text>
        ) : (
          <View style={styles.card}>
            {(Object.keys(LABELS) as (keyof NotificationPreferences)[]).map((key, index) => (
              <View key={key} style={[styles.row, index > 0 && styles.divider]}>
                <View style={styles.copy}>
                  <Text style={styles.title}>{LABELS[key].title}</Text>
                  <Text style={styles.description}>{LABELS[key].description}</Text>
                </View>
                <Switch
                  value={preferences[key]}
                  disabled={mutation.isPending}
                  trackColor={{ false: '#d8d8e2', true: '#c7b6ff' }}
                  thumbColor={preferences[key] ? COLORS.brand : '#ffffff'}
                  onValueChange={(value) => mutation.mutate({ [key]: value })}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.canvas },
  content: { padding: 16 },
  card: { backgroundColor: COLORS.surface, borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: COLORS.border },
  row: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 12 },
  divider: { borderTopWidth: 1, borderTopColor: COLORS.border },
  copy: { flex: 1, gap: 3 },
  title: { fontFamily: 'Geist_600SemiBold', fontSize: 15, color: COLORS.text },
  description: { fontFamily: 'Geist_400Regular', fontSize: 13, color: COLORS.secondary },
  state: { fontFamily: 'Geist_500Medium', fontSize: 15, color: COLORS.secondary, textAlign: 'center', paddingVertical: 48 },
});
