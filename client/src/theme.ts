/**
 * ride — Monochromatic Orange Brand Design System
 * Grounded directly in the official Onboarding visual identity:
 * - Signature Monochromatic Warm Orange (#F26B1D / #EE6517 / #C2410C)
 * - Warm Cream / Peach Canvas (#FAF5F0) matching the original design reference
 * - Pure White cards with warm peach borders (#FED7AA / #E7E5E4)
 * - Warm Espresso typography (#1C1917) — zero cold navy blues or flashy rainbow tones
 * - Brand Orange primary CTA buttons (#F26B1D) across every screen
 */
import { Platform, TextStyle, ViewStyle } from 'react-native';

export const colors = {
  // Official Brand Monochromatic Orange Core
  primary: '#F26B1D',
  primaryDark: '#D9580D',
  primaryDeep: '#C2410C',
  primaryLight: '#FB923C',
  primarySoft: '#FFF7ED',
  primaryTint: '#FFEDD5',
  primaryBorder: '#FED7AA',

  // Semantic Orange Aliases
  orange: '#F26B1D',
  orangeDark: '#D9580D',
  orangeDeep: '#C2410C',
  orangeLight: '#FB923C',
  orangeSoft: '#FFF7ED',
  orangeTint: '#FFEDD5',
  orangeBorder: '#FED7AA',

  // Canvas & Surfaces (Warm Peach Cream matching onboarding reference)
  bg: '#FAF5F0',
  surface: '#FFFFFF',
  surfaceAlt: '#FFF7ED',
  surfaceWarm: '#F5EBE1',
  border: '#E7E5E4',
  borderLight: '#F5EBE1',
  borderWarm: '#FED7AA',
  divider: '#F5EBE1',
  white: '#FFFFFF',

  // Typography (Warm Espresso / Stone)
  text: '#1C1917',
  textSecondary: '#57534E',
  textMuted: '#A8A29E',

  // Warm Charcoal / Contrast Accents (Replaced cold blues)
  charcoal: '#1C1917',
  obsidian: '#1C1917',
  slateDark: '#292524',
  slate: '#57534E',
  navy: '#1C1917',
  navyDeep: '#18181B',
  navySoft: '#292524',

  // Mapped legacy blue aliases directly to Monochromatic Brand Orange
  blue: '#F26B1D',
  blueSoft: '#FFF7ED',

  // Semantic States (Warm-toned)
  success: '#15803D',
  successSoft: '#F0FDF4',
  danger: '#DC2626',
  dangerSoft: '#FEF2F2',
  warning: '#D97706',
  warningSoft: '#FFFBEB',
};

export const gradients = {
  sunset: ['#EE6517', '#F26B1D', '#F97316'] as const,
  warmCard: ['#C2410C', '#EA580C', '#F26B1D'] as const,
  cream: ['#FFFFFF', '#FFF7ED'] as const,
  obsidian: ['#292524', '#1C1917'] as const,
  navy: ['#292524', '#1C1917'] as const,
  card: ['#C2410C', '#EA580C', '#F26B1D'] as const,
};

export const radius = { xs: 6, sm: 10, md: 14, lg: 20, xl: 28, pill: 999 };
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const font = {
  hero: { fontSize: 32, fontWeight: '800', letterSpacing: -0.7, color: colors.text } as TextStyle,
  h1: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5, color: colors.text } as TextStyle,
  h2: { fontSize: 19, fontWeight: '800', letterSpacing: -0.3, color: colors.text } as TextStyle,
  h3: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2, color: colors.text } as TextStyle,
  body: { fontSize: 14, fontWeight: '500', color: colors.text } as TextStyle,
  bodySm: { fontSize: 12.5, fontWeight: '500', color: colors.textSecondary } as TextStyle,
  caption: { fontSize: 11, fontWeight: '600', color: colors.textMuted } as TextStyle,
  overline: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textMuted,
  } as TextStyle,
};

export const shadow = (level: 1 | 2 | 3 = 1): ViewStyle => {
  const map = {
    1: { opacity: 0.05, radius: 8, y: 2, elevation: 1 },
    2: { opacity: 0.09, radius: 14, y: 4, elevation: 3 },
    3: { opacity: 0.15, radius: 24, y: 8, elevation: 6 },
  }[level];
  return Platform.select({
    web: { boxShadow: `0px ${map.y}px ${map.radius}px rgba(242,107,29,${map.opacity * 0.7})` } as any,
    default: {
      shadowColor: '#C2410C',
      shadowOpacity: map.opacity,
      shadowRadius: map.radius,
      shadowOffset: { width: 0, height: map.y },
      elevation: map.elevation,
    },
  }) as ViewStyle;
};
