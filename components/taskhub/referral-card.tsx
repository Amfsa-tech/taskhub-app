import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useMyReferrals } from '@/hooks/use-my-referrals';
import { useAuth } from '@/lib/auth/auth-context';
import { ReferralActions } from './referral-actions';

export function ReferralCard() {
  const router = useRouter();
  const { user } = useAuth();
  const referral = useMyReferrals();
  const code = referral.data?.referralCode ?? user?.referralCode;
  const link = referral.data?.referralLink ?? user?.referralLink;
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Invite friends</Text>
      <Text selectable style={styles.detail}>{code ? `Referral code ${code}` : 'Loading your referral code…'}</Text>
      {link && <Text selectable style={styles.detail}>{link}</Text>}
      <ReferralActions key={user?._id} link={link} message={referral.data?.shareMessage} />
      {referral.isError && <Pressable accessibilityRole="button" onPress={() => void referral.refetch()}>
        <Text style={styles.error}>Could not load your invite. Tap to retry.</Text>
      </Pressable>}
      <Pressable accessibilityRole="button" onPress={() => router.push('/referrals')}>
        <Text style={styles.action}>View my referrals</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#ffffff', borderColor: '#e0e0ea', borderWidth: 1, borderRadius: 16, padding: 16, gap: 8 },
  title: { color: '#111122', fontSize: 16, fontWeight: '600' },
  detail: { color: '#5a5a70', fontSize: 14 },
  action: { color: '#6c3bff', fontSize: 14, fontWeight: '600', paddingVertical: 8 },
  error: { color: '#b01515', fontSize: 13, paddingVertical: 8 },
});
