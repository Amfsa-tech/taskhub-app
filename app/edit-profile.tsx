import { useMutation } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
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

import Camera from '@/assets/icons/camera.svg';
import { PrimaryButton } from '@/components/taskhub/primary-button';
import { ScreenHeader } from '@/components/taskhub/screen-header';
import { useLocation } from '@/context/LocationContext';
import { updateProfile, updateProfilePicture } from '@/lib/auth/auth-api';
import { useAuth } from '@/lib/auth/auth-context';
import type { UpdateProfilePayload } from '@/lib/auth/types';
import { pickImages, type PickedImage } from '@/lib/image-picker';

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
  onBrand: '#ffffff',
};

const BIO_MAX = 500;

/** `Elliot Eniola` -> `EE`. Falls back to the first letter of the email. */
function initialsOf(name: string, email: string): string {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]);
  return (letters.join('') || email[0] || '?').toUpperCase();
}

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { selectedLocation } = useLocation();
  const { user, refreshProfile } = useAuth();

  // Seeded from the live profile — never from placeholder copy.
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber ?? '');
  const [bio, setBio] = useState(typeof user?.bio === 'string' ? user.bio : '');
  const [address, setAddress] = useState(
    typeof user?.address === 'string' && user.address ? user.address : (selectedLocation ?? ''),
  );
  const [photo, setPhoto] = useState<PickedImage | null>(null);

  // The location modal writes to LocationContext, which is app-wide (the Home
  // header reads it too). Only adopt it into `address` once the user has
  // actually opened the picker from this screen — otherwise merely visiting
  // Edit Profile would silently overwrite a saved address with the Home value.
  const openedPicker = useRef(false);
  useEffect(() => {
    if (openedPicker.current && selectedLocation) {
      setAddress(selectedLocation);
    }
  }, [selectedLocation]);

  const openLocationPicker = () => {
    openedPicker.current = true;
    router.push('/location-selector-modal');
  };

  const choosePhoto = async () => {
    // Square crop; `edit` also makes iOS deliver JPEG rather than HEIC.
    const picked = await pickImages(1, { edit: true, aspect: [1, 1] });
    if (picked.length > 0) setPhoto(picked[0]);
  };

  const save = useMutation({
    mutationFn: async () => {
      // The picture has its own multipart endpoint, so it goes first and
      // separately from the JSON field update.
      if (photo) {
        await updateProfilePicture(photo);
      }

      // Send only what actually changed — the backend applies the keys present.
      const payload: UpdateProfilePayload = {};
      const nextName = fullName.trim();
      const nextPhone = phoneNumber.trim();
      const nextBio = bio.trim();
      const nextAddress = address.trim();

      if (nextName !== (user?.fullName ?? '')) payload.fullName = nextName;
      if (nextPhone !== (user?.phoneNumber ?? '')) payload.phoneNumber = nextPhone;
      if (nextBio !== (typeof user?.bio === 'string' ? user.bio : '')) payload.bio = nextBio;
      if (nextAddress !== (typeof user?.address === 'string' ? user.address : '')) {
        payload.address = nextAddress;
      }

      if (Object.keys(payload).length > 0) {
        await updateProfile(payload);
      }
    },
    onSuccess: async () => {
      // Pull the canonical profile back so the Profile screen's name, avatar
      // and badges update immediately.
      await refreshProfile();
      router.back();
    },
    onError: (err: Error) => {
      Alert.alert('Could not save', err.message);
    },
  });

  const onSave = () => {
    if (!fullName.trim()) {
      Alert.alert('Name required', 'Please enter your full name.');
      return;
    }
    if (bio.length > BIO_MAX) {
      Alert.alert('Bio too long', `Please keep your bio under ${BIO_MAX} characters.`);
      return;
    }
    save.mutate();
  };

  const pending = save.isPending;
  const avatarUri = photo?.uri || (user?.profilePicture ? String(user.profilePicture) : '');
  const initials = initialsOf(fullName || (user?.fullName ?? ''), user?.emailAddress ?? '');

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScreenHeader
        title="Edit Profile"
        right={
          <Pressable hitSlop={8} onPress={onSave} disabled={pending}>
            <Text style={[styles.saveAction, pending && styles.saveActionDisabled]}>
              {pending ? 'Saving…' : 'Save'}
            </Text>
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
            <Pressable style={styles.avatarWrap} onPress={choosePhoto} disabled={pending}>
              <View style={styles.avatarCircle}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatar} contentFit="cover" />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarInitials}>{initials}</Text>
                  </View>
                )}
              </View>
              <View style={styles.cameraBadge}>
                <Camera width={18} height={18} />
              </View>
            </Pressable>
            <Text style={styles.changePhoto}>
              {photo ? 'New photo selected' : 'Tap to change photo'}
            </Text>
          </View>

          {/* Fields */}
          <View style={styles.fields}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Full name</Text>
              <View style={styles.input}>
                <TextInput
                  style={styles.inputText}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter your full name"
                  placeholderTextColor={COLORS.placeholder}
                  autoCorrect={false}
                  editable={!pending}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Phone number</Text>
              <View style={styles.input}>
                <TextInput
                  style={styles.inputText}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="+234 800 000 0000"
                  placeholderTextColor={COLORS.placeholder}
                  keyboardType="phone-pad"
                  autoCorrect={false}
                  editable={!pending}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Location</Text>
              <Pressable style={styles.input} onPress={openLocationPicker} disabled={pending}>
                <Text
                  style={[
                    styles.inputText,
                    { color: address ? COLORS.textPrimary : COLORS.placeholder },
                  ]}
                  numberOfLines={1}>
                  {address || 'Enter your location'}
                </Text>
              </Pressable>
            </View>

            {/* Bio */}
            <View style={styles.field}>
              <View style={styles.bioLabelRow}>
                <Text style={styles.fieldLabel}>BIO</Text>
                <Text style={styles.bioCount}>
                  {bio.length}/{BIO_MAX}
                </Text>
              </View>
              <View style={[styles.input, styles.textArea]}>
                <TextInput
                  style={[styles.inputText, styles.textAreaInput]}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Tell others a bit about yourself..."
                  placeholderTextColor={COLORS.placeholder}
                  maxLength={BIO_MAX}
                  multiline
                  textAlignVertical="top"
                  editable={!pending}
                />
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <PrimaryButton
            label={pending ? 'Saving…' : 'Save changes'}
            onPress={onSave}
            disabled={pending}
          />
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
  saveActionDisabled: { opacity: 0.5 },
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
  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 28,
    letterSpacing: -0.45,
    color: COLORS.onBrand,
  },
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
  bioLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bioCount: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    letterSpacing: -0.08,
    color: COLORS.textSecondary,
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
