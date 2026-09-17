import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/taskhub/screen-header';
import {
  getDeviceSessions,
  logoutOtherDevices,
  terminateDeviceSession,
  type DeviceSession,
} from '@/lib/auth/auth-api';

const COLORS = {
  canvas: '#f9f9fb', surface: '#ffffff', brand: '#6c3bff', text: '#111122',
  secondary: '#5a5a70', border: '#e0e0ea', success: '#0d6639', danger: '#b01515',
};

function formatSeen(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown' : date.toLocaleString();
}

export default function DeviceSessionsScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [password, setPassword] = useState('');
  const sessions = useQuery({
    queryKey: ['auth', 'sessions'],
    queryFn: ({ signal }) => getDeviceSessions(signal),
  });
  const terminate = useMutation({
    mutationFn: terminateDeviceSession,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['auth', 'sessions'] }),
    onError: (error) =>
      Alert.alert('Could not terminate session', error instanceof Error ? error.message : 'Please try again.'),
  });
  const terminateOthers = useMutation({
    mutationFn: () => logoutOtherDevices(password),
    onSuccess: (response) => {
      setPassword('');
      queryClient.invalidateQueries({ queryKey: ['auth', 'sessions'] });
      Alert.alert('Other devices signed out', response.message);
    },
    onError: (error) =>
      Alert.alert('Could not sign out devices', error instanceof Error ? error.message : 'Please try again.'),
  });

  const otherSessionCount = (sessions.data?.data ?? []).filter((item) => !item.isCurrentDevice).length;

  const renderItem = ({ item }: { item: DeviceSession }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.icon}><Ionicons name="phone-portrait-outline" size={20} color={COLORS.brand} /></View>
        <View style={styles.info}>
          <Text style={styles.title}>{item.deviceName || 'Unknown device'}</Text>
          <Text style={styles.meta}>{item.location || 'Unknown location'}{item.ipAddress ? ` · ${item.ipAddress}` : ''}</Text>
          <Text style={styles.meta}>Last active {formatSeen(item.lastActiveAt)}</Text>
          {item.isCurrentDevice ? <Text style={styles.current}>Current device</Text> : null}
        </View>
      </View>
      {!item.isCurrentDevice ? (
        <Pressable
          style={styles.terminate}
          disabled={terminate.isPending}
          onPress={() => Alert.alert('Terminate session?', `Sign out ${item.deviceName || 'this device'}?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Terminate', style: 'destructive', onPress: () => terminate.mutate(item._id) },
          ])}>
          <Text style={styles.terminateText}>Terminate session</Text>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Device Sessions" />
      <FlatList
        data={sessions.data?.data ?? []}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        refreshing={sessions.isFetching}
        onRefresh={() => sessions.refetch()}
        ListHeaderComponent={
          otherSessionCount > 0 ? (
            <View style={styles.logoutAllCard}>
              <Text style={styles.title}>Sign out all other devices</Text>
              <Text style={styles.meta}>Confirm your password to end {otherSessionCount} other active {otherSessionCount === 1 ? 'session' : 'sessions'}.</Text>
              <TextInput
                style={styles.passwordInput}
                placeholder="Account password"
                placeholderTextColor="#a0a0ba"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              <Pressable
                style={[styles.terminate, (!password || terminateOthers.isPending) && styles.disabled]}
                disabled={!password || terminateOthers.isPending}
                onPress={() => terminateOthers.mutate()}>
                <Text style={styles.terminateText}>{terminateOthers.isPending ? 'Signing out…' : 'Sign out other devices'}</Text>
              </Pressable>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.title}>{sessions.isError ? 'Could not load sessions' : sessions.isLoading ? 'Loading sessions…' : 'No active sessions'}</Text>
            {sessions.isError ? <Pressable onPress={() => sessions.refetch()}><Text style={styles.retry}>Retry</Text></Pressable> : null}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.canvas },
  content: { padding: 16, gap: 12, flexGrow: 1 },
  card: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, gap: 14, borderWidth: 1, borderColor: COLORS.border },
  row: { flexDirection: 'row', gap: 12 },
  icon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f3eeff', alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 4 },
  title: { fontFamily: 'Geist_600SemiBold', fontSize: 16, color: COLORS.text },
  meta: { fontFamily: 'Geist_400Regular', fontSize: 13, color: COLORS.secondary },
  current: { fontFamily: 'Geist_600SemiBold', fontSize: 13, color: COLORS.success },
  terminate: { minHeight: 44, borderRadius: 12, backgroundColor: '#fff1f1', alignItems: 'center', justifyContent: 'center' },
  terminateText: { fontFamily: 'Geist_600SemiBold', fontSize: 15, color: COLORS.danger },
  logoutAllCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, gap: 10, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12 },
  passwordInput: { height: 48, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 14, fontFamily: 'Geist_400Regular', fontSize: 15, color: COLORS.text },
  disabled: { opacity: 0.5 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  retry: { fontFamily: 'Geist_600SemiBold', fontSize: 15, color: COLORS.brand },
});
