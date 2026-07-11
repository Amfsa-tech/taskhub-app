import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ScreenHeader } from '@/components/taskhub/screen-header';

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  brand: '#6c3bff',
  brandLight: '#f3eeff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  border: '#e2e2ec',
  danger: '#ef4444',
  dangerLight: '#fff5f5',
  success: '#15803d',
  successLight: '#f0fdf4',
  greyLight: '#f2f2f7',
  greyDark: '#78788c',
};

type Session = {
  id: string;
  name: string;
  location: string;
  time: string;
  isCurrent: boolean;
  type: 'mobile' | 'desktop';
};

const INITIAL_SESSIONS: Session[] = [
  {
    id: '1',
    name: 'Iphone 14 Pro',
    location: 'Ibadan, Nigeria',
    time: 'Now',
    isCurrent: true,
    type: 'mobile',
  },
  {
    id: '2',
    name: 'Chrome on Mac',
    location: 'Lagos, Nigeria',
    time: '2 hours ago',
    isCurrent: false,
    type: 'desktop',
  },
  {
    id: '3',
    name: 'Samsung Galaxy S22',
    location: 'Abuja, Nigeria',
    time: '3 days ago',
    isCurrent: false,
    type: 'mobile',
  },
];

export default function DeviceSessionsScreen() {
  const insets = useSafeAreaInsets();
  
  const [sessions, setSessions] = useState<Session[]>(INITIAL_SESSIONS);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [password, setPassword] = useState('');

  const handleLogoutSession = (session: Session) => {
    Alert.alert(
      'Log Out Device',
      `Are you sure you want to log out of ${session.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            setSessions((prev) => prev.filter((s) => s.id !== session.id));
            Alert.alert('Success', `Logged out of ${session.name}.`);
          },
        },
      ]
    );
  };

  const handleLogOutAll = () => {
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password to confirm.');
      return;
    }
    // Perform log out all
    setSessions((prev) => prev.filter((s) => s.isCurrent));
    setPasswordModalVisible(false);
    setPassword('');
    Alert.alert('Success', 'Successfully logged out of all other devices.');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScreenHeader title="Device Sessions" />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}>
        
        {/* Sessions list */}
        <View style={styles.card}>
          {sessions.map((session, index) => (
            <View key={session.id}>
              {index > 0 && <View style={styles.divider} />}
              <View style={styles.sessionRow}>
                {/* Left Device Icon */}
                <View style={[styles.iconContainer, session.isCurrent && styles.activeIconContainer]}>
                  <Ionicons
                    name={session.type === 'desktop' ? 'laptop-outline' : 'phone-portrait-outline'}
                    size={20}
                    color={session.isCurrent ? COLORS.brand : COLORS.textPrimary}
                  />
                </View>

                {/* Center Content */}
                <View style={styles.details}>
                  <View style={styles.titleRow}>
                    <Text style={styles.deviceName}>{session.name}</Text>
                    {session.isCurrent && (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>This Device</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.metaText}>
                    {session.location}  •  {session.time}
                  </Text>
                </View>

                {/* Right Action */}
                {!session.isCurrent && (
                  <Pressable
                    style={({ pressed }) => [styles.logoutBtn, pressed && styles.pressed]}
                    onPress={() => handleLogoutSession(session)}>
                    <Text style={styles.logoutBtnText}>Log out</Text>
                  </Pressable>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Log Out All Devices Button */}
        {sessions.length > 1 && (
          <Pressable
            style={({ pressed }) => [styles.logoutAllBtn, pressed && styles.pressed]}
            onPress={() => setPasswordModalVisible(true)}>
            <Text style={styles.logoutAllBtnText}>Log Out All Devices</Text>
          </Pressable>
        )}

      </ScrollView>

      {/* Confirm Password Modal */}
      <Modal
        visible={passwordModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPasswordModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 24 }]}>
            
            <Text style={styles.modalTitle}>Confirm Password</Text>
            <Text style={styles.modalSubtitle}>
              Enter your password to logout all other devices;
            </Text>

            <TextInput
              style={styles.passwordInput}
              placeholder="Your password"
              placeholderTextColor="#a0a0ba"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <View style={styles.modalButtons}>
              <Pressable
                style={styles.confirmBtn}
                onPress={handleLogOutAll}>
                <Text style={styles.confirmBtnText}>Log Out All Devices</Text>
              </Pressable>

              <Pressable
                style={styles.cancelBtn}
                onPress={() => {
                  setPasswordModalVisible(false);
                  setPassword('');
                }}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
            </View>

          </View>
        </View>
      </Modal>
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 20,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: COLORS.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconContainer: {
    backgroundColor: COLORS.brandLight,
  },
  details: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deviceName: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  currentBadge: {
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  currentBadgeText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 11,
    color: COLORS.success,
  },
  metaText: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  logoutBtn: {
    backgroundColor: COLORS.dangerLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoutBtnText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 13,
    color: COLORS.danger,
  },
  logoutAllBtn: {
    backgroundColor: COLORS.dangerLight,
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  logoutAllBtnText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    color: COLORS.danger,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  pressed: {
    opacity: 0.7,
  },

  // Modal styling
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 17, 34, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 32,
    gap: 16,
  },
  modalTitle: {
    fontFamily: 'Geist_700Bold',
    fontSize: 24,
    color: COLORS.textPrimary,
  },
  modalSubtitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    height: 48,
    paddingHorizontal: 16,
    fontFamily: 'Geist_500Medium',
    fontSize: 16,
    color: COLORS.textPrimary,
    marginTop: 8,
  },
  modalButtons: {
    gap: 12,
    marginTop: 8,
  },
  confirmBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 16,
    color: '#ffffff',
  },
  cancelBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.greyLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 16,
    color: COLORS.greyDark,
  },
});
