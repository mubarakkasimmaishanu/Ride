import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadow } from '../theme';
import { haptic } from './ui';

export type AppTab = 'explore' | 'trips' | 'wallet' | 'driver' | 'admin' | 'account';

interface BottomTabBarProps {
  activeTab: AppTab;
  role?: 'passenger' | 'driver' | 'admin';
  onSelect: (tab: AppTab) => void;
}

interface TabItem {
  key: AppTab;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ activeTab, role = 'passenger', onSelect }) => {
  const insets = useSafeAreaInsets();

  // Differentiate navigation completely based on user role
  let items: TabItem[];
  let modeBannerText: string | null = null;
  let modeBannerIcon: keyof typeof Ionicons.glyphMap = 'person';

  if (role === 'driver') {
    modeBannerText = 'DRIVER PARTNER CONSOLE';
    modeBannerIcon = 'car-sport';
    items = [
      { key: 'driver', label: 'Driver Hub', icon: 'speedometer-outline', activeIcon: 'speedometer' },
      { key: 'explore', label: 'Corridor', icon: 'navigate-outline', activeIcon: 'navigate' },
      { key: 'wallet', label: 'Earnings', icon: 'cash-outline', activeIcon: 'cash' },
      { key: 'account', label: 'Driver Profile', icon: 'person-circle-outline', activeIcon: 'person-circle' },
    ];
  } else if (role === 'admin') {
    modeBannerText = 'OPERATIONS ADMIN CONSOLE';
    modeBannerIcon = 'shield-checkmark';
    items = [
      { key: 'admin', label: 'Ops Console', icon: 'shield-checkmark-outline', activeIcon: 'shield-checkmark' },
      { key: 'explore', label: 'Corridor', icon: 'map-outline', activeIcon: 'map' },
      { key: 'wallet', label: 'Treasury', icon: 'analytics-outline', activeIcon: 'analytics' },
      { key: 'account', label: 'Admin Profile', icon: 'shield-outline', activeIcon: 'shield' },
    ];
  } else {
    // Passenger / Guest
    modeBannerText = 'PASSENGER TRAVELER MODE';
    modeBannerIcon = 'person';
    items = [
      { key: 'explore', label: 'Book Ride', icon: 'search-outline', activeIcon: 'search' },
      { key: 'trips', label: 'My Passes', icon: 'ticket-outline', activeIcon: 'ticket' },
      { key: 'wallet', label: 'ride Cash', icon: 'wallet-outline', activeIcon: 'wallet' },
      { key: 'account', label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
    ];
  }

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'web' ? 12 : 10) }]}>
      {/* Role differentiation pill indicator for Driver or Admin mode */}
      {modeBannerText && (
        <View style={styles.roleHeaderBar}>
          <View style={styles.roleBadgePill}>
            <Ionicons name={modeBannerIcon} size={11} color={colors.orangeDeep} />
            <Text style={styles.roleBadgeText}>{modeBannerText}</Text>
          </View>
        </View>
      )}

      <View style={styles.bar}>
        {items.map(it => {
          const active = activeTab === it.key;
          return (
            <Pressable
              key={it.key}
              onPress={() => {
                haptic('light');
                onSelect(it.key);
              }}
              style={styles.tabBtn}
            >
              <View style={[styles.iconPill, active && styles.iconPillActive]}>
                <Ionicons
                  name={active ? it.activeIcon : it.icon}
                  size={20}
                  color={active ? colors.orange : colors.textMuted}
                />
              </View>
              <Text style={[styles.label, active && styles.labelActive]}>{it.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.white,
    borderTopWidth: 1.5,
    borderTopColor: colors.orangeBorder,
    paddingTop: 6,
    paddingHorizontal: 8,
    ...shadow(2),
  },
  roleHeaderBar: {
    alignItems: 'center',
    marginBottom: 4,
  },
  roleBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.orangeSoft,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.orangeBorder,
  },
  roleBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: colors.orangeDeep,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  iconPill: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  iconPillActive: {
    backgroundColor: colors.orangeSoft,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  labelActive: {
    color: colors.orangeDeep,
    fontWeight: '800',
  },
});
