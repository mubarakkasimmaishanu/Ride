import React, { useRef, useState } from 'react';
import {
  Animated,
  Image,
  ImageSourcePropType,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadow } from '../theme';
import { PressableScale } from '../components/ui';

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  image: ImageSourcePropType;
}

const SLIDES: Slide[] = [
  {
    id: 'zaria-abu',
    tag: 'ABU SAMARU · ZARIA GATEWAY',
    title: 'Find a ride\ninstantly',
    subtitle: 'Instant seat matching at ABU Samaru, Kongo & Kwangila gates—no motor park stress, no waiting.',
    image: require('../../assets/onboarding/onboarding-1.jpg'),
  },
  {
    id: 'kaduna-kawo',
    tag: 'KAWO FLYOVER · KADUNA METROPOLIS',
    title: 'Comfortable trips\nto Kaduna',
    subtitle: 'Express AC saloons to Kawo Bypass, Command Junction & Kaduna Central on your own schedule.',
    image: require('../../assets/onboarding/onboarding-2.jpg'),
  },
  {
    id: 'kano-gate',
    tag: 'ANCIENT CITY GATE · KANO HUB',
    title: 'Safe corridor rides\nto Kano',
    subtitle: 'Scheduled departures to Kano Ancient City Wall, BUK & Naibawa with 250m Safe Hub privacy.',
    image: require('../../assets/onboarding/onboarding-3.jpg'),
  },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

const useDriver = Platform.OS !== 'web';

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [index, setIndex] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;
  const slideY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const goTo = (next: number) => {
    if (next >= SLIDES.length) {
      onComplete();
      return;
    }
    Animated.timing(fade, { toValue: 0, duration: 150, useNativeDriver: useDriver }).start(() => {
      setIndex(next);
      slideY.setValue(14);
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: useDriver }),
        Animated.spring(slideY, { toValue: 0, friction: 7, tension: 65, useNativeDriver: useDriver }),
      ]).start();
    });
  };

  const current = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  return (
    <View style={styles.root}>
      {/* Full-bleed Sunset Orange Northern Nigerian Illustration */}
      <Animated.Image
        source={current.image}
        style={[styles.bgImage, { opacity: fade }]}
        resizeMode="cover"
      />

      {/* Top warm orange gradient matching onboarding reference sky */}
      <LinearGradient
        colors={['#EE6517', 'rgba(242,107,29,0.86)', 'rgba(242,107,29,0)']}
        locations={[0, 0.34, 0.56]}
        style={styles.topGradient}
        pointerEvents="none"
      />

      {/* Bottom subtle vignette so the pill button pops cleanly over the asphalt road */}
      <LinearGradient
        colors={['rgba(11,27,63,0)', 'rgba(11,27,63,0.45)']}
        style={styles.bottomGradient}
        pointerEvents="none"
      />

      {/* Top Bar: Skip (left) + Brand Pill (right) */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 16) + 6 }]}>
        <Pressable onPress={onComplete} hitSlop={14} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>

        <View style={styles.brandChip}>
          <Image
            source={require('../../assets/brand/logo-transparent.png')}
            style={styles.brandChipLogo}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Editorial Headline Block with Landmark Tag */}
      <Animated.View
        style={[
          styles.copyBlock,
          {
            opacity: fade,
            transform: [{ translateY: slideY }],
          },
        ]}
      >
        <View style={styles.landmarkPill}>
          <Ionicons name="location-sharp" size={12} color="#FFFFFF" />
          <Text style={styles.landmarkText}>{current.tag}</Text>
        </View>
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.subtitle}>{current.subtitle}</Text>
      </Animated.View>

      {/* Professional Bottom Controls: Pagination Dots + Next Icon Button */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 22) + 8 }]}>
        <View style={styles.dotsRow}>
          {SLIDES.map((s, i) => {
            const active = i === index;
            return (
              <Pressable key={s.id} onPress={() => goTo(i)} hitSlop={8}>
                <View style={[styles.dot, active && styles.dotActive]} />
              </Pressable>
            );
          })}
        </View>

        <PressableScale onPress={() => goTo(index + 1)} style={isLast ? styles.getStartedBtn : styles.nextBtn}>
          <Text style={styles.btnLabel}>{isLast ? 'Get Started' : 'Next'}</Text>
          <View style={styles.nextIconCircle}>
            <Ionicons name="arrow-forward" size={17} color={colors.orange} />
          </View>
        </PressableScale>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F26B1D',
    justifyContent: 'space-between',
  },
  bgImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '58%',
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 170,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 2,
  },
  skipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  brandChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    ...shadow(1),
  },
  brandChipLogo: {
    width: 54,
    height: 22,
  },
  copyBlock: {
    paddingHorizontal: 26,
    marginTop: 14,
    marginBottom: 'auto',
    zIndex: 2,
  },
  landmarkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: radius.pill,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  landmarkText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 14.5,
    lineHeight: 21,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.92)',
    marginTop: 10,
    maxWidth: 320,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 2,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  dotActive: {
    width: 26,
    backgroundColor: '#FFFFFF',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.white,
    paddingVertical: 10,
    paddingLeft: 18,
    paddingRight: 10,
    borderRadius: radius.pill,
    ...shadow(3),
  },
  getStartedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.white,
    paddingVertical: 12,
    paddingLeft: 22,
    paddingRight: 12,
    borderRadius: radius.pill,
    ...shadow(3),
  },
  btnLabel: {
    color: colors.orange,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  nextIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.orangeSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
