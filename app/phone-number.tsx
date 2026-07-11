import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/taskhub/screen-header';

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  border: '#e2e2ec',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  brand: '#6c3bff',
  successGreenBg: '#edfaf3',
  successGreenIcon: '#0d6639',
  placeholder: '#a0a0ba',
};

export default function PhoneNumberScreen() {
  const insets = useSafeAreaInsets();
  const [phoneNumber, setPhoneNumber] = useState('+234 8108294447');
  const [newNumber, setNewNumber] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpdateNumber = () => {
    if (!newNumber.trim()) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setPhoneNumber(newNumber);
      setNewNumber('');
      setIsEditing(false);
      Alert.alert('Success', 'Phone number updated successfully.');
    }, 1500);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="dark" />
      <ScreenHeader title="Phone Number" />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        
        {/* Current Phone Number Card */}
        <View style={styles.card}>
          <View style={styles.phoneIconBox}>
            <Ionicons name="phone-portrait" size={22} color={COLORS.successGreenIcon} />
          </View>
          <View style={styles.phoneDetails}>
            <Text style={styles.currentLabel}>Current number</Text>
            <Text style={styles.currentValue}>{phoneNumber}</Text>
          </View>
        </View>

        {isEditing ? (
          <View style={styles.editSection}>
            <Text style={styles.sectionHeader}>Enter New Phone Number</Text>
            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>NEW PHONE NUMBER</Text>
              <TextInput
                style={styles.input}
                value={newNumber}
                onChangeText={setNewNumber}
                placeholder="e.g. +234 812 345 6789"
                placeholderTextColor={COLORS.placeholder}
                keyboardType="phone-pad"
                editable={!loading}
              />
            </View>

            <View style={styles.btnRow}>
              <Pressable
                style={[styles.btn, styles.cancelBtn]}
                disabled={loading}
                onPress={() => {
                  setIsEditing(false);
                  setNewNumber('');
                }}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[styles.btn, styles.saveBtn, !newNumber.trim() && styles.btnDisabled]}
                disabled={!newNumber.trim() || loading}
                onPress={handleUpdateNumber}>
                {loading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Verify & Save</Text>
                )}
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
            onPress={() => setIsEditing(true)}>
            <Text style={styles.actionBtnText}>Change Phone Number</Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
    gap: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  phoneIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.successGreenBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneDetails: {
    flex: 1,
    gap: 4,
  },
  currentLabel: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  currentValue: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  editSection: {
    gap: 16,
  },
  sectionHeader: {
    fontFamily: 'Geist_700Bold',
    fontSize: 11,
    letterSpacing: 0.8,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    paddingHorizontal: 4,
  },
  inputCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  inputLabel: {
    fontFamily: 'Geist_700Bold',
    fontSize: 11,
    letterSpacing: 0.8,
    color: COLORS.textSecondary,
  },
  input: {
    fontFamily: 'Geist_500Medium',
    fontSize: 16,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: COLORS.canvas,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelBtnText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  saveBtn: {
    backgroundColor: COLORS.brand,
  },
  saveBtnText: {
    fontFamily: 'Geist_700Bold',
    fontSize: 15,
    color: '#ffffff',
  },
  btnDisabled: {
    backgroundColor: '#cbcbda',
  },
  actionBtn: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnPressed: {
    backgroundColor: '#f2f2f7',
  },
  actionBtnText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    color: COLORS.brand,
  },
});
