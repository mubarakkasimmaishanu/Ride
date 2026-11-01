import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Platform, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

interface SplashScreenViewProps {
  onFinish: () => void;
}

const useDriver = Platform.OS !== 'web';

export const SplashScreenView: React.FC<SplashScreenViewProps> = ({ onFinish }) => {
  const logoScale = useRef(new Animated.Value(0.82)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const tagTranslate = useRef(new Animated.Value(14)).current;
  const tagOpacity = useRef(new Animated.Value(0)).current;
  const barProgress = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const pulseScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, { toValue: 1.08, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: useDriver }),
        Animated.timing(pulseScale, { toValue: 0.9, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: useDriver }),
      ])
    ).start();

    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 55,
          useNativeDriver: useDriver,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: useDriver,
        }),
      ]),
      Animated.parallel([
        Animated.timing(tagOpacity, {
          toValue: 1,
          duration: 380,
          useNativeDriver: useDriver,
        }),
        Animated.timing(tagTranslate, {
          toValue: 0,
          duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: useDriver,
        }),
        Animated.timing(barProgress, {
          toValue: 1,
          duration: 1250,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: false,
        }),
      ]),
      Animated.delay(220),
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 320,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: useDriver,
      }),
    ]).start(() => onFinish());
  }, [barProgress, containerOpacity, logoOpacity, logoScale, onFinish, pulseScale, tagOpacity, tagTranslate]);

  const barWidth = barProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={[styles.root, { opacity: containerOpacity }]}>
      {/* Soft ambient brand glow */}
      <Animated.View style={[styles.glowTop, { transform: [{ scale: pulseScale }] }]} />
      <Animated.View style={[styles.glowBottom, { transform: [{ scale: pulseScale }] }]} />

      <View style={styles.center}>
        <Animated.View
          style={[
            styles.logoWrap,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Image
            source={require('../../assets/brand/logo-transparent.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.taglineWrap,
            {
              opacity: tagOpacity,
              transform: [{ translateY: tagTranslate }],
            },
          ]}
        >
          <View style={styles.corridorPill}>
            <View style={styles.liveDot} />
            <Text style={styles.corridorText}>ZARIA  ·  KADUNA  ·  KANO</Text>
          </View>
          <Text style={styles.subText}>Fast, verified inter-city rides</Text>
        </Animated.View>
      </View>

      {/* Bottom sleek speed loader */}
      <View style={styles.footer}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFillWrap, { width: barWidth }]}>
            <LinearGradient
              colors={[colors.orange, '#FF944D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.progressFill}
            />
          </Animated.View>
        </View>
        <Text style={styles.trustCaption}>Road Transport Union Accredited · ₦150 Trip Insurance</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAF5F0',
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
  },
  glowTop: {
    position: 'absolute',
    top: -120,
    right: -90,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(242, 107, 29, 0.14)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: -110,
    left: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(234, 88, 12, 0.10)',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoWrap: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#FED7AA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 220,
    height: 100,
  },
  taglineWrap: {
    alignItems: 'center',
    marginTop: 20,
    gap: 8,
  },
  corridorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF7ED',
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#FED7AA',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.orange,
  },
  corridorText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    color: colors.orangeDeep,
  },
  subText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 2,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 48,
    paddingBottom: 42,
    gap: 14,
  },
  progressTrack: {
    width: 168,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#FED7AA',
    overflow: 'hidden',
  },
  progressFillWrap: {
    height: '100%',
  },
  progressFill: {
    flex: 1,
    borderRadius: 999,
  },
  trustCaption: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 0.2,
  },
});
