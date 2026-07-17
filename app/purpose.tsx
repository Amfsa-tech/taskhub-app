import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';

import { ArrowLeft } from '@/components/icons/arrow-left';
import { ArrowRight } from '@/components/icons/arrow-right';
import { Hammer } from '@/components/icons/hammer';
import { Headset } from '@/components/icons/headset';
import { SuitcaseSimple } from '@/components/icons/suitcase-simple';
import { useAuth } from '@/lib/auth/auth-context';
import { loginOrCreateDevAccount } from '@/lib/auth/dev-auth';

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  border: '#e0e0ea',
  borderSelected: '#6c3bff',
  primary: '#6c3bff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  iconSecondary: '#78788c',
  onBrand: '#ffffff',
  blue: '#1e88e5',
  green: '#4caf50',
};

type Role = 'hire' | 'earn' | 'dev';

type RoleCardProps = {
  selected: boolean;
  onPress: () => void;
  iconColor: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
};

function RoleCard({ selected, onPress, iconColor, icon, title, subtitle }: RoleCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, selected && styles.cardSelected]}>
      <View style={[styles.cardIcon, { backgroundColor: iconColor }]}>{icon}</View>
      <View style={styles.cardText}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

export default function PurposeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signIn } = useAuth();
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isExpoGo = Constants?.appOwnership === 'expo';

  const handleContinue = async () => {
    if (role === 'dev') {
      setIsLoading(true);
      try {
        await loginOrCreateDevAccount('user', signIn);
        router.replace('/home');
      } catch (err: any) {
        Alert.alert('Developer Login Failed', err.message || 'Something went wrong.');
      } finally {
        setIsLoading(false);
      }
    } else {
      router.push('/login');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable style={styles.tabButton} hitSlop={8} onPress={() => router.back()}>
          <ArrowLeft size={18} color={COLORS.textSecondary} />
          <Text style={styles.tabLabel}>Back</Text>
        </Pressable>
        <Pressable style={styles.tabButton} hitSlop={8} onPress={() => {}}>
          <Headset size={18} color={COLORS.textSecondary} />
          <Text style={styles.tabLabel}>Support</Text>
        </Pressable>
      </View>

      {/* Heading */}
      <View style={styles.heading}>
        <Text style={styles.title}>How do you want to use TaskHub?</Text>
        <Text style={styles.subtitle}>Your payment stays secure until the task is completed.</Text>
      </View>

      {/* Role cards */}
      <View style={styles.cards}>
        <RoleCard
          selected={role === 'hire'}
          onPress={() => setRole('hire')}
          iconColor={COLORS.blue}
          icon={<SuitcaseSimple size={24} color={COLORS.onBrand} />}
          title="I want to hire"
          subtitle="Post tasks and hire trusted taskers."
        />
        <RoleCard
          selected={role === 'earn'}
          onPress={() => setRole('earn')}
          iconColor={COLORS.green}
          icon={<Hammer size={24} color={COLORS.onBrand} />}
          title="I want to Earn"
          subtitle="Find task, bid and get paid"
        />
        {isExpoGo && (
          <RoleCard
            selected={role === 'dev'}
            onPress={() => setRole('dev')}
            iconColor={COLORS.primary}
            icon={<MaterialCommunityIcons name="developer-board" size={24} color={COLORS.onBrand} />}
            title="Developer Test"
            subtitle="Login straight to a customer test account."
          />
        )}
      </View>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
            isLoading && styles.buttonDisabled,
          ]}
          onPress={handleContinue}
          disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color={COLORS.onBrand} />
          ) : (
            <>
              <Text style={styles.buttonLabel}>Continue</Text>
              <ArrowRight size={18} color={COLORS.onBrand} />
            </>
          )}
        </Pressable>

        <Pressable hitSlop={8} onPress={() => router.push('/login-form')} style={styles.loginRow}>
          <Text style={styles.loginMuted}>
            Already have an account? <Text style={styles.loginLink}>Login</Text>
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 48,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  tabLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.textSecondary,
  },
  heading: {
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 6,
  },
  title: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 24,
    lineHeight: 30.5,
    letterSpacing: -0.26,
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    lineHeight: 21.9,
    letterSpacing: -0.41,
    color: COLORS.textSecondary,
  },
  cards: {
    paddingHorizontal: 16,
    marginTop: 40,
    gap: 16,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  cardSelected: {
    borderColor: COLORS.borderSelected,
    borderWidth: 1.5,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    gap: 4,
  },
  cardTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
    lineHeight: 21.9,
    letterSpacing: -0.41,
    color: COLORS.textPrimary,
  },
  cardSubtitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.24,
    color: COLORS.iconSecondary,
  },
  footer: {
    marginTop: 'auto',
    paddingHorizontal: 16,
    gap: 8,
  },
  button: {
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.onBrand,
  },
  loginRow: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginMuted: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.iconSecondary,
  },
  loginLink: {
    color: COLORS.primary,
  },
});
