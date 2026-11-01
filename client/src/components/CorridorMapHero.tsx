import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadow } from '../theme';
import { naira } from '../utils/format';
import { Avatar, PressableScale } from './ui';
import { User } from '../types';

interface CorridorMapHeroProps {
  origin: string;
  dest: string;
  rideCount: number;
  user: User | null;
  onOpenWallet: () => void;
  onOpenAccount: () => void;
}

export const CorridorMapHero: React.FC<CorridorMapHeroProps> = ({
  origin,
  dest,
  rideCount,
  user,
  onOpenWallet,
  onOpenAccount,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={['#EE6517', '#F26B1D']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, { paddingTop: Math.max(insets.top, 14) }]}
    >
      {/* Top Bar: White Brand Pill + Wallet Pill + Profile Avatar */}
      <View style={styles.topBar}>
        <View style={styles.brandPill}>
          <Image
            source={require('../../assets/brand/logo-transparent.png')}
            style={styles.brandLogo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.rightBar}>
          <PressableScale onPress={onOpenWallet} style={styles.walletPill}>
            <View style={styles.walletDot}>
              <Ionicons name="wallet" size={13} color={colors.white} />
            </View>
            <Text style={styles.walletText} numberOfLines={1}>
              {naira(user?.walletBalance || 0)}
            </Text>
            <Ionicons name="add-circle" size={16} color={colors.orange} />
          </PressableScale>

          <PressableScale onPress={onOpenAccount} style={styles.avatarWrap}>
            <Avatar name={user?.fullName || 'Guest'} size={38} ring />
            <View style={styles.roleTag}>
              <Ionicons
                name={user?.role === 'driver' ? 'car-sport' : user?.role === 'admin' ? 'shield-checkmark' : 'person'}
                size={8.5}
                color={colors.white}
              />
              <Text style={styles.roleTagText}>
                {user?.role === 'driver' ? 'DRIVER' : user?.role === 'admin' ? 'ADMIN' : 'RIDER'}
              </Text>
            </View>
          </PressableScale>
        </View>
      </View>

      {/* Monochromatic Route Status Card */}
      <View style={styles.routeHeaderCard}>
        <View style={styles.routeInfoCol}>
          <Text style={styles.headline}>Inter-City Corridor</Text>
          <View style={styles.routePathRow}>
            <Text style={styles.cityText}>{origin}</Text>
            <Ionicons name="arrow-forward" size={15} color={colors.white} style={{ marginHorizontal: 6 }} />
            <Text style={styles.cityText}>{dest}</Text>
          </View>
        </View>

        <View style={styles.rideCountBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.rideCountText}>
            {rideCount} {rideCount === 1 ? 'ride' : 'rides'}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  brandPill: {
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    ...shadow(2),
  },
  brandLogo: {
    width: 68,
    height: 26,
  },
  rightBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  walletPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.white,
    paddingVertical: 5,
    paddingLeft: 6,
    paddingRight: 10,
    borderRadius: radius.pill,
    ...shadow(2),
  },
  walletDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  avatarWrap: {
    alignItems: 'center',
    position: 'relative',
  },
  roleTag: {
    position: 'absolute',
    bottom: -6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#C2410C',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.white,
    ...shadow(1),
  },
  roleTagText: {
    fontSize: 8,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: 0.5,
  },
  routeHeaderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  routeInfoCol: {
    flex: 1,
  },
  headline: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.85)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  routePathRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cityText: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.white,
  },
  rideCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.white,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    ...shadow(1),
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.orange,
  },
  rideCountText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.orangeDeep,
  },
});
