import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/taskhub/screen-header';
import { ReferralActions } from '@/components/taskhub/referral-actions';
import { useMyReferrals } from '@/hooks/use-my-referrals';
import { useAuth } from '@/lib/auth/auth-context';

export default function ReferralsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isBootstrapping } = useAuth();
  const referral = useMyReferrals();
  const code = referral.data?.referralCode ?? user?.referralCode;
  const link = referral.data?.referralLink ?? user?.referralLink;

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScreenHeader title="Refer friends" onBack={() => router.replace('/profile')} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        {!user && !isBootstrapping ? <View style={styles.card}>
          <Text style={styles.body}>Sign in to see your referral link and counts.</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push('/login')}><Text style={styles.action}>Sign in</Text></Pressable>
        </View> : <>
          <View style={styles.card}>
            <Text style={styles.heading}>Invite friends to TaskHub</Text>
            <Text style={styles.body}>Share your link or code so friends can join as Users or Taskers.</Text>
            <Text style={styles.label}>Your referral code</Text>
            {code ? <Text selectable style={styles.code}>{code}</Text> : <View accessibilityLabel="Loading referral code" style={styles.skeleton} />}
            {link && <Text selectable style={styles.link}>{link}</Text>}
            <ReferralActions key={user?._id} link={link} message={referral.data?.shareMessage} />
          </View>

          {referral.isError && <View style={styles.card}>
            <Text accessibilityRole="alert" style={styles.error}>{referral.error.message}</Text>
            <Pressable accessibilityRole="button" disabled={referral.isFetching} onPress={() => void referral.refetch()}>
              <Text style={styles.action}>{referral.isFetching ? 'Loading…' : 'Try again'}</Text>
            </Pressable>
          </View>}

          {!referral.isError && <View style={styles.counts}>
            {[
              { label: 'Total referred', value: referral.data?.totalReferrals },
              { label: 'Users', value: referral.data?.userReferrals },
              { label: 'Taskers', value: referral.data?.taskerReferrals },
            ].map(({ label, value }) => <View key={label} style={styles.count}>
              {value == null ? <View accessibilityLabel={`Loading ${label.toLowerCase()}`} style={styles.skeleton} /> : <Text style={styles.number}>{value.toLocaleString()}</Text>}
              <Text style={styles.countLabel}>{label}</Text>
            </View>)}
          </View>}

          <View style={styles.card}>
            <Text style={styles.heading}>How it works</Text>
            <Text style={styles.body}>Send your invite using Share invite, or copy your link.</Text>
            <Text style={styles.body}>Your friend’s signup form will already contain your referral code.</Text>
            <Text style={styles.body}>Their new User or Tasker account will appear in your referral counts.</Text>
          </View>
        </>}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f9f9fb' },
  content: { padding: 16, gap: 16 },
  card: { padding: 20, gap: 12, backgroundColor: '#ffffff', borderColor: '#e0e0ea', borderWidth: 1, borderRadius: 16 },
  heading: { color: '#111122', fontSize: 17, fontWeight: '600' },
  body: { color: '#5a5a70', fontSize: 14, lineHeight: 21 },
  label: { color: '#5a5a70', fontSize: 13, marginTop: 8 },
  code: { color: '#6c3bff', fontSize: 28, fontWeight: '700', letterSpacing: 2 },
  link: { color: '#5a5a70', fontSize: 13, lineHeight: 20 },
  counts: { flexDirection: 'row', gap: 8 },
  count: { flex: 1, paddingHorizontal: 8, paddingVertical: 16, gap: 8, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e0e0ea', borderRadius: 16, alignItems: 'center' },
  number: { color: '#111122', fontSize: 23, fontWeight: '700' },
  countLabel: { color: '#5a5a70', fontSize: 12, textAlign: 'center' },
  skeleton: { backgroundColor: '#e8e8ee', height: 28, width: 72, borderRadius: 8 },
  action: { color: '#6c3bff', fontWeight: '600', fontSize: 14, paddingVertical: 8 },
  error: { color: '#b01515', fontSize: 14, lineHeight: 21 },
});
