import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/taskhub/primary-button';
import { useLocation } from '@/context/LocationContext';
import { updateProfile } from '@/lib/auth/auth-api';
import { useAuth } from '@/lib/auth/auth-context';

export default function LocationPermissionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { onboarding } = useLocalSearchParams<{ onboarding?: string }>();
  const { user, refreshProfile } = useAuth();
  const { setSelectedLocation } = useLocation();
  const [address, setAddress] = useState(typeof user?.address === 'string' ? user.address : '');
  const [city, setCity] = useState(typeof user?.city === 'string' ? user.city : '');
  const [state, setState] = useState(typeof user?.residentState === 'string' ? user.residentState : '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!address.trim() || !city.trim() || !state.trim()) {
      Alert.alert('Location needed', 'Enter your address, city and state to continue.');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ address: address.trim(), city: city.trim(), residentState: state.trim() });
      await refreshProfile();
      await setSelectedLocation([city.trim(), state.trim()].join(', '));
      router.replace('/success');
    } catch (error) {
      Alert.alert('Could not save location', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.container, { paddingTop: insets.top }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Where are you based?</Text>
        <Text style={styles.subtitle}>Enter your location yourself. We use your city and state to show relevant tasks and taskers. You can edit these details later.</Text>
        <Text style={styles.label}>Address</Text>
        <TextInput style={styles.input} placeholder="Street, area or landmark" value={address} onChangeText={setAddress} autoComplete="street-address" />
        <Text style={styles.label}>City</Text>
        <TextInput style={styles.input} placeholder="Your city" value={city} onChangeText={setCity} autoCapitalize="words" />
        <Text style={styles.label}>State</Text>
        <TextInput style={styles.input} placeholder="Your state" value={state} onChangeText={setState} autoCapitalize="words" />
        <View style={styles.action}><PrimaryButton label={saving ? 'Saving...' : 'Continue'} disabled={saving} onPress={save} /></View>
        {onboarding !== 'tasker' ? <Text style={styles.note}>You can update your location in your profile at any time.</Text> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9fb' },
  content: { padding: 20, gap: 10, flexGrow: 1 },
  title: { fontFamily: 'Geist_700Bold', fontSize: 24, color: '#111122', marginTop: 24 },
  subtitle: { fontFamily: 'Geist_400Regular', fontSize: 16, lineHeight: 23, color: '#5a5a70', marginBottom: 18 },
  label: { fontFamily: 'Geist_500Medium', fontSize: 16, color: '#111122', marginTop: 10 },
  input: { minHeight: 50, backgroundColor: '#fff', borderColor: '#e0e0ea', borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, fontSize: 16, color: '#111122' },
  action: { marginTop: 28 },
  note: { color: '#5a5a70', textAlign: 'center', marginTop: 12 },
});
