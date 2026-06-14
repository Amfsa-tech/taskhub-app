import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ListRenderItemInfo,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ArrowRight } from '@/components/icons/arrow-right';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// How long each slide stays before auto-advancing to the next.
const AUTO_ADVANCE_MS = 2000;

// Design tokens pulled directly from Figma variables
const COLORS = {
  canvas: '#f9f9fb',
  primary: '#6c3bff',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
  dotInactive: '#c8c8da',
  onBrand: '#ffffff',
};

type Slide = {
  key: string;
  title: string;
  subtitle: string;
  image: number;
  // Exact crop replicated from Figma (oversized render positioned inside a clip box)
  box: { width: number; height: number };
  img: { width: number; height: number; top: number; left: number };
  imageGap: number; // gap between the illustration and the dots/text group
};

const SLIDES: Slide[] = [
  {
    key: 'post',
    title: 'Post a task in seconds',
    subtitle: "Tell us what you need and we'll find the right tasker.",
    image: require('@/assets/images/onboarding/slide-1.png'),
    box: { width: 286, height: 344 },
    img: { width: 286, height: 512.6, top: -97.6, left: 0 },
    imageGap: 37,
  },
  {
    key: 'match',
    title: 'Get matched with trusted taskers',
    subtitle: 'Compare bids, chat, and choose who works for you.',
    image: require('@/assets/images/onboarding/slide-2.png'),
    box: { width: 272, height: 329 },
    img: { width: 353.8, height: 635, top: -156, left: -52.1 },
    imageGap: 48,
  },
  {
    key: 'pay',
    title: 'Pay safely with protection',
    subtitle: 'Your payment stays secure until the task is completed.',
    image: require('@/assets/images/onboarding/slide-3.png'),
    box: { width: 280, height: 290 },
    img: { width: 403.8, height: 725.5, top: -214.7, left: -70.4 },
    imageGap: 66,
  },
];

function Dots({ count, active }: { count: number; active: number }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={[styles.dot, i === active ? styles.dotActive : styles.dotInactive]} />
      ))}
    </View>
  );
}

function SlideView({ slide, index }: { slide: Slide; index: number }) {
  return (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <View style={[styles.imageClip, { width: slide.box.width, height: slide.box.height }]}>
        <Image
          source={slide.image}
          style={{
            position: 'absolute',
            width: slide.img.width,
            height: slide.img.height,
            top: slide.img.top,
            left: slide.img.left,
          }}
          contentFit="fill"
        />
      </View>

      <View style={{ height: slide.imageGap }} />

      <Dots count={SLIDES.length} active={index} />

      <View style={styles.textBlock}>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.subtitle}>{slide.subtitle}</Text>
      </View>
    </View>
  );
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);

  const finish = () => router.push('/purpose');

  const handleNext = () => {
    if (index < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    } else {
      finish();
    }
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (next !== index) setIndex(next);
  };

  // Auto-advance every slide after AUTO_ADVANCE_MS. The timer is keyed on the
  // current index, so a manual swipe resets it; the last slide finishes.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (index < SLIDES.length - 1) {
        listRef.current?.scrollToIndex({ index: index + 1, animated: true });
      } else {
        finish();
      }
    }, AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Skip */}
      <View style={styles.header}>
        <Pressable hitSlop={8} onPress={finish}>
          <Text style={styles.skip}>Skip</Text>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(s) => s.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        getItemLayout={(_, i) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * i, index: i })}
        renderItem={({ item, index: i }: ListRenderItemInfo<Slide>) => (
          <SlideView slide={item} index={i} />
        )}
      />

      {/* Primary button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={handleNext}>
          <Text style={styles.buttonLabel}>Let’s Get Started</Text>
          <ArrowRight size={18} color={COLORS.onBrand} />
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
  header: {
    height: 44,
    paddingHorizontal: 16,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  skip: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.textSecondary,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  imageClip: {
    overflow: 'hidden',
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 24,
  },
  dot: {
    height: 8,
    borderRadius: 999,
  },
  dotActive: {
    width: 14,
    backgroundColor: COLORS.primary,
  },
  dotInactive: {
    width: 8,
    backgroundColor: COLORS.dotInactive,
  },
  textBlock: {
    alignItems: 'center',
    gap: 6,
    width: '100%',
  },
  title: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 24,
    lineHeight: 30.5,
    letterSpacing: -0.26,
    textAlign: 'center',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    lineHeight: 21.9,
    letterSpacing: -0.41,
    textAlign: 'center',
    color: COLORS.textSecondary,
  },
  footer: {
    paddingHorizontal: 16,
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
  buttonLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    letterSpacing: -0.41,
    color: COLORS.onBrand,
  },
});
