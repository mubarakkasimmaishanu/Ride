import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Trip } from '../types';
import { colors, radius, shadow } from '../theme';
import { addMinutes, durationLabel, formatTime, naira } from '../utils/format';
import { Avatar, PressableScale } from './ui';

interface TripCardProps {
  trip: Trip;
  onBook: (trip: Trip) => void;
}

export const TripCard: React.FC<TripCardProps> = ({ trip, onBook }) => {
  const depTime = formatTime(trip.departureTime);
  const arrTime = formatTime(addMinutes(trip.departureTime, trip.route.durationMinutes));

  const isFull = trip.availableSeats === 0;
  const isLastSeat = trip.availableSeats === 1;

  return (
    <PressableScale
      onPress={() => !isFull && onBook(trip)}
      disabled={isFull}
      scaleTo={0.985}
      style={[styles.card, isFull && { opacity: 0.6 }]}
    >
      {/* Top Row: Departure & Arrival Time + Price */}
      <View style={styles.topRow}>
        <View style={styles.timeGroup}>
          <Text style={styles.timeText}>{depTime}</Text>
          <Ionicons name="arrow-forward" size={13} color={colors.orange} style={{ marginHorizontal: 5 }} />
          <Text style={styles.timeText}>{arrTime}</Text>
          <Text style={styles.durationBadge}>({durationLabel(trip.route.durationMinutes)})</Text>
        </View>

        <Text style={styles.priceText}>{naira(trip.pricePerSeat)}</Text>
      </View>

      {/* Pickup and Destination Hubs */}
      <View style={styles.routeBox}>
        <View style={styles.hubItem}>
          <View style={[styles.hubDot, { backgroundColor: colors.orange }]} />
          <Text style={styles.hubName} numberOfLines={1}>
            {trip.originHub.name}
          </Text>
        </View>
        <View style={styles.hubLine} />
        <View style={styles.hubItem}>
          <View style={[styles.hubDot, { backgroundColor: colors.orangeDark }]} />
          <Text style={styles.hubName} numberOfLines={1}>
            {trip.destinationHub.name}
          </Text>
        </View>
      </View>

      {/* Driver, Vehicle & Action Footer */}
      <View style={styles.footerRow}>
        <View style={styles.driverCol}>
          <Avatar name={trip.driver.name} size={32} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.driverNameRow}>
              <Text style={styles.driverName} numberOfLines={1}>
                {trip.driver.name}
              </Text>
              <View style={styles.starRow}>
                <Ionicons name="star" size={11} color="#F59E0B" />
                <Text style={styles.ratingText}>{trip.driver.rating.toFixed(1)}</Text>
              </View>
            </View>
            <Text style={styles.carText} numberOfLines={1}>
              {trip.vehicle.make} {trip.vehicle.model}
              {trip.vehicle.hasAirConditioning ? ' · ❄️ AC' : ''}
            </Text>
          </View>
        </View>

        <View style={styles.actionCol}>
          <View
            style={[
              styles.seatBadge,
              isLastSeat && styles.seatBadgeWarning,
              isFull && styles.seatBadgeDanger,
            ]}
          >
            <Text
              style={[
                styles.seatBadgeText,
                isLastSeat && styles.seatBadgeTextWarning,
                isFull && styles.seatBadgeTextDanger,
              ]}
            >
              {isFull ? 'Sold Out' : `${trip.availableSeats} ${trip.availableSeats === 1 ? 'seat' : 'seats'} left`}
            </Text>
          </View>

          <View style={[styles.bookBtn, isFull && styles.bookBtnDisabled]}>
            <Text style={styles.bookBtnText}>{isFull ? 'Full' : 'Book'}</Text>
            {!isFull && <Ionicons name="arrow-forward" size={13} color={colors.white} />}
          </View>
        </View>
      </View>
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.orangeBorder,
    ...shadow(1),
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  timeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.text,
  },
  durationBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: 6,
  },
  priceText: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.orangeDeep,
  },
  routeBox: {
    backgroundColor: colors.orangeSoft,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  hubItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hubDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  hubName: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.text,
  },
  hubLine: {
    width: 1.5,
    height: 8,
    backgroundColor: '#FDBA74',
    marginLeft: 3.25,
    marginVertical: 2,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  driverCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  driverNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  driverName: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.text,
    flexShrink: 1,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  carText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 1,
  },
  actionCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  seatBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.orangeSoft,
    borderWidth: 1,
    borderColor: colors.orangeBorder,
  },
  seatBadgeWarning: {
    backgroundColor: '#FFEDD5',
  },
  seatBadgeDanger: {
    backgroundColor: '#FEE2E2',
  },
  seatBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.orangeDeep,
  },
  seatBadgeTextWarning: {
    color: colors.orange,
  },
  seatBadgeTextDanger: {
    color: colors.danger,
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.orange,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    ...shadow(1),
  },
  bookBtnDisabled: {
    backgroundColor: '#D6D3D1',
  },
  bookBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.white,
  },
});
