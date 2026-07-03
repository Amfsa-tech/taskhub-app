import { Image } from 'expo-image';
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

import Camera from '@/assets/icons/camera.svg';
import { PrimaryButton } from '@/components/taskhub/primary-button';
import { ScreenHeader } from '@/components/taskhub/screen-header';
import { useLocation } from '@/context/LocationContext';

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  border: '#e0e0ea',
  brand: '#6c3bff',
  brandStrong: '#4621c0',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  placeholder: '#a0a0ba',
  avatarBg: '#4621c0',
};

const AVATAR = require('@/assets/images/taskers/tasker-1.png');

type Field = {
  key: 'fullName' | 'phone' | 'location';
  label: string;
  placeholder: string;
  keyboardType?: 'default' | 'phone-pad';
};

const FIELDS: Field[] = [
  { key: 'fullName', label: 'Full name', placeholder: 'Enter your full name' },
  { key: 'phone', label: 'Phone number', placeholder: '+234 800 000 0000', keyboardType: 'phone-pad' },
  { key: 'location', label: 'Location', placeholder: 'Enter your location' },
];

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { selectedLocation } = useLocation();

  const [values, setValues] = useState({
    fullName: 'Elliot Eniola',
    phone: '+234 812 345 6789',
    bio: '',
  });

  const setField = (key: keyof typeof values) => (text: string) =>
    setValues((v) => ({ ...v, [key]: text }));

  const save = () => {
    // Persist when a backend exists; for now return to the profile.
    router.back();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScreenHeader
        title="Edit Profile"
        right={
          <Pressable hitSlop={8} onPress={save}>
            <Text style={styles.saveAction}>Save</Text>
          </Pressable>
        }
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <Pressable style={styles.avatarWrap} onPress={() => {}}>
              <View style={styles.avatarCircle}>
                <Image source={AVATAR} style={styles.avatar} contentFit="cover" />
              </View>
              <View style={styles.cameraBadge}>
                <Camera width={18} height={18} />
              </View>
            </Pressable>
            <Text style={styles.changePhoto}>Tap to change photo</Text>
          </View>

          {/* Fields */}
          <View style={styles.fields}>
            {FIELDS.map((field) => {
              if (field.key === 'location') {
                return (
                  <View key={field.key} style={styles.field}>
                    <Text style={styles.fieldLabel}>{field.label}</Text>
                    <Pressable 
                      style={styles.input} 
                      onPress={() => router.push('/location-selector-modal')}
                    >
                      <Text style={[styles.inputText, { color: selectedLocation ? COLORS.textPrimary : COLORS.placeholder }]}>
                        {selectedLocation || field.placeholder}
                      </Text>
                    </Pressable>
                  </View>
                );
              }

              return (
                <View key={field.key} style={styles.field}>
                  <Text style={styles.fieldLabel}>{field.label}</Text>
                  <View style={styles.input}>
                    <TextInput
                      style={styles.inputText}
                      value={values[field.key as keyof typeof values]}
                      onChangeText={setField(field.key as keyof typeof values)}
                      placeholder={field.placeholder}
                      placeholderTextColor={COLORS.placeholder}
                      keyboardType={field.keyboardType ?? 'default'}
                      autoCorrect={false}
                    />
                  </View>
                </View>
              );
            })}

            {/* Bio */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>BIO</Text>
              <View style={[styles.input, styles.textArea]}>
                <TextInput
                  style={[styles.inputText, styles.textAreaInput]}
                  value={values.bio}
                  onChangeText={setField('bio')}
                  placeholder="Tell others a bit about yourself..."
                  placeholderTextColor={COLORS.placeholder}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <PrimaryButton label="Save changes" onPress={save} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.canvas },
  flex: { flex: 1 },
  saveAction: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.brandStrong,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 24,
  },
  // Avatar
  avatarSection: {
    alignItems: 'center',
    gap: 8,
  },
  avatarWrap: {
    width: 78,
    height: 78,
  },
  avatarCircle: {
    width: 78,
    height: 78,
    borderRadius: 999,
    backgroundColor: COLORS.avatarBg,
    overflow: 'hidden',
  },
  avatar: { width: '100%', height: '100%' },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhoto: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.24,
    color: COLORS.textSecondary,
  },
  // Fields
  fields: {
    marginTop: 32,
    gap: 16,
  },
  field: { gap: 4 },
  fieldLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.textPrimary,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  inputText: {
    flex: 1,
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.41,
    color: COLORS.textPrimary,
    padding: 0,
  },
  textArea: {
    height: 125,
    alignItems: 'stretch',
    paddingVertical: 12,
  },
  textAreaInput: {
    height: '100%',
  },
  // Footer
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
});
