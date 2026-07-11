import { useRef, useEffect, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ArrowCounterClockwise from '@/assets/icons/arrow-counter-clockwise.svg';
import Microphone from '@/assets/icons/microphone-white.svg';
import PencilSimpleLine from '@/assets/icons/pencil-simple-line.svg';
import { PrimaryButton } from '@/components/taskhub/primary-button';
import { ScreenHeader } from '@/components/taskhub/screen-header';
import { useTasks } from '@/context/TaskContext';

const COLORS = {
  canvas: '#f9f9fb',
  surface: '#ffffff',
  brand: '#6c3bff',
  border: '#e0e0ea',
  dark: '#111122',
  textPrimary: '#111122',
  textSecondary: '#5a5a70',
};

// Static waveform bar heights to mimic the Figma waveform graphic.
const WAVEFORM = [10, 18, 26, 14, 32, 22, 36, 20, 30, 16, 24, 12, 28, 18, 10];

export default function VoicePostScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ autoStart?: string }>();
  const { setDraftTask } = useTasks();

  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);

  // Transition progress: 0 = Intro, 1 = Recording active
  const transition = useRef(new Animated.Value(0)).current;

  // Sound wave organic bounce animations
  const waveAnims = useRef(WAVEFORM.map(() => new Animated.Value(1))).current;

  useEffect(() => {
    // Start sound wave individual loop sequences
    const waveLoops = waveAnims.map((anim, index) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 2.2,
            duration: 250 + (index % 4) * 80,
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: 0.4,
            duration: 250 + (index % 4) * 80,
            useNativeDriver: false,
          }),
        ])
      );
    });

    waveLoops.forEach((loop) => loop.start());

    return () => {
      waveLoops.forEach((loop) => loop.stop());
    };
  }, []);

  // Set up dynamic timer counting up from 0
  useEffect(() => {
    let interval: any = null;
    if (isRecording) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const handleStartSpeaking = () => {
    setIsRecording(true);
    Animated.timing(transition, {
      toValue: 1,
      duration: 1100, // slower & more fluid
      easing: Easing.bezier(0.25, 1, 0.5, 1.08), // very subtle bounce & premium ease-out
      useNativeDriver: false,
    }).start();
  };

  useEffect(() => {
    if (params.autoStart === 'true') {
      const t: any = setTimeout(() => {
        handleStartSpeaking();
      }, 300);
      return () => clearTimeout(t);
    }
  }, [params.autoStart]);

  const setVoiceDraft = () => {
    setDraftTask({
      title: "Someone to print and do my assignment",
      description: "Print my assignment and deliver to Zik Hall within the next hour",
      service: "Printing & Photocopy, Assignment",
      location: "UI, Ibadan",
      budget: "1,500",
      category: "campus",
    });
  };

  const handleStopRecording = () => {
    setVoiceDraft();
    router.push('/voice-understanding');
  };

  const handleEdit = () => {
    // Navigate back to AI Quick post with filled voiceText parameter
    router.push({
      pathname: '/post',
      params: { voiceText: 'Print my assignment and deliver to Zik Hall within the next hour' },
    });
  };

  const handleRetry = () => {
    setSeconds(0);
    Alert.alert('Recording restarted', 'The mock recording has been reset.');
  };

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Interpolations for transitions
  const opacityIntro = transition.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const opacityRecording = transition.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const translateIntro = transition.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -24],
  });

  const translateRecording = transition.interpolate({
    inputRange: [0, 1],
    outputRange: [24, 0],
  });

  const scaleCircle = transition.interpolate({
    inputRange: [0, 1],
    outputRange: [0.01, 15], // Starts small and scales out to fill background
  });

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="" />

      <View style={styles.body}>
        {/* Header Title animated cross-fade */}
        <View style={styles.promptContainer}>
          <Animated.Text style={[styles.prompt, { opacity: opacityIntro }]}>
            Describe what you need
          </Animated.Text>
          <Animated.Text style={[styles.prompt, styles.promptAbsolute, { opacity: opacityRecording }]}>
            Listening...
          </Animated.Text>
        </View>

        <View style={styles.center}>
          <View style={styles.bubblyContainer}>
            <LinearGradient
              colors={['#6c3bff', '#562fcc', '#412399']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.iconCircle}>
              <Microphone width={30} height={44} />
            </LinearGradient>
          </View>

          {/* Combined middle container containing faded elements */}
          <View style={styles.middleContainer}>
            {/* Intro Text block */}
            <Animated.View 
              style={[styles.info, { opacity: opacityIntro, transform: [{ translateY: translateIntro }] }]} 
              pointerEvents={isRecording ? 'none' : 'auto'}>
              <Text style={styles.title}>Voice Post</Text>
              <Text style={styles.subtitle}>Speak naturally — AI extracts every detail for you.</Text>
            </Animated.View>

            {/* Recording wave block */}
            <Animated.View 
              style={[styles.waveBlock, { opacity: opacityRecording, transform: [{ translateY: translateRecording }] }]} 
              pointerEvents={isRecording ? 'auto' : 'none'}>
              <Text style={styles.timer}>{formatTime(seconds)}</Text>
              <View style={styles.waveform}>
                {WAVEFORM.map((h, i) => {
                  const animHeight = waveAnims[i].interpolate({
                    inputRange: [0.4, 2.2],
                    outputRange: [h * 0.4, h * 2.2],
                  });
                  return (
                    <Animated.View key={i} style={[styles.waveBar, { height: animHeight }]} />
                  );
                })}
              </View>
            </Animated.View>
          </View>

          <View style={styles.exampleCard}>
            <Text style={styles.exampleLabel}>TRY SAYING</Text>
            <Text style={styles.exampleText}>
              &quot;Print my assignment and deliver to Zik Hall within the next hour&quot;
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {/* Recording active controls (secondary Edit & Retry row) */}
        {isRecording && (
          <Animated.View 
            style={[styles.secondaryRow, { opacity: opacityRecording, transform: [{ translateY: translateRecording }] }]} 
            pointerEvents={isRecording ? 'auto' : 'none'}>
            <Pressable style={styles.outlineButton} onPress={handleEdit}>
              <PencilSimpleLine width={16} height={16} />
              <Text style={styles.outlineLabel}>Edit</Text>
            </Pressable>
            <Pressable style={styles.outlineButton} onPress={handleRetry}>
              <ArrowCounterClockwise width={16} height={16} />
              <Text style={styles.outlineLabel}>Retry</Text>
            </Pressable>
          </Animated.View>
        )}

        {/* The Unified Morph Button */}
        <Pressable 
          style={styles.morphButton}
          onPress={isRecording ? handleStopRecording : handleStartSpeaking}>
          
          {/* Black circle expand fill */}
          <Animated.View style={[styles.blackCircleFill, { transform: [{ scale: scaleCircle }] }]} />

          {/* Start Speaking label */}
          <Animated.View style={[styles.buttonLabelContainer, { opacity: opacityIntro }]} pointerEvents={isRecording ? 'none' : 'auto'}>
            <Text style={styles.buttonLabel}>Start Speaking</Text>
          </Animated.View>

          {/* Stop Recording label + icon */}
          <Animated.View style={[styles.buttonLabelContainer, styles.buttonLabelAbsolute, { opacity: opacityRecording }]}>
            <View style={styles.stopIcon} />
            <Text style={styles.buttonLabel}>Stop Recording</Text>
          </Animated.View>
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
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 29,
  },
  promptContainer: {
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  prompt: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.24,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  promptAbsolute: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
  center: {
    marginTop: 33,
    alignItems: 'center',
    gap: 24,
  },
  bubblyContainer: {
    width: 130,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 130,
    height: 130,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  middleContainer: {
    width: '100%',
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  info: {
    position: 'absolute',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  title: {
    fontFamily: 'Geist_700Bold',
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.26,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.24,
    color: COLORS.textSecondary,
    textAlign: 'center',
    width: 234,
  },
  waveBlock: {
    position: 'absolute',
    alignItems: 'center',
    gap: 16,
    width: '100%',
  },
  timer: {
    fontFamily: 'Geist_700Bold',
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.26,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    gap: 4,
  },
  waveBar: {
    width: 3,
    borderRadius: 999,
    backgroundColor: COLORS.brand,
  },
  exampleCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    width: '100%',
  },
  exampleLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    letterSpacing: 0.8,
    color: COLORS.textSecondary,
  },
  exampleText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.41,
    color: COLORS.textPrimary,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  morphButton: {
    height: 48,
    backgroundColor: COLORS.brand,
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: 12,
  },
  blackCircleFill: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.dark,
  },
  buttonLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonLabelAbsolute: {
    position: 'absolute',
  },
  buttonLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: '#ffffff',
  },
  stopIcon: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: '#ffffff',
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 4,
  },
  outlineButton: {
    flex: 1,
    height: 48,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  outlineLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    letterSpacing: -0.24,
    color: COLORS.textPrimary,
  },
});
