import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../services/api';
import { useSession } from '../state/session';
import { useToast } from '../state/toast';
import { colors, font, radius, shadow } from '../theme';
import { naira } from '../utils/format';
import { Avatar, Badge, Button, IconButton, PressableScale } from '../components/ui';

interface AccountScreenProps {
  onRoleSwitched: (role: 'passenger' | 'driver' | 'admin') => void;
  onReplayIntro: () => void;
  onSignedOut: () => void;
  onOpenWallet?: () => void;
  onOpenTrips?: () => void;
  onOpenDriverHub?: () => void;
  onOpenAdminConsole?: () => void;
}

const PERSONAS = [
  {
    role: 'passenger' as const,
    phone: '08011112222',
    title: 'Amina Yusuf',
    subtitle: 'Passenger · ₦15,000 ride Cash',
    icon: 'person' as const,
  },
  {
    role: 'driver' as const,
    phone: '08033334444',
    title: 'Ahmed Bello',
    subtitle: 'Verified Driver · NURTW Zaria',
    icon: 'car-sport' as const,
  },
  {
    role: 'admin' as const,
    phone: '08000000000',
    title: 'Platform Admin',
    subtitle: 'Union Vetting & Platform KPIs',
    icon: 'shield-checkmark' as const,
  },
];

export const AccountScreen: React.FC<AccountScreenProps> = ({
  onRoleSwitched,
  onReplayIntro,
  onSignedOut,
  onOpenWallet,
  onOpenTrips,
  onOpenDriverHub,
  onOpenAdminConsole,
}) => {
  const insets = useSafeAreaInsets();
  const { user, signIn, signOut } = useSession();
  const toast = useToast();
  const [showSettings, setShowSettings] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const [bookingCount, setBookingCount] = useState<number | null>(null);

  // Dynamically fetch actual bookings for the logged-in passenger
  useEffect(() => {
    api.getMyBookings()
      .then(list => setBookingCount(Array.isArray(list) ? list.length : 0))
      .catch(() => setBookingCount(0));
  }, [user?.id]);

  const handleSwitch = async (role: 'passenger' | 'driver' | 'admin', phone: string, name: string) => {
    setSwitching(role);
    try {
      await signIn(phone, 'password123');
      toast(`Switched to ${name}`, 'success');
      setShowSettings(false);
      onRoleSwitched(role);
    } catch (err: any) {
      toast(err.message || 'Could not switch persona', 'error');
    } finally {
      setSwitching(null);
    }
  };

  const isDriver = user?.role === 'driver';
  const isAdmin = user?.role === 'admin';
  const roleLabel = (user?.role || 'passenger').toUpperCase();
  const displayName = user?.fullName || (isDriver ? 'Accredited Driver' : isAdmin ? 'Ops Officer' : 'Registered Passenger');
  const displayPhone = user?.phoneNumber || 'No phone linked';
  const displayWallet = user?.walletBalance ?? 0;
  const memberTag = isDriver
    ? 'Union-Accredited Driver'
    : isAdmin
    ? 'Platform Operations Officer'
    : 'Verified Passenger';

  const completedTripsLabel =
    bookingCount !== null ? `${bookingCount} ${bookingCount === 1 ? 'Trip' : 'Trips'}` : 'Loading...';

  return (
    <View style={[styles.root, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingBottom: Math.max(insets.bottom, 20) + 16,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topSection}>
          {/* Header Bar */}
          <View style={styles.headerRow}>
            <Text style={font.h1}>{isDriver ? 'Driver Profile' : isAdmin ? 'Admin Profile' : 'Profile'}</Text>
            <PressableScale
              onPress={() => setShowSettings(true)}
              style={styles.settingsBtn}
            >
              <Ionicons name="settings-outline" size={20} color={colors.orange} />
              <View style={styles.settingsBadgeDot} />
            </PressableScale>
          </View>

          {/* Dynamic Active Profile Card */}
          <View style={styles.profileCard}>
            <Avatar name={displayName} size={60} ring />
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName} numberOfLines={1}>{displayName}</Text>
              <Text style={styles.profilePhone}>{displayPhone}</Text>
              <View style={styles.badgeRow}>
                <Badge
                  label={roleLabel}
                  tone="orange"
                  icon={isDriver ? 'car-sport' : isAdmin ? 'shield-checkmark' : 'checkmark-circle'}
                />
                <Text style={styles.memberTag}>{memberTag}</Text>
              </View>
            </View>
          </View>

          {/* Dynamic Stats Summary Row - Tailored to Role */}
          <View style={styles.statsRow}>
            <PressableScale
              onPress={onOpenWallet}
              style={styles.statTile}
            >
              <Text style={styles.statLabel}>
                {isDriver ? 'Earnings Balance' : isAdmin ? 'Treasury Balance' : 'Wallet Balance'}
              </Text>
              <Text style={styles.statValue}>{naira(displayWallet)}</Text>
            </PressableScale>

            <View style={styles.statDivider} />

            <PressableScale
              onPress={isDriver ? onOpenDriverHub : isAdmin ? onOpenAdminConsole : onOpenTrips}
              style={styles.statTile}
            >
              <Text style={styles.statLabel}>
                {isDriver ? 'Corridor Trips' : isAdmin ? 'Vetting Queue' : 'Corridor Rides'}
              </Text>
              <Text style={styles.statValue}>
                {isDriver ? '42 Done' : isAdmin ? '3 Pending' : completedTripsLabel}
              </Text>
            </PressableScale>

            <View style={styles.statDivider} />

            <View style={styles.statTile}>
              <Text style={styles.statLabel}>{isDriver ? 'Driver Rating' : isAdmin ? 'System SLA' : 'Safety Rating'}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Ionicons name={isDriver || !isAdmin ? 'star' : 'flash'} size={13} color="#F59E0B" />
                <Text style={styles.statValue}>{isDriver ? '4.9' : isAdmin ? '100%' : '5.0'}</Text>
              </View>
            </View>
          </View>

          {/* Account Menu - Role Specific Actions */}
          <View style={styles.menuCard}>
            {isDriver && onOpenDriverHub && (
              <PressableScale onPress={onOpenDriverHub} style={styles.menuRow}>
                <View style={[styles.menuIcon, { backgroundColor: colors.orangeSoft }]}>
                  <Ionicons name="speedometer-outline" size={18} color={colors.orange} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuTitle}>Driver Hub & Active Rides</Text>
                  <Text style={styles.menuSub}>Publish routes & check 4-digit passenger PINs</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </PressableScale>
            )}

            {isAdmin && onOpenAdminConsole && (
              <PressableScale onPress={onOpenAdminConsole} style={styles.menuRow}>
                <View style={[styles.menuIcon, { backgroundColor: colors.orangeSoft }]}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={colors.orange} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuTitle}>Operations Console & Driver Vetting</Text>
                  <Text style={styles.menuSub}>Review Union slips, licenses & platform KPIs</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </PressableScale>
            )}

            {!isDriver && !isAdmin && onOpenTrips && (
              <PressableScale onPress={onOpenTrips} style={styles.menuRow}>
                <View style={[styles.menuIcon, { backgroundColor: colors.orangeSoft }]}>
                  <Ionicons name="ticket-outline" size={18} color={colors.orange} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuTitle}>My Bookings & Passes</Text>
                  <Text style={styles.menuSub}>Active QR boarding passes & route receipts</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </PressableScale>
            )}

            {onOpenWallet && (
              <PressableScale onPress={onOpenWallet} style={styles.menuRow}>
                <View style={[styles.menuIcon, { backgroundColor: colors.orangeSoft }]}>
                  <Ionicons name="wallet-outline" size={18} color={colors.orange} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuTitle}>
                    {isDriver ? 'Earnings & Bank Settlements' : isAdmin ? 'Platform Escrow & Treasury' : 'ride Cash & Instant Refunds'}
                  </Text>
                  <Text style={styles.menuSub}>
                    {isDriver ? 'Track net 93% payouts & top up float' : isAdmin ? 'Review fee escrow & settlements' : 'Add funds & 1-second cancellation protection'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </PressableScale>
            )}

            {isDriver && (
              <PressableScale
                onPress={() => toast('Vehicle: Toyota Corolla · Plate: KDT-381-AA · NURTW Zaria', 'info')}
                style={styles.menuRow}
              >
                <View style={[styles.menuIcon, { backgroundColor: colors.orangeSoft }]}>
                  <Ionicons name="car-sport-outline" size={18} color={colors.orange} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuTitle}>Vehicle & Union Accreditation</Text>
                  <Text style={styles.menuSub}>NURTW Zaria Branch · Plate KDT-381-AA</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </PressableScale>
            )}

            <PressableScale
              onPress={() => setShowSettings(true)}
              style={styles.menuRow}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.orangeSoft }]}>
                <Ionicons name="flask-outline" size={18} color={colors.orange} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuTitle}>Testing & Role Switcher</Text>
                <Text style={styles.menuSub}>Switch between Passenger, Driver & Admin</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </PressableScale>

            <PressableScale
              onPress={() => toast('Safe Hub meeting points are geofenced for 250m privacy', 'info')}
              style={styles.menuRowLast}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.orangeSoft }]}>
                <Ionicons name="shield-checkmark-outline" size={18} color={colors.orange} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuTitle}>Safety Hubs & Privacy Vault</Text>
                <Text style={styles.menuSub}>ABU Samaru · Kawo Bypass · Kano City Gates</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </PressableScale>
          </View>
        </View>

        {/* Bottom Section: Sign Out Button + App Version */}
        <View style={styles.bottomSection}>
          <Button
            title="Sign Out"
            variant="outline"
            icon="log-out-outline"
            onPress={async () => {
              await signOut();
              onSignedOut();
            }}
          />
          <Text style={styles.versionText}>
            ride Inter-City Mobility v1.2 · Zaria–Kaduna–Kano
          </Text>
        </View>
      </ScrollView>

      {/* Settings & Role Switcher Modal */}
      <Modal
        visible={showSettings}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowSettings(false)} />
          <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
            <View style={styles.sheetHandle} />

            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Testing & Role Settings</Text>
                <Text style={styles.modalSubtitle}>Switch persona to test app features</Text>
              </View>
              <IconButton
                icon="close"
                size={34}
                bg={colors.orangeSoft}
                color={colors.orange}
                onPress={() => setShowSettings(false)}
              />
            </View>

            {/* Persona Switcher List */}
            <View style={{ gap: 8, marginTop: 4 }}>
              {PERSONAS.map(p => {
                const active = user?.role === p.role;
                return (
                  <PressableScale
                    key={p.role}
                    onPress={() => handleSwitch(p.role, p.phone, p.title)}
                    disabled={Boolean(switching)}
                    style={[styles.personaOption, active && styles.personaOptionActive]}
                  >
                    <View style={[styles.personaIconWrap, active && styles.personaIconWrapActive]}>
                      <Ionicons
                        name={p.icon}
                        size={18}
                        color={active ? colors.white : colors.orange}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.personaTitle, active && { color: colors.orangeDeep }]}>
                        {p.title}
                      </Text>
                      <Text style={styles.personaSub}>{p.subtitle}</Text>
                    </View>
                    {active ? (
                      <Badge label="Active" tone="orange" />
                    ) : (
                      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                    )}
                  </PressableScale>
                );
              })}
            </View>

            {/* Tour & Demo Preview */}
            <PressableScale
              onPress={() => {
                setShowSettings(false);
                onReplayIntro();
              }}
              style={styles.replayTile}
            >
              <View style={[styles.personaIconWrap, { backgroundColor: colors.orangeSoft }]}>
                <Ionicons name="sparkles" size={16} color={colors.orange} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.personaTitle}>Replay Splash & Onboarding</Text>
                <Text style={styles.personaSub}>View logo flash screen and landmark tour</Text>
              </View>
              <Ionicons name="play-circle" size={20} color={colors.orange} />
            </PressableScale>

            <Button
              title="Close Settings"
              variant="dark"
              size="md"
              onPress={() => setShowSettings(false)}
              style={{ marginTop: 8 }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    paddingHorizontal: 20,
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  topSection: {
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.orangeBorder,
    ...shadow(1),
  },
  settingsBadgeDot: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.orange,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.orangeBorder,
    ...shadow(1),
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  profilePhone: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  memberTag: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: colors.orangeBorder,
    ...shadow(1),
  },
  statTile: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 3,
  },
  statValue: {
    fontSize: 14.5,
    fontWeight: '900',
    color: colors.text,
  },
  statDivider: {
    width: 1,
    height: 26,
    backgroundColor: colors.orangeBorder,
  },
  menuCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.orangeBorder,
    overflow: 'hidden',
    ...shadow(1),
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.orangeSoft,
  },
  menuRowLast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  menuSub: {
    fontSize: 11.5,
    fontWeight: '500',
    color: colors.textMuted,
    marginTop: 2,
  },
  bottomSection: {
    marginTop: 24,
    gap: 12,
  },
  versionText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textMuted,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(28, 25, 23, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 12,
    ...shadow(3),
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.orangeBorder,
    alignSelf: 'center',
    marginBottom: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  modalSubtitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 2,
  },
  personaOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.orangeSoft,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: colors.orangeBorder,
  },
  personaOptionActive: {
    backgroundColor: colors.orangeTint,
    borderColor: colors.orange,
  },
  personaIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personaIconWrapActive: {
    backgroundColor: colors.orange,
  },
  personaTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.text,
  },
  personaSub: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textMuted,
    marginTop: 1,
  },
  replayTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.orangeSoft,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: colors.orangeBorder,
  },
});
