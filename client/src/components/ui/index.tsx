import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, font, gradients, radius, shadow } from '../../theme';
import { initials } from '../../utils/format';

type IconName = keyof typeof Ionicons.glyphMap;

export const haptic = (kind: 'light' | 'medium' | 'success' | 'error' = 'light') => {
  if (Platform.OS === 'web') return;
  if (kind === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  else if (kind === 'error') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  else
    Haptics.impactAsync(kind === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light).catch(
      () => {}
    );
};

/* ------------------------------------------------------------------ */
/* PressableScale — gives every tappable surface a tactile press feel  */
/* ------------------------------------------------------------------ */
interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  children?: React.ReactNode;
}

export const PressableScale: React.FC<PressableScaleProps> = ({ style, scaleTo = 0.97, children, onPress, disabled, ...rest }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const animate = (to: number) =>
    Animated.spring(scale, { toValue: to, useNativeDriver: Platform.OS !== 'web', speed: 40, bounciness: 6 }).start();

  const flattened = StyleSheet.flatten(style);
  const outerStyle: StyleProp<ViewStyle> = flattened?.flex !== undefined ? { flex: flattened.flex } : undefined;

  return (
    <Pressable
      {...rest}
      style={outerStyle}
      disabled={disabled}
      onPressIn={() => animate(scaleTo)}
      onPressOut={() => animate(1)}
      onPress={e => {
        haptic('light');
        onPress?.(e);
      }}
    >
      <Animated.View style={[style, { transform: [{ scale }] }, disabled && { opacity: 0.5 }]}>{children}</Animated.View>
    </Pressable>
  );
};

/* ------------------------------------------------------------------ */
/* Button                                                              */
/* ------------------------------------------------------------------ */
type ButtonVariant = 'primary' | 'dark' | 'blue' | 'outline' | 'ghost' | 'light' | 'danger';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  iconRight?: IconName;
  loading?: boolean;
  disabled?: boolean;
  size?: 'md' | 'lg' | 'sm';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  icon,
  iconRight,
  loading,
  disabled,
  size = 'lg',
  style,
  textStyle,
}) => {
  const height = size === 'lg' ? 54 : size === 'md' ? 46 : 38;
  const fontSize = size === 'sm' ? 13 : 15.5;
  const fg =
    variant === 'outline' || variant === 'ghost' || variant === 'light'
      ? variant === 'light'
        ? colors.orange
        : colors.navy
      : colors.white;

  const content = (
    <View style={[styles.btnInner, { height }]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={size === 'sm' ? 16 : 19} color={fg} />}
          <Text style={[styles.btnText, { color: fg, fontSize }, textStyle]} numberOfLines={1}>
            {title}
          </Text>
          {iconRight && <Ionicons name={iconRight} size={size === 'sm' ? 16 : 19} color={fg} />}
        </>
      )}
    </View>
  );

  const base: StyleProp<ViewStyle> = [styles.btn, { borderRadius: size === 'sm' ? radius.sm : radius.md }];

  return (
    <PressableScale onPress={onPress} disabled={disabled || loading} style={[base, style]}>
      {variant === 'primary' ? (
        <LinearGradient colors={['#F26B1D', '#E05609']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[base, shadow(2)]}>
          {content}
        </LinearGradient>
      ) : (
        <View
          style={[
            base,
            (variant === 'dark' || variant === 'blue') && { backgroundColor: colors.charcoal },
            variant === 'danger' && { backgroundColor: colors.danger },
            variant === 'light' && { backgroundColor: colors.white },
            variant === 'outline' && { borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.white },
            variant === 'ghost' && { backgroundColor: colors.surfaceAlt },
          ]}
        >
          {content}
        </View>
      )}
    </PressableScale>
  );
};

/* ------------------------------------------------------------------ */
/* Card, Chip, Badge, Avatar, IconButton                               */
/* ------------------------------------------------------------------ */
export const Card: React.FC<{ style?: StyleProp<ViewStyle>; children?: React.ReactNode; onPress?: () => void }> = ({
  style,
  children,
  onPress,
}) =>
  onPress ? (
    <PressableScale onPress={onPress} style={[styles.card, style]} scaleTo={0.985}>
      {children}
    </PressableScale>
  ) : (
    <View style={[styles.card, style]}>{children}</View>
  );

export const Chip: React.FC<{
  label: string;
  active?: boolean;
  icon?: IconName;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}> = ({ label, active, icon, onPress, style }) => (
  <PressableScale onPress={onPress} style={[styles.chip, active && styles.chipActive, style]}>
    {icon && <Ionicons name={icon} size={15} color={active ? colors.white : colors.navy} />}
    <Text style={[styles.chipText, active && { color: colors.white }]}>{label}</Text>
  </PressableScale>
);

export const Badge: React.FC<{
  label: string;
  tone?: 'success' | 'warning' | 'danger' | 'blue' | 'neutral' | 'orange' | 'dark';
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}> = ({ label, tone = 'neutral', icon, style }) => {
  const map: Record<string, [string, string]> = {
    success: [colors.successSoft, colors.success],
    warning: [colors.warningSoft, colors.warning],
    danger: [colors.dangerSoft, colors.danger],
    blue: [colors.surfaceAlt, colors.charcoal],
    dark: [colors.charcoal, colors.white],
    orange: [colors.orangeSoft, colors.orange],
    neutral: [colors.surfaceAlt, colors.textSecondary],
  };
  const [bg, fg] = map[tone] || map.neutral;
  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      {icon && <Ionicons name={icon} size={11} color={fg} />}
      <Text style={[styles.badgeText, { color: fg }]}>{label}</Text>
    </View>
  );
};

const AVATAR_COLORS = ['#F26B1D', '#EA580C', '#C2410C', '#D97706', '#9A3412'];

export const Avatar: React.FC<{ name?: string; size?: number; style?: StyleProp<ViewStyle>; ring?: boolean }> = ({
  name,
  size = 44,
  style,
  ring,
}) => {
  const idx = (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: AVATAR_COLORS[idx],
          alignItems: 'center',
          justifyContent: 'center',
        },
        ring && { borderWidth: 2.5, borderColor: colors.white },
        style,
      ]}
    >
      <Text style={{ color: colors.white, fontWeight: '800', fontSize: size * 0.36 }}>{initials(name)}</Text>
    </View>
  );
};

export const IconButton: React.FC<{
  icon: IconName;
  onPress?: () => void;
  color?: string;
  bg?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  badge?: boolean;
}> = ({ icon, onPress, color = colors.navy, bg = colors.white, size = 44, style, badge }) => (
  <PressableScale
    onPress={onPress}
    scaleTo={0.9}
    style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }, style]}
  >
    <Ionicons name={icon} size={size * 0.48} color={color} />
    {badge && <View style={styles.dotBadge} />}
  </PressableScale>
);

/* ------------------------------------------------------------------ */
/* Skeleton shimmer                                                    */
/* ------------------------------------------------------------------ */
export const Skeleton: React.FC<{ width?: number | `${number}%`; height?: number; style?: StyleProp<ViewStyle>; r?: number }> = ({
  width = '100%',
  height = 16,
  style,
  r = 8,
}) => {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: Platform.OS !== 'web' }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.View style={[{ width, height, borderRadius: r, backgroundColor: '#E4E8F0', opacity }, style]} />;
};

export const TripCardSkeleton = () => (
  <View style={[styles.card, { gap: 12 }]}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Skeleton width={90} height={22} />
      <Skeleton width={70} height={22} />
    </View>
    <Skeleton width="80%" />
    <Skeleton width="60%" />
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
      <Skeleton width={40} height={40} r={20} />
      <Skeleton width="50%" />
    </View>
  </View>
);

/* ------------------------------------------------------------------ */
/* EmptyState / ErrorState                                             */
/* ------------------------------------------------------------------ */
export const EmptyState: React.FC<{
  icon: IconName;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: 'orange' | 'blue' | 'danger';
}> = ({ icon, title, subtitle, actionLabel, onAction, tone = 'orange' }) => {
  const c = tone === 'blue' ? colors.blue : tone === 'danger' ? colors.danger : colors.orange;
  const bg = tone === 'blue' ? colors.blueSoft : tone === 'danger' ? colors.dangerSoft : colors.orangeSoft;
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={30} color={c} />
      </View>
      <Text style={[font.h3, { textAlign: 'center' }]}>{title}</Text>
      {subtitle && <Text style={[font.bodySm, { textAlign: 'center', marginTop: 6, lineHeight: 19 }]}>{subtitle}</Text>}
      {actionLabel && (
        <Button title={actionLabel} onPress={onAction} size="md" variant="dark" style={{ marginTop: 18, alignSelf: 'stretch' }} />
      )}
    </View>
  );
};

export const SectionTitle: React.FC<{ title: string; action?: string; onAction?: () => void; style?: StyleProp<ViewStyle> }> = ({
  title,
  action,
  onAction,
  style,
}) => (
  <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }, style]}>
    <Text style={font.h3}>{title}</Text>
    {action && (
      <Pressable onPress={onAction} hitSlop={10}>
        <Text style={{ color: colors.blue, fontWeight: '700', fontSize: 14 }}>{action}</Text>
      </Pressable>
    )}
  </View>
);

const styles = StyleSheet.create({
  btn: { overflow: 'hidden' },
  btnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 20 },
  btnText: { fontWeight: '800', letterSpacing: 0.2 },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 16,
    ...shadow(1),
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipText: { fontSize: 13, fontWeight: '700', color: colors.navy },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 11, fontWeight: '800' },
  dotBadge: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.orange,
    borderWidth: 2,
    borderColor: colors.white,
  },
  empty: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 24 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
});
