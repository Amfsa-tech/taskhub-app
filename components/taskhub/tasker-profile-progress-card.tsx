import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import CaretRight from '@/assets/icons/caret-right.svg';
import type { getTaskerProfileProgress } from '@/lib/tasker-profile-progress';

const circumference = 2 * Math.PI * 22;
const destinations = {
  photo: '/edit-profile', services: '/tasker-services', portfolio: '/tasker-portfolio',
  verification: '/select-verification', profile: '/edit-profile',
} as const;

export function TaskerProfileProgressCard({ progress, style }: { progress: ReturnType<typeof getTaskerProfileProgress>; style?: StyleProp<ViewStyle> }) {
  const router = useRouter();
  if (progress.score === 100) return null;
  const destination = destinations[progress.next.step as keyof typeof destinations];
  return <Pressable accessibilityRole="button" accessibilityLabel={`Complete Verification & Profile. ${progress.score}%. ${progress.next.label}`}
    style={[styles.card, style]} onPress={() => router.push(destination)}>
    <View style={styles.ring} accessibilityRole="progressbar" accessibilityLabel="Profile completion"
      accessibilityValue={{ min: 0, max: 100, now: progress.score, text: `${progress.score}%` }}>
      <Svg width={51} height={51} viewBox="0 0 51 51" style={StyleSheet.absoluteFill}>
        <Circle cx={25.5} cy={25.5} r={22} stroke="#e4d6ff" strokeWidth={6} fill="none" />
        <Circle cx={25.5} cy={25.5} r={22} stroke="#6c3bff" strokeWidth={6} fill="none"
          strokeDasharray={[circumference, circumference]} strokeDashoffset={circumference * (1 - progress.score / 100)}
          rotation={-90} origin="25.5,25.5" />
      </Svg>
      <Text style={styles.percent}>{progress.score}%</Text>
    </View>
    <View style={styles.copy}>
      <Text style={styles.title}>Complete Verification & Profile</Text>
      <Text style={styles.subtitle}>{progress.next.label}</Text>
    </View>
    <CaretRight width={9} height={12} color="#6c3bff" />
  </Pressable>;
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#f3eeff', borderWidth: 1, borderColor: '#e4d6ff', borderRadius: 16, padding: 16 },
  ring: { width: 51, height: 51, alignItems: 'center', justifyContent: 'center' },
  percent: { fontFamily: 'Geist_500Medium', fontSize: 12, color: '#6c3bff' },
  copy: { flex: 1, gap: 4 },
  title: { fontFamily: 'Geist_600SemiBold', fontSize: 15, color: '#111122' },
  subtitle: { fontFamily: 'Geist_500Medium', fontSize: 13, color: '#6c3bff' },
});
