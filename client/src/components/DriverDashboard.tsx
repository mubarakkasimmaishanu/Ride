import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../services/api';
import { useToast } from '../state/toast';
import { SafeHub } from '../types';
import { colors, font, radius, shadow } from '../theme';
import { formatDay, formatTime, naira } from '../utils/format';
import { Avatar, Badge, Button, EmptyState, IconButton, PressableScale, SectionTitle, Skeleton } from './ui';

interface DriverDashboardProps {
  safeHubs: SafeHub[];
  onTripCreated: () => void;
}

export const DriverDashboard: React.FC<DriverDashboardProps> = ({ safeHubs, onTripCreated }) => {
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  // Manifest sheet
  const [manifestTrip, setManifestTrip] = useState<any | null>(null);
  const [manifest, setManifest] = useState<any[]>([]);
  const [loadingManifest, setLoadingManifest] = useState(false);

  // Publish Form
  const [originCity, setOriginCity] = useState<'Zaria' | 'Kaduna' | 'Kano'>('Zaria');
  const [destCity, setDestCity] = useState<'Zaria' | 'Kaduna' | 'Kano'>('Kaduna');
  const [originHubId, setOriginHubId] = useState('');
  const [destHubId, setDestHubId] = useState('');
  const [pricePerSeat, setPricePerSeat] = useState('2000');
  const [exactSpot, setExactSpot] = useState('');
  const [directions, setDirections] = useState('');
  const [publishing, setPublishing] = useState(false);

  const loadDriverTrips = async () => {
    setLoading(true);
    try {
      const data = await api.getDriverTrips();
      setTrips(data);
    } catch (err: any) {
      toast(err.message || 'Could not load driver trips', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDriverTrips();
  }, []);

  const originHubs = safeHubs.filter(h => h.city === originCity);
  const destHubs = safeHubs.filter(h => h.city === destCity);

  useEffect(() => {
    if (originHubs.length > 0 && !originHubs.some(h => h.id === originHubId)) {
      setOriginHubId(originHubs[0].id);
    }
    if (destHubs.length > 0 && !destHubs.some(h => h.id === destHubId)) {
      setDestHubId(destHubs[0].id);
    }
  }, [originCity, destCity, safeHubs]);

  const handlePublishTrip = async () => {
    if (originCity === destCity) {
      toast('Origin and destination cities must be different', 'error');
      return;
    }
    if (!originHubId || !destHubId || !exactSpot.trim()) {
      toast('Select Safe Hubs and enter your exact micro-spot', 'error');
      return;
    }
    setPublishing(true);
    try {
      const departureTime = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
      await api.createTrip({
        originCity,
        destinationCity: destCity,
        originHubId,
        destinationHubId: destHubId,
        departureTime,
        pricePerSeat: parseFloat(pricePerSeat) || 2000,
        exactMeetingPoint: exactSpot.trim(),
        landmarkDirections: directions.trim(),
      });
      toast('Ride published live across the corridor!', 'success');
      setShowPublishModal(false);
      setExactSpot('');
      setDirections('');
      loadDriverTrips();
      onTripCreated();
    } catch (err: any) {
      toast(err.message || 'Could not publish trip', 'error');
    } finally {
      setPublishing(false);
    }
  };

  const handleConfirmCancel = async (tripId: string) => {
    try {
      const res = await api.cancelTrip(tripId);
      toast(res.message, 'info');
      setConfirmCancelId(null);
      loadDriverTrips();
      onTripCreated();
    } catch (err: any) {
      toast(err.message || 'Cancel failed', 'error');
    }
  };

  const handleViewManifest = async (trip: any) => {
    setManifestTrip(trip);
    setLoadingManifest(true);
    try {
      const list = await api.getTripManifest(trip.id);
      setManifest(list);
    } catch (err: any) {
      toast(err.message || 'Failed to load manifest', 'error');
    } finally {
      setLoadingManifest(false);
    }
  };

  const totalSeatsBooked = trips
    .filter(t => t.status === 'published' || t.status === 'full')
    .reduce((acc, t) => acc + (t.booked_seats || 0), 0);

  const projectedRevenue = trips
    .filter(t => t.status !== 'cancelled')
    .reduce((acc, t) => acc + (t.booked_seats || 0) * (t.price_per_seat || 0) * 0.93, 0);

  return (
    <View style={[styles.root, { paddingTop: Math.max(insets.top, 16) + 6 }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.topHeader}>
          <View>
            <Text style={font.h1}>Driver Hub</Text>
            <Text style={font.bodySm}>Accredited Union Partner Console</Text>
          </View>
          <Button
            title="Publish Ride"
            icon="add"
            size="md"
            variant="primary"
            onPress={() => setShowPublishModal(true)}
          />
        </View>

        {/* Bolt Driver Earnings & Rating Hero Card */}
        <LinearGradient
          colors={['#C2410C', '#EA580C', '#F26B1D']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.unionBadgePill}>
            <Ionicons name="shield-checkmark" size={14} color="#22C55E" />
            <Text style={styles.unionBadgeText}>NURTW ACCREDITED · ZARIA BRANCH</Text>
          </View>

          <View style={styles.kpiRow}>
            <View style={styles.kpiBox}>
              <Text style={styles.kpiVal}>{naira(projectedRevenue)}</Text>
              <Text style={styles.kpiLabel}>Net Payout (93%)</Text>
            </View>
            <View style={styles.kpiSep} />
            <View style={styles.kpiBox}>
              <Text style={styles.kpiVal}>{totalSeatsBooked}</Text>
              <Text style={styles.kpiLabel}>Booked Riders</Text>
            </View>
            <View style={styles.kpiSep} />
            <View style={styles.kpiBox}>
              <Text style={styles.kpiVal}>4.9 ★</Text>
              <Text style={styles.kpiLabel}>Gold Tier (7%)</Text>
            </View>
          </View>
        </LinearGradient>

        <SectionTitle title="Published Corridor Rides" style={{ marginTop: 22 }} />

        {loading ? (
          <View style={{ gap: 12 }}>
            <Skeleton height={140} r={20} />
            <Skeleton height={140} r={20} />
          </View>
        ) : trips.length === 0 ? (
          <EmptyState
            icon="car-sport-outline"
            title="No rides published yet"
            subtitle="Monetize empty seats on your next Zaria, Kaduna, or Kano highway trip."
            actionLabel="Publish Your First Ride"
            onAction={() => setShowPublishModal(true)}
          />
        ) : (
          trips.map(t => {
            const active = t.status === 'published' || t.status === 'full';
            return (
              <View key={t.id} style={styles.tripCard}>
                <View style={styles.tripCardTop}>
                  <View>
                    <Text style={styles.tripRoute}>
                      {t.origin_city} → {t.destination_city}
                    </Text>
                    <Text style={styles.tripTime}>
                      {formatDay(t.departure_time)} · {formatTime(t.departure_time)}
                    </Text>
                  </View>
                  <Badge
                    label={t.status.toUpperCase()}
                    tone={active ? 'success' : 'danger'}
                  />
                </View>

                <Text style={styles.hubLine} numberOfLines={1}>
                  {t.origin_hub_name} → {t.destination_hub_name}
                </Text>

                <View style={styles.statsStrip}>
                  <Text style={styles.statChip}>
                    Seats: <Text style={styles.statStrong}>{t.booked_seats}/{t.total_seats}</Text>
                  </Text>
                  <Text style={styles.statChip}>
                    Fare: <Text style={styles.statStrong}>{naira(t.price_per_seat)}</Text>
                  </Text>
                </View>

                {confirmCancelId === t.id ? (
                  <View style={styles.confirmBar}>
                    <Text style={styles.confirmText}>Cancel & refund riders in 1s?</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <Pressable onPress={() => setConfirmCancelId(null)} style={styles.keepBtn}>
                        <Text style={styles.keepBtnText}>Keep</Text>
                      </Pressable>
                      <Pressable onPress={() => handleConfirmCancel(t.id)} style={styles.doCancelBtn}>
                        <Text style={styles.doCancelText}>Yes, Cancel</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View style={styles.actionsRow}>
                    <PressableScale
                      onPress={() => handleViewManifest(t)}
                      style={styles.manifestBtn}
                    >
                      <Ionicons name="people-outline" size={16} color={colors.orangeDeep} />
                      <Text style={styles.manifestBtnText}>Manifest & PINs</Text>
                    </PressableScale>

                    {active && (
                      <PressableScale
                        onPress={() => setConfirmCancelId(t.id)}
                        style={styles.cancelTrigger}
                      >
                        <Ionicons name="close-circle-outline" size={16} color={colors.danger} />
                        <Text style={styles.cancelTriggerText}>Cancel</Text>
                      </PressableScale>
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Publish Trip Bottom Sheet */}
      <Modal visible={showPublishModal} transparent animationType="slide" onRequestClose={() => setShowPublishModal(false)}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowPublishModal(false)} />
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <Text style={font.h2}>Publish Corridor Ride</Text>
              <IconButton icon="close" size={34} bg={colors.surfaceAlt} onPress={() => setShowPublishModal(false)} />
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Origin City</Text>
              <View style={styles.pillRow}>
                {(['Zaria', 'Kaduna', 'Kano'] as const).map(c => (
                  <Pressable
                    key={c}
                    onPress={() => {
                      setOriginCity(c);
                      if (c === destCity) setDestCity(c === 'Zaria' ? 'Kaduna' : 'Zaria');
                    }}
                    style={[styles.cityPill, originCity === c && styles.cityPillActive]}
                  >
                    <Text style={[styles.cityPillText, originCity === c && { color: colors.white }]}>{c}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.label}>Origin Safe Hub ({originCity})</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {originHubs.map(h => (
                  <Pressable
                    key={h.id}
                    onPress={() => setOriginHubId(h.id)}
                    style={[styles.hubChip, originHubId === h.id && styles.hubChipActive]}
                  >
                    <Text style={[styles.hubChipText, originHubId === h.id && { color: colors.orange }]}>{h.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Text style={styles.label}>Destination City</Text>
              <View style={styles.pillRow}>
                {(['Zaria', 'Kaduna', 'Kano'] as const).filter(c => c !== originCity).map(c => (
                  <Pressable
                    key={c}
                    onPress={() => setDestCity(c)}
                    style={[styles.cityPill, destCity === c && styles.cityPillActive]}
                  >
                    <Text style={[styles.cityPillText, destCity === c && { color: colors.white }]}>{c}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.label}>Destination Safe Hub ({destCity})</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {destHubs.map(h => (
                  <Pressable
                    key={h.id}
                    onPress={() => setDestHubId(h.id)}
                    style={[styles.hubChip, destHubId === h.id && styles.hubChipActive]}
                  >
                    <Text style={[styles.hubChipText, destHubId === h.id && { color: colors.orange }]}>{h.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Text style={styles.label}>Fare Per Seat (NGN · Includes ₦150 Insurance)</Text>
              <View style={styles.pillRow}>
                {['2000', '2800', '3500', '4500'].map(p => (
                  <Pressable
                    key={p}
                    onPress={() => setPricePerSeat(p)}
                    style={[styles.hubChip, pricePerSeat === p && styles.hubChipActive]}
                  >
                    <Text style={[styles.hubChipText, pricePerSeat === p && { color: colors.orange }]}>{naira(Number(p))}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.label}>Exact Micro-Spot (Hidden until passenger pays)</Text>
              <TextInput
                style={styles.input}
                value={exactSpot}
                onChangeText={setExactSpot}
                placeholder="e.g. Parked opposite Total main office by tyre bay"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.label}>Vehicle Clue / Directions</Text>
              <TextInput
                style={styles.input}
                value={directions}
                onChangeText={setDirections}
                placeholder="e.g. Silver Corolla, hazard lights on"
                placeholderTextColor={colors.textMuted}
              />

              <Button
                title="Publish Ride Now"
                variant="primary"
                loading={publishing}
                onPress={handlePublishTrip}
                style={{ marginTop: 6 }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Passenger Manifest Modal */}
      <Modal visible={Boolean(manifestTrip)} transparent animationType="slide" onRequestClose={() => setManifestTrip(null)}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setManifestTrip(null)} />
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <View>
                <Text style={font.h2}>Passenger Manifest</Text>
                <Text style={font.bodySm}>
                  {manifestTrip?.origin_city} → {manifestTrip?.destination_city}
                </Text>
              </View>
              <IconButton icon="close" size={34} bg={colors.surfaceAlt} onPress={() => setManifestTrip(null)} />
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, gap: 10 }}>
              {loadingManifest ? (
                <Skeleton height={80} r={16} />
              ) : manifest.length === 0 ? (
                <EmptyState
                  icon="people-outline"
                  title="No paid passengers yet"
                  subtitle="Confirmed riders and their 4-digit offline boarding PINs appear here."
                />
              ) : (
                manifest.map(p => (
                  <View key={p.id} style={styles.manifestRow}>
                    <Avatar name={p.passenger_name} size={42} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.passName}>{p.passenger_name}</Text>
                      <Text style={styles.passSub}>
                        {p.passenger_phone} · {p.seats_booked} seat(s)
                      </Text>
                    </View>
                    <View style={styles.pinBox}>
                      <Text style={styles.pinBoxLabel}>PIN</Text>
                      <Text style={styles.pinBoxVal}>{p.boarding_pin}</Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 110 },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroCard: {
    borderRadius: 24,
    padding: 20,
    ...shadow(2),
  },
  unionBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    marginBottom: 16,
  },
  unionBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.6,
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpiBox: { flex: 1, alignItems: 'center' },
  kpiSep: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.16)' },
  kpiVal: { fontSize: 19, fontWeight: '900', color: colors.white },
  kpiLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.72)', marginTop: 2 },
  tripCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#FED7AA',
    ...shadow(1),
  },
  tripCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tripRoute: { fontSize: 17, fontWeight: '800', color: colors.text },
  tripTime: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginTop: 2 },
  hubLine: { fontSize: 12.5, fontWeight: '600', color: colors.textSecondary, marginTop: 8 },
  statsStrip: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  statChip: { fontSize: 12.5, fontWeight: '600', color: colors.textSecondary },
  statStrong: { fontWeight: '800', color: colors.text },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  manifestBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.orangeSoft,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  manifestBtnText: { fontSize: 13, fontWeight: '800', color: colors.orangeDeep },
  cancelTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.dangerSoft,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  cancelTriggerText: { fontSize: 13, fontWeight: '800', color: colors.danger },
  confirmBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.dangerSoft,
    padding: 10,
    borderRadius: radius.md,
    marginTop: 12,
  },
  confirmText: { fontSize: 12, fontWeight: '700', color: colors.danger },
  keepBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.white },
  keepBtnText: { fontSize: 12, fontWeight: '700', color: colors.text },
  doCancelBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.danger },
  doCancelText: { fontSize: 12, fontWeight: '800', color: colors.white },
  backdrop: { flex: 1, backgroundColor: 'rgba(28,25,23,0.6)', justifyContent: 'flex-end' },
  sheet: { width: '100%', maxWidth: 500, alignSelf: 'center', backgroundColor: colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '90%', paddingTop: 10 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1', alignSelf: 'center', marginBottom: 8 },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  label: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  pillRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  cityPill: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  cityPillActive: { backgroundColor: colors.orange, borderColor: colors.orange },
  cityPillText: { fontSize: 13, fontWeight: '700', color: colors.text },
  hubChip: {
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: radius.pill,
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: '#FED7AA',
  },
  hubChipActive: { backgroundColor: colors.orangeSoft, borderColor: colors.orange },
  hubChipText: { fontSize: 12.5, fontWeight: '700', color: colors.text },
  input: {
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  manifestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.bg,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  passName: { fontSize: 14.5, fontWeight: '800', color: colors.text },
  passSub: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginTop: 2 },
  pinBox: {
    backgroundColor: colors.orangeSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  pinBoxLabel: { fontSize: 9, fontWeight: '800', color: colors.textSecondary },
  pinBoxVal: { fontSize: 17, fontWeight: '900', color: colors.orange, letterSpacing: 1 },
});
