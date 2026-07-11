import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/components/taskhub/primary-button';

const PopperImage = require('@/assets/images/party_popper_3d.png');

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  sunken: '#f2f2f7',
  brand: '#6c3bff',
  brandStrong: '#4621c0',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  successBg: '#edfaf3',
  successText: '#0d6639',
  border: '#e0e0ea',
};

const TASKERS_DATA: Record<
  string,
  {
    name: string;
    rating: string;
    jobs: string;
    distance: string;
    avatar: any;
    message: string;
    delivery: string;
  }
> = {
  'Chioma. A': {
    name: 'Chioma. A',
    rating: '4.9',
    jobs: '127 Jobs',
    distance: '0.3km',
    avatar: require('@/assets/images/chats/chat-1.png'),
    message: "I can print and deliver within 30 minutes. I'm close to Zik Hall.",
    delivery: 'Zik Hall , UI',
  },
  'Tunde .O': {
    name: 'Tunde .O',
    rating: '4.9',
    jobs: '127 Jobs',
    distance: '0.3km',
    avatar: require('@/assets/images/chats/chat-2.jpg'),
    message: 'I have a fast laser printer and can deliver to any campus hall.',
    delivery: 'Mellanby Hall, UI',
  },
  'Hassan. A': {
    name: 'Hassan. A',
    rating: '4.9',
    jobs: '127 Jobs',
    distance: '0.3km',
    avatar: require('@/assets/images/chats/chat-3.jpg'),
    message: 'Will handle this right away. Sharp printing guaranteed.',
    delivery: 'Zik Hall , UI',
  },
};

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function TaskAgreementScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ taskerName: string; taskerPrice: string; step?: string }>();

  const selectedName = params.taskerName || 'Chioma. A';
  const tasker = TASKERS_DATA[selectedName] || TASKERS_DATA['Chioma. A'];
  const price = params.taskerPrice || '₦1,500';

  // Dynamic pricing calculation
  const amountNum = parseInt(price.replace(/[^0-9]/g, ''), 10) || 4000;
  const formattedAmount = `₦${amountNum.toLocaleString()}`;
  const platformFeeNum = Math.round(amountNum * 0.1);
  const formattedFee = `₦${platformFeeNum.toLocaleString()}`;
  const totalNum = amountNum + platformFeeNum;
  const formattedTotal = `₦${totalNum.toLocaleString()}`;

  const [step, setStep] = useState<'agreement' | 'confirmed' | 'payment' | 'processing' | 'payment-success' | 'hired'>(
    (params.step as any) || 'agreement'
  );

  useEffect(() => {
    let t: any;
    if (step === 'confirmed') {
      t = setTimeout(() => {
        setStep('payment');
      }, 2000);
    } else if (step === 'processing') {
      t = setTimeout(() => {
        setStep('payment-success');
      }, 2000);
    } else if (step === 'payment-success') {
      t = setTimeout(() => {
        setStep('hired');
      }, 1500);
    }
    return () => clearTimeout(t);
  }, [step]);

  // Render different views based on flow step
  if (step === 'confirmed') {
    return (
      <View style={styles.fullscreenCenter}>
        <StatusBar style="dark" />
        <View style={styles.scallopedBadge}>
          <Ionicons name="checkmark-sharp" size={64} color="#ffffff" />
        </View>
        <Text style={styles.confirmedTitle}>Agreement Confirmed</Text>
        <Text style={styles.confirmedSubtitle}>Proceeding to payment...</Text>
      </View>
    );
  }

  if (step === 'processing') {
    return (
      <View style={styles.fullscreenCenter}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#12b76a" />
        <Text style={styles.confirmedTitle}>Processing Payment</Text>
        <Text style={styles.confirmedSubtitle}>Please wait a moment</Text>
      </View>
    );
  }

  if (step === 'payment-success') {
    return (
      <View style={styles.fullscreenCenter}>
        <StatusBar style="dark" />
        <View style={styles.successCheckBadge}>
          <Ionicons name="checkmark-sharp" size={24} color="#ffffff" />
        </View>
        <Text style={styles.confirmedTitle}>Payment Successful</Text>
      </View>
    );
  }

  if (step === 'hired') {
    return (
      <View style={styles.fullscreenCenter}>
        <StatusBar style="dark" />
        <Image source={PopperImage} style={styles.popperImage} contentFit="contain" />
        <Text style={styles.confirmedTitle}>Tasker Hired Successfully</Text>
        <Text style={styles.hiredSubtitle}>
          Tasker has been hired and payment is securely held in escrow.
        </Text>
        <View style={styles.hiredButtons}>
          <PrimaryButton label="Track my Task" onPress={() => router.replace('/track-task')} />
          <Pressable
            style={({ pressed }) => [styles.myTasksButton, pressed && styles.pressed]}
            onPress={() => router.replace('/tasks')}>
            <Text style={styles.myTasksLabel}>Go To my Tasks</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (step === 'payment') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />

        {/* Payment Top Bar */}
        <View style={styles.topBar}>
          <Pressable hitSlop={8} onPress={() => setStep('agreement')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Payment</Text>
          <Pressable hitSlop={8} style={styles.backButton}>
            <Ionicons name="headset-outline" size={24} color={COLORS.textPrimary} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Payment Summary Card */}
          <View style={styles.card}>
            <SectionHeader title="Payment Summary" />
            <View style={styles.cardBody}>
              <DetailRow label="Task" value="Printing & Photocopying, Assignment" />
              <DetailRow label="Tasker" value={selectedName} />
              <DetailRow label="Task Amount" value={formattedAmount} />
              <DetailRow label="Platform Fee" value={formattedFee} />
              <View style={styles.divider} />
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Total</Text>
                <Text style={styles.priceValue}>{formattedTotal}</Text>
              </View>
            </View>
            {/* Escrow Protected Banner */}
            <View style={styles.escrowBanner}>
              <Ionicons name="shield-checkmark" size={20} color="#0d6639" />
              <Text style={styles.escrowText}>
                Escrow Protected — your payment is only released when the task is complete.
              </Text>
            </View>
          </View>

          {/* Choose Payment Method */}
          <Text style={styles.sectionTitle}>Choose Payment Method</Text>
          <View style={styles.walletRow}>
            <View style={styles.walletIconWrap}>
              <Ionicons name="wallet-outline" size={20} color={COLORS.brand} />
            </View>
            <View style={styles.walletInfo}>
              <Text style={styles.walletLabel}>Wallet</Text>
              <Text style={styles.walletBalance}>₦15,000</Text>
            </View>
            <View style={styles.radioOutline}>
              <View style={styles.radioDot} />
            </View>
          </View>
        </ScrollView>

        <View style={[styles.bottomPayBar, { paddingBottom: insets.bottom + 16 }]}>
          <PrimaryButton label={`Pay ${formattedTotal} from wallet`} onPress={() => setStep('processing')} />
        </View>
      </View>
    );
  }

  // Step 'agreement'
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <Pressable hitSlop={8} onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Confirm Task Agreement</Text>
        <View style={styles.placeholderButton} />
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Task Summary Card */}
        <View style={styles.card}>
          <SectionHeader title="TASK SUMMARY" />
          <View style={styles.cardBody}>
            <DetailRow label="Service" value="Printing & Photocopying, Assignment" />
            <DetailRow label="Location" value="UI, Ibadan" />
            <DetailRow label="Title" value="Someone to print and do my assignment" />
            <DetailRow label="Deadline" value="18th of May, 2026" />
          </View>
        </View>

        {/* Tasker Card */}
        <View style={styles.card}>
          <SectionHeader title="TASKER" />
          <View style={styles.taskerHeader}>
            <View style={styles.avatarWrap}>
              <Image source={tasker.avatar} style={styles.avatar} contentFit="cover" />
            </View>
            <View style={styles.taskerInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.taskerName}>{tasker.name}</Text>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-sharp" size={10} color={COLORS.successText} />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              </View>
              <View style={styles.statsRow}>
                <Ionicons name="star" size={14} color="#fbbf24" style={styles.starIcon} />
                <Text style={styles.statsText}>{tasker.rating}</Text>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.statsText}>{tasker.jobs}</Text>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.statsText}>{tasker.distance}</Text>
              </View>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Bid Price</Text>
            <Text style={styles.priceValue}>{price}</Text>
          </View>
        </View>

        {/* Final Details Card */}
        <View style={styles.card}>
          <SectionHeader title="FINAL DETAILS" />
          <View style={styles.cardBody}>
            <DetailRow label="Delivery" value={tasker.delivery} />
            <DetailRow label="Deadline" value="UI, Ibadan" />
            <DetailRow label="Details" value={tasker.message} />
          </View>
          <View style={styles.divider} />
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Final Agreed Price</Text>
            <Text style={styles.priceValue}>{price}</Text>
          </View>
        </View>

        {/* Warning Banner */}
        <View style={styles.warningBanner}>
          <Ionicons name="warning" size={20} color="#d97706" style={styles.warningIcon} />
          <Text style={styles.warningText}>
            Only continue when both sides understand the task clearly. Payment is held in escrow
            until the task is complete.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <PrimaryButton label="Send Agreement to Tasker" onPress={() => setStep('confirmed')} />

          <Pressable
            style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
            onPress={() => Alert.alert('Edit', 'Edit Details functionality.')}>
            <Ionicons name="pencil" size={16} color={COLORS.brand} />
            <Text style={styles.editLabel}>Edit Details</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
            onPress={() => router.back()}>
            <Text style={styles.cancelLabel}>Cancel</Text>
          </Pressable>
        </View>
      </ScrollView>
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 16,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  sectionHeader: {
    fontFamily: 'Geist_700Bold',
    fontSize: 12,
    letterSpacing: 0.5,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  cardBody: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  rowLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    color: COLORS.textSecondary,
    width: 100,
  },
  rowValue: {
    flex: 1,
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    color: COLORS.textPrimary,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  priceValue: {
    fontFamily: 'Geist_700Bold',
    fontSize: 17,
    color: COLORS.brand,
  },
  // Tasker styles
  taskerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.sunken,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  taskerInfo: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskerName: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.successBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  verifiedText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 11,
    color: COLORS.successText,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starIcon: {
    marginRight: 2,
  },
  statsText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  bullet: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  // Warning Banner
  warningBanner: {
    flexDirection: 'row',
    backgroundColor: '#fffbeb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  warningIcon: {
    marginTop: 2,
  },
  warningText: {
    flex: 1,
    fontFamily: 'Geist_500Medium',
    fontSize: 14,
    lineHeight: 20,
    color: '#b45309',
  },
  // Action Buttons
  buttonContainer: {
    gap: 8,
    marginTop: 8,
  },
  editButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.sunken,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  editLabel: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
    color: COLORS.brand,
  },
  cancelButton: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelLabel: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
    color: COLORS.textSecondary,
  },
  pressed: {
    opacity: 0.9,
  },
  // Fullscreen loaders & success layouts
  fullscreenCenter: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  scallopedBadge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#12b76a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#12b76a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4,
  },
  confirmedTitle: {
    fontFamily: 'Geist_700Bold',
    fontSize: 24,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  confirmedSubtitle: {
    fontFamily: 'Geist_500Medium',
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  escrowBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#edfaf3',
    borderColor: '#d2f4e1',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  escrowText: {
    flex: 1,
    fontFamily: 'Geist_500Medium',
    fontSize: 14,
    lineHeight: 20,
    color: '#0d6639',
  },
  sectionTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
    color: COLORS.textPrimary,
    marginTop: 8,
    marginBottom: 4,
  },
  walletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: COLORS.brand,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  walletIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f3eeff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletInfo: {
    flex: 1,
    gap: 4,
  },
  walletLabel: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  walletBalance: {
    fontFamily: 'Geist_500Medium',
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  radioOutline: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.brand,
  },
  bottomPayBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  successCheckBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#12b76a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popperImage: {
    width: 120,
    height: 120,
    marginBottom: 8,
  },
  hiredSubtitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 22,
  },
  hiredButtons: {
    width: '100%',
    gap: 8,
    marginTop: 16,
  },
  myTasksButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.sunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  myTasksLabel: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 17,
    color: COLORS.brand,
  },
});
