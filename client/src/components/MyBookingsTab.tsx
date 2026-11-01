import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../services/api';
import { KEYS, storage } from '../services/storage';
import { Booking } from '../types';
import { colors, font, radius, shadow } from '../theme';
import { formatDay, formatTime, naira } from '../utils/format';
import { Badge, EmptyState, PressableScale, Skeleton } from './ui';

interface MyBookingsTabProps {
  onOpenBoardingPass: (booking: Booking) => void;
  onBrowseRides?: () => void;
}

export const MyBookingsTab: React.FC<MyBookingsTabProps> = ({ onOpenBoardingPass, onBrowseRides }) => {
  const insets = useSafeAreaInsets();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'active' | 'past'>('active');

  const loadBookings = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await api.getMyBookings();
      setBookings(data);
      await storage.set(KEYS.passes, JSON.stringify(data.slice(0, 20)));
    } catch {
      const cached = await storage.get(KEYS.passes);
      if (cached) setBookings(JSON.parse(cached));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const filtered = bookings.filter(b => {
    const status = b.booking_status || b.bookingStatus || 'confirmed';
    return filter === 'active' ? status === 'confirmed' || status === 'pending' : status === 'cancelled' || status === 'completed';
  });

  return (
    <View style={[styles.root, { paddingTop: Math.max(insets.top, 16) + 6 }]}>
      <View style={styles.header}>
        <Text style={font.h1}>Your Trips</Text>
        <Text style={font.bodySm}>Offline boarding passes & unlocked meeting points</Text>

        <View style={styles.segment}>
          {([
            ['active', 'Upcoming & Active'],
            ['past', 'Cancelled & Past'],
          ] as const).map(([key, label]) => {
            const active = filter === key;
            return (
              <Pressable
                key={key}
                onPress={() => setFilter(key)}
                style={[styles.segBtn, active && styles.segBtnActive]}
              >
                <Text style={[styles.segText, active && styles.segTextActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadBookings(true)} tintColor={colors.orange} />}
      >
        {loading ? (
          <View style={{ gap: 12 }}>
            <Skeleton height={150} r={20} />
            <Skeleton height={150} r={20} />
          </View>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="ticket-outline"
            title={filter === 'active' ? 'No active passes yet' : 'No past or cancelled trips'}
            subtitle="Book a seat on Zaria, Kaduna or Kano corridors to unlock your QR boarding pass and exact Safe Hub spot."
            actionLabel={filter === 'active' && onBrowseRides ? 'Find a Ride' : undefined}
            onAction={onBrowseRides}
          />
        ) : (
          filtered.map(b => {
            const status = b.booking_status || b.bookingStatus || 'confirmed';
            const total = b.total_amount ?? b.totalAmount ?? 0;
            const ref = b.booking_reference || b.bookingReference || '';
            const origin = b.origin_city || b.originCity || '';
            const dest = b.destination_city || b.destinationCity || '';
            const originHub = b.origin_hub_name || b.originHubName || '';
            const destHub = b.destination_hub_name || b.destinationHubName || '';
            const seats = b.seats_booked || b.seatsBooked || 1;
            const pin = b.boarding_pin || b.boardingPin || '8492';
            const dep = b.departure_time || b.departureTime;
            const confirmed = status === 'confirmed';

            return (
              <PressableScale
                key={b.id}
                onPress={() => onOpenBoardingPass(b)}
                style={styles.card}
              >
                <View style={styles.cardTop}>
                  <View>
                    <Text style={styles.refCode}>{ref}</Text>
                    <Text style={styles.routeTitle}>
                      {origin} → {dest}
                    </Text>
                  </View>
                  <Badge
                    label={confirmed ? 'Confirmed' : status.toUpperCase()}
                    tone={confirmed ? 'success' : 'danger'}
                    icon={confirmed ? 'checkmark-circle' : 'close-circle'}
                  />
                </View>

                <View style={styles.hubBox}>
                  <View style={styles.hubRow}>
                    <View style={[styles.dot, { backgroundColor: colors.orange }]} />
                    <Text style={styles.hubText} numberOfLines={1}>{originHub}</Text>
                  </View>
                  <View style={styles.hubRow}>
                    <View style={[styles.dot, { backgroundColor: colors.charcoal }]} />
                    <Text style={styles.hubText} numberOfLines={1}>{destHub}</Text>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                    <Text style={styles.metaText}>
                      {dep ? `${formatDay(dep)} · ${formatTime(dep)}` : 'Scheduled'}
                    </Text>
                  </View>
                  <Text style={styles.fareText}>
                    {seats} seat{seats > 1 ? 's' : ''} · {naira(total)}
                  </Text>
                </View>

                <View style={styles.cardFooter}>
                  <View style={styles.pinPill}>
                    <Ionicons name="qr-code-outline" size={14} color={colors.orange} />
                    <Text style={styles.pinPillLabel}>PIN</Text>
                    <Text style={styles.pinPillVal}>{pin}</Text>
                  </View>

                  <View style={styles.openPassBtn}>
                    <Text style={styles.openPassText}>Open Pass</Text>
                    <Ionicons name="arrow-forward" size={14} color={colors.white} />
                  </View>
                </View>
              </PressableScale>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: 4,
    marginTop: 14,
  },
  segBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  segBtnActive: {
    backgroundColor: colors.white,
    ...shadow(1),
  },
  segText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  segTextActive: {
    color: colors.orangeDeep,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#FED7AA',
    ...shadow(1),
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  refCode: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
    color: colors.orange,
  },
  routeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginTop: 2,
  },
  hubBox: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#FED7AA',
    padding: 10,
    gap: 6,
    marginBottom: 12,
  },
  hubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  hubText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  fareText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.text,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
  },
  pinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.orangeSoft,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  pinPillLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  pinPillVal: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.orange,
    letterSpacing: 1.5,
  },
  openPassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.orange,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
  },
  openPassText: {
    color: colors.white,
    fontSize: 12.5,
    fontWeight: '800',
  },
});
