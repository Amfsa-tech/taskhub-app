import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
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
import { PrimaryButton } from '@/components/taskhub/primary-button';

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  border: '#e0e0ea',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  placeholder: '#a0a0ba',
  brand: '#6c3bff',
};

type PasswordFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
};

function PasswordField({ label, placeholder, value, onChangeText }: PasswordFieldProps) {
  const [show, setShow] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.input}>
        <TextInput
          style={[styles.inputText, styles.flex]}
          placeholder={placeholder}
          placeholderTextColor={COLORS.placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!show}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable hitSlop={8} onPress={() => setShow((s) => !s)}>
          <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}

export default function ChangePasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSave = () => {
    // Navigate to success screen after password change
    router.replace('/change-password-success');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header bar */}
        <View style={styles.topBar}>
          <Pressable hitSlop={8} onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Change password</Text>
          <View style={styles.placeholderButton} />
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* Fields */}
          <View style={styles.fields}>
            <PasswordField
              label="Current Password"
              placeholder="********"
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
            <PasswordField
              label="New Password"
              placeholder="********"
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <PasswordField
              label="Confirm New Password"
              placeholder="********"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>
        </ScrollView>

        {/* Footer actions */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <PrimaryButton label="Save Changes" onPress={handleSave} />
        </View>
      </KeyboardAvoidingView>
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
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: COLORS.canvas,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 20,
    lineHeight: 25,
    letterSpacing: -0.45,
    color: COLORS.textPrimary,
  },
  placeholderButton: {
    width: 40,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  fields: {
    gap: 20,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 16,
    letterSpacing: -0.24,
    color: COLORS.textPrimary,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    gap: 10,
  },
  inputText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.textPrimary,
    padding: 0,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
});
